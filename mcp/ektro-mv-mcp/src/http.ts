import { timingSafeEqual } from 'node:crypto';
import type { Server } from 'node:http';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { NextFunction, Request, Response } from 'express';
import type { CreateDeps, DoctorDeps } from './handler.js';
import { createEktroMvServer } from './server.js';

export interface HttpConfig {
  host: string;
  port: number;
  token?: string;
  allowedHosts?: string[];
}

export interface HttpAppDeps {
  runtime: CreateDeps & DoctorDeps;
  stderr?: (line: string) => void;
}

export function loadHttpConfig(env: NodeJS.ProcessEnv = process.env): HttpConfig {
  const host = env.EKTRO_MV_MCP_HOST?.trim() || '127.0.0.1';
  const port = parsePort(env.EKTRO_MV_MCP_PORT);
  const token = env.EKTRO_MV_MCP_TOKEN?.trim() || undefined;
  const allowedHosts = env.EKTRO_MV_MCP_ALLOWED_HOSTS
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!isLoopback(host)) {
    if (!token) {
      throw new Error('EKTRO_MV_MCP_TOKEN is required when EKTRO_MV_MCP_HOST is not loopback');
    }
    if (!allowedHosts?.length) {
      throw new Error('EKTRO_MV_MCP_ALLOWED_HOSTS is required when EKTRO_MV_MCP_HOST is not loopback');
    }
  }
  return { host, port, token, allowedHosts: allowedHosts?.length ? allowedHosts : undefined };
}

export function createHttpApp(config: HttpConfig, deps: HttpAppDeps) {
  const stderr = deps.stderr ?? ((line: string) => process.stderr.write(`${line}\n`));
  const app = createMcpExpressApp({ host: config.host, allowedHosts: config.allowedHosts });

  app.get('/healthz', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'ektro-mv-mcp', transport: 'streamable-http', version: '0.2.0' });
  });

  app.all('/mcp', (req: Request, res: Response, next: NextFunction) => {
    if (!config.token || bearerMatches(req.headers.authorization, config.token)) return next();
    res.setHeader('WWW-Authenticate', 'Bearer');
    return res.status(401).json({ error: 'unauthorized' });
  });

  app.post('/mcp', async (req: Request, res: Response) => {
    const server = createEktroMvServer(deps.runtime);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      stderr(`ektro-mv-mcp-http request failed: ${safeErrorMessage(error)}`);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    } finally {
      await Promise.allSettled([transport.close(), server.close()]);
    }
  });

  app.get('/mcp', (_req: Request, res: Response) => methodNotAllowed(res));
  app.delete('/mcp', (_req: Request, res: Response) => methodNotAllowed(res));
  return app;
}

export function listenHttp(app: ReturnType<typeof createHttpApp>, config: HttpConfig): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(config.port, config.host, () => resolve(server));
    server.once('error', reject);
  });
}

function parsePort(raw: string | undefined): number {
  if (!raw?.trim()) return 3210;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('EKTRO_MV_MCP_PORT must be an integer between 1 and 65535');
  }
  return port;
}

function isLoopback(host: string): boolean {
  return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

function bearerMatches(header: string | undefined, expected: string): boolean {
  if (!header?.startsWith('Bearer ')) return false;
  const actual = Buffer.from(header.slice('Bearer '.length), 'utf8');
  const target = Buffer.from(expected, 'utf8');
  return actual.length === target.length && timingSafeEqual(actual, target);
}

function methodNotAllowed(res: Response) {
  return res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed.' },
    id: null,
  });
}

function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.name : 'unknown error';
}
