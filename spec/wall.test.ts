import { expect, inject, it } from 'vitest';
const base = inject('baseUrl');
async function visitor() {
  const res = await fetch(base);
  return res.headers.get('set-cookie')!.split(';')[0];
}
const headers = (cookie: string) => ({ cookie, 'Content-Type': 'application/json' });
it('shares saved notes across visitors without leaking ownership credentials, and enforces deletion ownership', async () => {
  const a = await visitor(), b = await visitor();
  const body = `A real shared trace ${crypto.randomUUID()}`;
  const res = await fetch(`${base}/api/notes`, { method: 'POST', headers: headers(a), body: JSON.stringify({ name: 'Spec visitor', kind: 'idea', body }) });
  expect(res.status).toBe(201);
  const note = await res.json();
  try {
    const other = await (await fetch(`${base}/api/notes`, { headers: headers(b) })).json();
    const shared = other.notes.find((n: { id: string }) => n.id === note.id);
    expect(shared.body).toBe(body);
    expect(shared.mine).toBe(false);
    expect(shared).not.toHaveProperty('owner');
    expect((await fetch(`${base}/notes/${note.id}`)).status).toBe(200);
    expect((await fetch(`${base}/api/notes/${note.id}`, { method: 'DELETE', headers: headers(b) })).status).toBe(404);
    expect(await (await fetch(`${base}/?filter=mine`, { headers: headers(a) })).text()).toContain(body);
  } finally { await fetch(`${base}/api/notes/${note.id}`, { method: 'DELETE', headers: headers(a) }); }
  expect((await fetch(`${base}/notes/${note.id}`)).status).toBe(404);
});
it('renders user markup as text rather than executable HTML', async () => {
  const cookie = await visitor();
  const res = await fetch(`${base}/api/notes`, { method: 'POST', headers: headers(cookie), body: JSON.stringify({ name: '<b>guest</b>', kind: 'question', body: '<script>alert(1)</script>' }) });
  const n = await res.json();
  try {
    const page = await (await fetch(`${base}/notes/${n.id}`)).text();
    expect(page).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(page).not.toContain('<script>alert');
  } finally { await fetch(`${base}/api/notes/${n.id}`, { method: 'DELETE', headers: headers(cookie) }); }
});
it.each([
  { name: '', kind: 'idea', body: 'note' },
  { name: 'visitor', kind: 'wrong', body: 'note' },
  { name: 'visitor', kind: 'idea', body: ' ' },
  { name: 'visitor', kind: 'idea', body: 'a'.repeat(401) },
])('rejects invalid notes on the server: %j', async data => {
  expect((await fetch(`${base}/api/notes`, { method: 'POST', headers: headers(await visitor()), body: JSON.stringify(data) })).status).toBe(400);
});
it('rejects foreign origins and form submissions', async () => {
  const cookie = await visitor();
  expect((await fetch(`${base}/api/notes`, { method: 'POST', headers: { ...headers(cookie), origin: 'https://elsewhere.invalid' }, body: '{}' })).status).toBe(403);
  expect((await fetch(`${base}/api/notes`, { method: 'POST', body: 'body=hello' })).status).toBe(415);
});
