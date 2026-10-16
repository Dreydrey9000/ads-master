export function authorizedSync(header: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < 32 || !header?.startsWith('Bearer ')) return false;
  const given = header.slice(7);
  if (given.length !== secret.length) return false;
  let difference = 0;
  for (let i=0; i<secret.length; i++) difference |= given.charCodeAt(i) ^ secret.charCodeAt(i);
  return difference === 0;
}
export async function boundedBody(request: Request, limit = 200000): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw Error('INVALID_REPORT');
  const reader = request.body?.getReader(); if (!reader) throw Error('INVALID_REPORT');
  const decoder = new TextDecoder(); let text = '', size = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > limit) { await reader.cancel(); throw Error('INVALID_REPORT'); } text += decoder.decode(value, { stream: true }); }
  return JSON.parse(text + decoder.decode());
}
