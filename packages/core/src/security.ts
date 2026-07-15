export interface RedactSecretsOptions {
  secrets?: ReadonlyArray<string | undefined>;
  maxLength?: number;
}

/**
 * Remove credentials and secret-bearing URL components before an error reaches
 * a terminal, CI log, or agent host. Exact configured values are replaced
 * before truncation so a length boundary cannot expose a secret prefix.
 */
export function redactSecrets(message: string, options: RedactSecretsOptions = {}): string {
  let redacted = message;

  const secrets = (options.secrets ?? [])
    .filter((value): value is string => Boolean(value && value.length >= 4))
    .sort((a, b) => b.length - a.length);
  for (const value of secrets) redacted = redacted.replaceAll(value, '[REDACTED]');

  redacted = redacted
    .replace(
      /(authorization\s*[:=]\s*(?:bearer\s+)?)[^\s,;"']+/gi,
      '$1[REDACTED]',
    )
    .replace(
      /((?:api[_-]?key|access[_-]?token|token|signature)\s*[:=]\s*)[^\s,;&"']+/gi,
      '$1[REDACTED]',
    )
    .replace(/https?:\/\/[^\s<>"']+/gi, (candidate) => sanitizeUrlForLogs(candidate));

  return truncateRedactedMessage(redacted, options.maxLength ?? 1_000);
}

/** Return a log-safe URL without userinfo, query parameters, or fragments. */
export function sanitizeUrlForLogs(value: string): string {
  try {
    const url = new URL(value);
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return '[invalid URL]';
  }
}

function truncateRedactedMessage(message: string, maxLength: number): string {
  if (message.length <= maxLength) return message;

  const marker = '[REDACTED]';
  const truncated = message.slice(0, maxLength);
  const incompleteMarker = truncated.lastIndexOf('[');
  const suffix = incompleteMarker >= 0 ? truncated.slice(incompleteMarker) : '';
  if (incompleteMarker >= 0 && marker.startsWith(suffix) && suffix !== marker) {
    const prefixLength = Math.min(incompleteMarker, Math.max(0, maxLength - marker.length));
    return `${message.slice(0, prefixLength)}${marker}`;
  }
  return truncated;
}
