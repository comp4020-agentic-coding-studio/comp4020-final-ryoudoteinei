const form = document.querySelector('#note-form');
const status = document.querySelector('#status');
const tell = message => { status.textContent = message; };
if (form) {
  const body = form.elements.body;
  body.addEventListener('input', () => { document.querySelector('#counter').textContent = `${body.value.length} / 400`; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button[type=submit]');
    const error = document.querySelector('#form-error');
    error.textContent = ''; button.disabled = true; button.textContent = 'Pinning…';
    try {
      const response = await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Please try again.');
      window.location.assign(`/?saved=${encodeURIComponent(result.id)}#note-${encodeURIComponent(result.id)}`);
    } catch (err) { error.textContent = err.message || 'Connection lost. Your draft is still here.'; button.disabled = false; button.innerHTML = 'Pin to the wall <span aria-hidden="true">↗</span>'; }
  });
}
if (new URLSearchParams(location.search).has('saved')) tell('Your note is pinned. It will be here when you return.');
document.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', async () => {
  if (button.dataset.confirm !== 'yes') { button.dataset.confirm = 'yes'; button.textContent = 'Remove for everyone? Click again'; return; }
  button.disabled = true;
  try {
    const response = await fetch(`/api/notes/${button.dataset.delete}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
    if (!response.ok) throw new Error((await response.json()).error);
    location.assign('/?filter=mine');
  } catch (error) { tell(error.message || 'Could not remove this note.'); button.disabled = false; }
}));
