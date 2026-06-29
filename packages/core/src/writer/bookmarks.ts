import type { BookmarkNode, PdfNode } from '../types.js';

export function collectBookmarks(node: PdfNode, result: BookmarkNode[] = []): BookmarkNode[] {
  if (node.type === 'bookmark') result.push(node as BookmarkNode);
  for (const child of node.children) collectBookmarks(child, result);
  return result;
}
