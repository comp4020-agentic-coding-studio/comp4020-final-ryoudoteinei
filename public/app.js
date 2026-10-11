const form = document.querySelector('#note-form');
const status = document.querySelector('#status');
const connection = document.querySelector('#connection');
const tell = message => { status.textContent = message; };
const wall = document.querySelector('.notes');
const detail = document.querySelector('.single-note');
const detailId = location.pathname.match(/^\/notes\/([a-f0-9-]{36})$/)?.[1];
let stream, refreshing = false, pending = false;
let lastSnapshot = '';

// Reconcile only the shared surface. Never replace the composer or unchanged
// cards: an incoming note must not erase a draft, move focus, or reset a delete confirmation.
function render(snapshot) {
  const target = wall || detail;
  if (!target) return;
  const template = document.createElement('template');
  template.innerHTML = snapshot.html; // HTML is escaped by the server's card renderer.
  const incoming = [...template.content.querySelectorAll('.note')];
  const ids = new Set(incoming.map(note => note.id));
  target.querySelectorAll('.note').forEach(note => { if (!ids.has(note.id)) note.remove(); });
  target.querySelectorAll('.empty, .removed-note').forEach(node => node.remove());
  if (wall) {
    incoming.forEach((note, index) => {
      const existing = document.getElementById(note.id);
      const item = existing || note;
      if (wall.children[index] !== item) wall.insertBefore(item, wall.children[index] || null);
    });
    if (!incoming.length) {
      const empty = document.createElement('div'); empty.className = 'empty';
      const heading = document.createElement('h3'); heading.textContent = 'A little space to fill.';
      const copy = document.createElement('p'); copy.textContent = 'No notes in this view yet. Add a thought or try another filter.';
      empty.append(heading, copy); wall.append(empty);
    }
    document.querySelector('.count').textContent = snapshot.total;
    const params = new URLSearchParams(location.search);
    const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
    const pagination = document.querySelector('.pagination'); pagination.replaceChildren();
    const addPage = (number, label) => {
      const query = new URLSearchParams({ filter: params.get('filter') || 'all', page: String(number) });
      const link = document.createElement('a'); link.href = `/?${query}`; link.textContent = label; pagination.append(link);
    };
    if (page > 1) addPage(page - 1, '← Newer notes');
    if (snapshot.more) addPage(page + 1, 'Older notes →');
  } else if (!incoming.length) {
    const message = document.createElement('p'); message.className = 'removed-note';
    message.textContent = 'The author removed this note.'; detail.insertBefore(message, detail.lastElementChild);
  }
}

async function refreshWall() {
  pending = true;
  if (refreshing || (!wall && !detail)) return;
  refreshing = true;
  try {
    while (pending) {
      pending = false;
      const query = new URLSearchParams(location.search);
      if (detailId) query.set('note', detailId);
      const response = await fetch(`/api/wall?${query}`, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Wall unavailable');
      const snapshot = await response.json();
      const signature = JSON.stringify(snapshot);
      if (signature !== lastSnapshot) { render(snapshot); lastSnapshot = signature; }
      if (connection) connection.textContent = stream?.readyState === 1 ? '● Live' : 'Reconnecting…';
    }
  } catch {
    if (connection) connection.textContent = 'Reconnecting… draft kept';
    // A snapshot can fail while SSE remains healthy. Retry without waiting
    // for another person to make a change.
    setTimeout(refreshWall, 1500);
  } finally { refreshing = false; }
}

if (wall || detail) {
  stream = new EventSource('/api/events');
  stream.addEventListener('changed', refreshWall);
  stream.addEventListener('open', refreshWall);
  stream.addEventListener('error', () => { if (connection) connection.textContent = 'Reconnecting… draft kept'; });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshWall(); });
  window.addEventListener('online', refreshWall);
  document.querySelector('.refresh')?.addEventListener('click', event => { event.preventDefault(); refreshWall(); });
}

if (form) {
  const body = form.elements.body;
  const count = () => { document.querySelector('#counter').textContent = `${body.value.length} / 400`; };
  body.addEventListener('input', count);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button[type=submit]');
    const error = document.querySelector('#form-error');
    const data = Object.fromEntries(new FormData(form));
    error.textContent = ''; button.disabled = true; button.textContent = 'Pinning…';
    try {
      const response = await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Please try again.');
      if (body.value === data.body) body.value = '';
      count();
      tell('Your note is pinned. It will be here when you return.');
      await refreshWall();
    } catch (err) { error.textContent = err.message || 'Connection lost. Your draft is still here.'; }
    finally { button.disabled = false; button.innerHTML = 'Pin to the wall <span aria-hidden="true">↗</span>'; }
  });
}

document.addEventListener('click', async event => {
  const button = event.target.closest?.('[data-delete]');
  if (!button || button.disabled) return;
  if (button.dataset.confirm !== 'yes') { button.dataset.confirm = 'yes'; button.textContent = 'Remove for everyone? Click again'; return; }
  button.disabled = true;
  try {
    const response = await fetch(`/api/notes/${button.dataset.delete}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
    if (!response.ok) throw new Error((await response.json()).error);
    tell('Your note has been removed.'); await refreshWall();
  } catch (error) { tell(error.message || 'Could not remove this note.'); button.disabled = false; }
});
