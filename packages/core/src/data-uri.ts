export function decodeDataUri(src: string): Uint8Array {
  const commaIdx = src.indexOf(',');
  if (commaIdx === -1) throw new Error(`Invalid data URI: ${src.slice(0, 60)}`);
  const meta = src.slice(5, commaIdx);
  const data = src.slice(commaIdx + 1);

  if (meta.includes(';base64')) {
    return Uint8Array.from(atob(data), (ch) => ch.charCodeAt(0));
  }
  return new TextEncoder().encode(decodeURIComponent(data));
}
