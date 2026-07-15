import { describe, expect, it } from 'vitest';
import { redactSecrets, sanitizeUrlForLogs } from '../src/security.js';

describe('redactSecrets', () => {
  it('removes configured values, authorization headers, and secret parameters', () => {
    const message = [
      'key=secret-ark-value',
      'Authorization: Bearer bearer-value',
      'api_key=query-value',
      'https://user:pass@cdn.example/video.mp4?token=url-value#fragment',
    ].join(' ');

    const result = redactSecrets(message, { secrets: ['secret-ark-value'] });

    expect(result).not.toContain('secret-ark-value');
    expect(result).not.toContain('bearer-value');
    expect(result).not.toContain('query-value');
    expect(result).not.toContain('user:pass');
    expect(result).not.toContain('url-value');
    expect(result).toContain('https://cdn.example/video.mp4');
  });

  it('replaces a configured secret before truncating the message', () => {
    const secret = 'secret-crossing-the-old-boundary';
    const result = redactSecrets(`${'x'.repeat(995)}${secret}`, {
      secrets: [secret],
      maxLength: 1_000,
    });

    expect(result).not.toContain(secret.slice(0, 5));
    expect(result).toContain('[REDACTED]');
  });
});

describe('sanitizeUrlForLogs', () => {
  it('keeps routing context while removing credentials and signed parameters', () => {
    expect(sanitizeUrlForLogs('https://user:pass@example.com/path/video.mp4?token=secret#part'))
      .toBe('https://example.com/path/video.mp4');
  });

  it('does not reflect malformed URL input', () => {
    expect(sanitizeUrlForLogs('not a url?token=secret')).toBe('[invalid URL]');
  });
});
