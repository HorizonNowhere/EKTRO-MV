export interface Caption { startMs: number; endMs: number; text: string }

function toMs(stamp: string): number {
  const m = stamp.trim().match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!m) return Number.NaN;
  return (+m[1]) * 3600000 + (+m[2]) * 60000 + (+m[3]) * 1000 + (+m[4]);
}

export function parseSrt(text: string): Caption[] {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n\s*\n/);
  const out: Caption[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    const timeLine = lines.find((l) => l.includes('-->'));
    if (!timeLine) continue;
    const [a, b] = timeLine.split('-->');
    const startMs = toMs(a);
    const endMs = toMs(b);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) continue;
    const textLines = lines.slice(lines.indexOf(timeLine) + 1);
    if (textLines.length === 0) continue;
    out.push({ startMs, endMs, text: textLines.join(' ') });
  }
  return out;
}
