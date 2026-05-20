const BLOCKED_TAGS = /<\/?(script|iframe|object|embed|form|input|button|link|meta|style)\b[^>]*>/gi
const EVENT_HANDLERS = /\s+on\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi
const JAVASCRIPT_URLS = /\s+(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi

export function sanitizeBlogHtml(html: string): string {
  return html
    .replace(BLOCKED_TAGS, '')
    .replace(EVENT_HANDLERS, '')
    .replace(JAVASCRIPT_URLS, '')
    .trim()
}
