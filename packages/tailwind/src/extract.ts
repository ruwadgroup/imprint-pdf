const STATIC_CLASS_RE = /className\s*=\s*["']([^"']+)["']/g;
const TEMPLATE_CLASS_RE = /className\s*=\s*\{`([^`${}]+)`\}/g;
const EXPRESSION_STRING_RE = /className\s*=\s*\{["']([^"']+)["']\}/g;

export function extractClasses(code: string): string[] {
  const found: string[] = [];
  for (const re of [STATIC_CLASS_RE, TEMPLATE_CLASS_RE, EXPRESSION_STRING_RE]) {
    re.lastIndex = 0;
    let match = re.exec(code);
    while (match !== null) {
      if (match[1]) {
        for (const cls of match[1].split(/\s+/)) {
          if (cls) found.push(cls);
        }
      }
      match = re.exec(code);
    }
  }
  return found;
}
