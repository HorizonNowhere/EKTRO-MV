export interface ParsedArgs { oneLiner: string; out?: string; workDir?: string; help: boolean }

export function parseArgs(argv: string[]): ParsedArgs {
  const res: ParsedArgs = { oneLiner: '', help: false };
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') res.help = true;
    else if (a === '--out') res.out = argv[++i];
    else if (a === '--workdir') res.workDir = argv[++i];
    else if (!a.startsWith('-')) positional.push(a);
  }
  res.oneLiner = positional.join(' ').trim();
  return res;
}
