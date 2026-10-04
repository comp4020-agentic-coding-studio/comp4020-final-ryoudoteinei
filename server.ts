import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dataDir = resolve(process.env.DATA_DIR || 'data');
mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(resolve(dataDir, 'commonplace.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS notes (
 id TEXT PRIMARY KEY, owner TEXT NOT NULL, name TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('idea','question','discovery')),
 body TEXT NOT NULL, created TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS notes_created ON notes(created);
 CREATE INDEX IF NOT EXISTS notes_owner ON notes(owner);`);
type Note = { id: string; owner?: string; name: string; kind: string; body: string; created: string; mine?: boolean };
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const kinds = ['idea', 'question', 'discovery'];
function identity(req: IncomingMessage, res: ServerResponse) {
  let token = req.headers.cookie?.match(/(?:^|;\s*)commonplace=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!token) {
    token = randomBytes(32).toString('hex');
    res.setHeader('Set-Cookie', `commonplace=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  }
  return createHash('sha256').update(token).digest('hex');
}
function list(owner: string, filter = 'all', page = 1) {
  const clause = filter === 'mine' ? 'WHERE owner = ?' : kinds.includes(filter) ? 'WHERE kind = ?' : '';
  const args = filter === 'mine' ? [owner] : kinds.includes(filter) ? [filter] : [];
  const rows = db.prepare(`SELECT * FROM notes ${clause} ORDER BY created DESC, id DESC LIMIT 25 OFFSET ?`).all(...args, (page - 1) * 24) as unknown as Note[];
  return { more: rows.length > 24, notes: rows.slice(0, 24).map(({ owner: author, ...note }) => ({ ...note, mine: owner === author })) };
}
function card(n: Note) {
  return `<article class="note ${escape(n.kind)}" id="note-${escape(n.id)}"><div class="note-top"><span class="category">${escape(n.kind)}</span><a class="note-link" href="/notes/${escape(n.id)}" aria-label="Permanent link to note">↗</a></div><p class="note-body">${escape(n.body)}</p><footer><span>${escape(n.name)}${n.mine ? ' <small>· you</small>' : ''}</span><time datetime="${escape(n.created)}">${new Date(n.created).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</time></footer>${n.mine ? `<button class="remove" data-delete="${escape(n.id)}" type="button">Remove my note</button>` : ''}</article>`;
}
function layout(title: string, body: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#254c3b"><title>${escape(title)} · Commonplace</title><link rel="stylesheet" href="/style.css"><script src="/app.js" defer></script></head><body><a class="skip" href="#main">Skip to content</a><header class="site-header"><a class="brand" href="/"><span class="brand-symbol" aria-hidden="true">✳</span> commonplace<span class="edition">A SHARED STUDIO WALL</span></a><nav aria-label="Main"><a href="/">The wall</a><a href="/readme/">Why this exists ↗</a></nav></header>${body}<footer class="site-footer"><span>Small thoughts. Shared space.</span><span>COMMONPLACE / FIRST EDITION</span></footer><p id="status" role="status" aria-live="polite"></p></body></html>`;
}
function home(owner: string, filter: string, page: number) {
  const { notes, more } = list(owner, filter, page);
  const count = (db.prepare('SELECT COUNT(*) AS total FROM notes').get() as { total: number }).total;
  return layout('The wall', `<main id="main"><section class="intro"><div><p class="eyebrow">AN OPEN NOTEBOOK FOR A SMALL GROUP</p><h1>Good things start<br>with <em>a little note.</em></h1><p class="intro-copy">An unfinished idea. A question for the room. Something worth passing on.<br>Leave it here for the next person.</p></div><div class="intro-mark" aria-hidden="true"><span>Room for<br>one more<br><em>thought.</em></span><b>↙</b></div></section><div class="workspace"><aside class="composer" aria-labelledby="compose-title"><p class="eyebrow">YOUR CONTRIBUTION</p><h2 id="compose-title">Leave a little<br>something.</h2><form id="note-form"><label for="name">A name to leave it under</label><input id="name" name="name" maxlength="30" required placeholder="Your name or a pseudonym" autocomplete="nickname"><fieldset><legend>What kind of thought?</legend><div class="kind-choices">${kinds.map((kind, i) => `<label><input type="radio" name="kind" value="${kind}" ${i === 0 ? 'checked' : ''}><span>${kind}</span></label>`).join('')}</div></fieldset><label for="body">Your note</label><textarea id="body" name="body" maxlength="400" rows="6" required placeholder="What have you been thinking about?" aria-describedby="note-help counter"></textarea><div class="field-meta"><span id="note-help">Visible to everyone who visits.</span><output id="counter" for="body">0 / 400</output></div><button class="submit" type="submit">Pin to the wall <span aria-hidden="true">↗</span></button><p id="form-error" role="alert"></p></form><p class="composer-foot">Your note stays when you leave. This browser remembers which notes are yours; clearing cookies loses that connection.</p><noscript><p>Enable JavaScript to add or remove a note. You can still read the wall.</p></noscript></aside><section class="wall" aria-labelledby="wall-title"><div class="wall-heading"><div><p class="eyebrow">THINKING OUT LOUD, TOGETHER</p><h2 id="wall-title">On the wall <span class="count">${count}</span></h2></div><a class="refresh" href="/?filter=${escape(filter)}">Refresh ↻</a></div><nav class="filters" aria-label="Filter notes">${['all', ...kinds, 'mine'].map(f => `<a href="/?filter=${f}" ${f === filter ? 'aria-current="page"' : ''}>${f === 'mine' ? 'My notes' : f === 'all' ? 'Everything' : f}</a>`).join('')}</nav><div class="notes">${notes.length ? notes.map(card).join('') : `<div class="empty"><span aria-hidden="true">✳</span><h3>${filter === 'all' ? 'Every wall starts somewhere.' : 'A little space to fill.'}</h3><p>${filter === 'all' ? 'Be the first to leave a thought. A small beginning is enough.' : 'No notes here yet. Try another filter or add your own.'}</p></div>`}</div><nav class="pagination" aria-label="Pages">${page > 1 ? `<a href="/?filter=${escape(filter)}&page=${page - 1}">← Newer notes</a>` : ''}${more ? `<a href="/?filter=${escape(filter)}&page=${page + 1}">Older notes →</a>` : ''}</nav><p class="wall-foot">A public wall, best shared with a small circle. Refresh to see what others have added.</p></section></div></main>`);
}
// Escape HTML before rendering the limited Markdown used in README.
function markdown(md: string) {
  const inline = (s: string) => escape(s).replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>').replace(/`([^`]+)`/g, '<code>$1</code>');
  return md.trim().split(/\r?\n\s*\r?\n/).map(block => {
    const heading = block.match(/^(#{1,6}) (.+)$/);
    return heading ? `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>` : `<p>${inline(block).replace(/\r?\n/g, ' ')}</p>`;
  }).join('\n');
}
function send(res: ServerResponse, status: number, data: unknown, html = false) {
  res.writeHead(status, { 'Content-Type': html ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8' });
  res.end(html ? data as string : JSON.stringify(data));
}
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    if (req.method === 'GET' && ['/style.css', '/app.js'].includes(url.pathname)) {
      res.setHeader('Content-Type', url.pathname.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8');
      res.end(readFileSync(resolve('public', url.pathname.slice(1)))); return;
    }
    const owner = identity(req, res);
    if (req.method === 'GET' && url.pathname === '/') {
      const filter = url.searchParams.get('filter') || 'all';
      const page = Math.min(100000, Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1));
      send(res, 200, home(owner, ['all','mine', ...kinds].includes(filter) ? filter : 'all', page), true); return;
    }
    if (req.method === 'GET' && /^\/readme\/?$/.test(url.pathname)) {
      send(res, 200, layout('Why this exists', `<main id="main" class="readme">${markdown(readFileSync('README.md', 'utf8'))}</main>`), true); return;
    }
    if (req.method === 'GET' && url.pathname === '/api/notes') { send(res, 200, list(owner)); return; }
    const detail = url.pathname.match(/^\/notes\/([a-f0-9-]{36})$/);
    if (req.method === 'GET' && detail) {
      const n = db.prepare('SELECT * FROM notes WHERE id = ?').get(detail[1]) as Note | undefined;
      if (!n) { send(res, 404, layout('Note not found', '<main id="main" class="readme"><h1>This note is no longer here.</h1><a href="/">Back to the wall</a></main>'), true); return; }
      send(res, 200, layout('A little thought', `<main id="main" class="single-note"><p class="eyebrow">A THOUGHT WORTH KEEPING</p>${card({ ...n, mine: n.owner === owner })}<a href="/">← Back to the wall</a></main>`), true); return;
    }
    if (req.method === 'POST' || req.method === 'DELETE') {
      if (!req.headers['content-type']?.startsWith('application/json')) { send(res, 415, { error: 'Send application/json.' }); return; }
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) { send(res, 403, { error: 'Use this website to make changes.' }); return; }
      if (req.method === 'DELETE') {
        const id = url.pathname.match(/^\/api\/notes\/([a-f0-9-]{36})$/)?.[1];
        if (!id) { send(res, 404, { error: 'Note not found.' }); return; }
        const result = db.prepare('DELETE FROM notes WHERE id = ? AND owner = ?').run(id, owner);
        send(res, result.changes ? 200 : 404, result.changes ? { ok: true } : { error: 'Only the original browser can remove this note.' }); return;
      }
      if (url.pathname !== '/api/notes') { send(res, 404, { error: 'Not found.' }); return; }
      const chunks: Buffer[] = []; let bytes = 0;
      for await (const chunk of req) { bytes += chunk.length; if (bytes > 8192) { send(res, 413, { error: 'This note is too large.' }); return; } chunks.push(chunk); }
      let data: Record<string, unknown>;
      try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { send(res, 400, { error: 'Could not read this note.' }); return; }
      if (!data || typeof data !== 'object' || typeof data.name !== 'string' || typeof data.body !== 'string' || typeof data.kind !== 'string' || !kinds.includes(data.kind) || !data.name.trim() || data.name.trim().length > 30 || !data.body.trim() || data.body.trim().length > 400) {
        send(res, 400, { error: 'Use a name of 1–30 characters and a note of 1–400 characters. Choose a note type.' }); return;
      }
      const recent = db.prepare('SELECT count(*) AS count FROM notes WHERE owner = ? AND created > ?').get(owner, new Date(Date.now() - 60000).toISOString()) as { count: number };
      if (recent.count >= 10) { res.setHeader('Retry-After', '60'); send(res, 429, { error: 'Give the wall a moment. Try again in a minute.' }); return; }
      const n = { id: randomUUID(), name: data.name.trim(), body: data.body.trim(), kind: data.kind, created: new Date().toISOString() };
      db.prepare('INSERT INTO notes (id,owner,name,kind,body,created) VALUES (?,?,?,?,?,?)').run(n.id, owner, n.name, n.kind, n.body, n.created);
      send(res, 201, { ...n, mine: true }); return;
    }
    send(res, 404, { error: 'Not found.' });
  } catch (error) { console.error('Request failed:', error instanceof Error ? error.message : 'Unknown error'); if (!res.headersSent) send(res, 500, { error: 'Your note could not be saved. Please try again.' }); else res.end(); }
});
server.requestTimeout = 15000;
server.listen(Number(process.env.PORT || 8080), process.env.HOST || '0.0.0.0', () => console.log(`Commonplace listening on ${process.env.PORT || 8080}`));
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.on(signal, () => server.close(() => { db.close(); process.exit(0); }));
