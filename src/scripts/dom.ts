export const $ = <T extends Element = Element>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
export const $$ = <T extends Element = Element>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
export const escapeHtml = (s: string): string =>
  String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
