import { staticFile } from 'remotion';

export function resolveUrl(src: string): string {
  if (/^(https?:|file:|data:)/.test(src)) return src;
  return staticFile(src);
}
