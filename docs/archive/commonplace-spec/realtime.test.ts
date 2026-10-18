import { expect, inject, it } from 'vitest';
const base = inject('baseUrl');
it('notifies another connected visitor after committed writes and deletions, and resynchronises on reconnect', async () => {
  const cookie = (await fetch(base)).headers.get('set-cookie')!.split(';')[0];
  const headers = { cookie, 'Content-Type': 'application/json' };
  const abort = new AbortController();
  const response = await fetch(`${base}/api/events`, { signal: abort.signal });
  expect(response.headers.get('content-type')).toContain('text/event-stream');
  const reader = response.body!.getReader();
  let buffer = '';
  async function event() {
    const timeout = setTimeout(() => abort.abort(), 3000);
    try {
      while (!buffer.includes('\n\n')) { const part = await reader.read(); if (part.done) throw new Error('Stream closed'); buffer += new TextDecoder().decode(part.value); }
      const end = buffer.indexOf('\n\n'); const result = buffer.slice(0,end); buffer = buffer.slice(end+2); return result;
    } finally { clearTimeout(timeout); }
  }
  let id: string | undefined;
  try {
    expect(await event()).toContain('event: changed');
    const start = performance.now();
    const created = await fetch(`${base}/api/notes`, { method: 'POST', headers, body: JSON.stringify({ name: 'Live spec', kind: 'idea', body: `Live ${crypto.randomUUID()}` }) });
    expect(created.status).toBe(201); id = (await created.json()).id;
    expect(await event()).toContain('event: changed');
    const snapshot = await (await fetch(`${base}/api/wall`)).json();
    expect(snapshot.html).toContain(id);
    expect(snapshot.html).not.toContain('data-delete');
    console.log(`Live event plus snapshot: ${Math.round(performance.now()-start)}ms`);
    const own = await (await fetch(`${base}/api/wall?filter=mine`, { headers })).json();
    expect(own.html).toContain(id);
    expect((await (await fetch(`${base}/api/wall?filter=question`)).json()).html).not.toContain(id);
    await fetch(`${base}/api/notes/${id}`, { method: 'DELETE', headers });
    expect(await event()).toContain('event: changed');
    expect((await (await fetch(`${base}/api/wall?note=${id}`)).json()).html).toBe('');
  } finally {
    abort.abort();
    if (id) await fetch(`${base}/api/notes/${id}`, { method: 'DELETE', headers });
  }
  const reconnect = new AbortController();
  try {
    const resumed = await fetch(`${base}/api/events`, { signal: reconnect.signal });
    const first = await resumed.body!.getReader().read();
    expect(new TextDecoder().decode(first.value)).toContain('event: changed');
  } finally { reconnect.abort(); }
});
