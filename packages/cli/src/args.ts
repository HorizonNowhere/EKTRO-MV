export interface ParsedArgs {
  oneLiner: string;
  out?: string;
  workDir?: string;
  brief?: string;
  subtitles: boolean;
  help: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const res: ParsedArgs = { oneLiner: '', subtitles: false, help: false };
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') res.help = true;
    else if (a === '--out') res.out = argv[++i];
    else if (a === '--workdir') res.workDir = argv[++i];
    else if (a === '--brief') res.brief = argv[++i];
    else if (a === '--subtitles') res.subtitles = true;
    else if (a === '--skip-subtitles') res.subtitles = false;
    else if (!a.startsWith('-')) positional.push(a);
  }
  res.oneLiner = positional.join(' ').trim();
  return res;
}
