// Explicit live smoke test: creates one temporary note, restarts the named
// Fly machine, verifies persistence, and removes only its own test note.
// Run through mise exec so the deployment token reaches flyctl.
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const [app, machine] = process.argv.slice(2);
if (!app || !machine || !/^[a-z0-9-]+$/.test(app) || !/^[a-f0-9]+$/.test(machine)) {
  throw new Error('Usage: node scripts/verify-deploy.mjs <fly-app-name> <machine-id>');
}
const base = `https://${app}.fly.dev`;
const get = path => fetch(`${base}${path}`, { signal: AbortSignal.timeout(15000) });
const initial = await get('/');
assert.equal(initial.status, 200);
const cookie = initial.headers.get('set-cookie')?.split(';')[0];
assert.ok(cookie, 'App did not set a browser identity');
const headers = { cookie, 'Content-Type': 'application/json' };
const response = await fetch(`${base}/api/notes`, {
  method: 'POST', headers, signal: AbortSignal.timeout(15000),
  body: JSON.stringify({ name: 'Deployment check', kind: 'idea', body: `Temporary persistence check ${crypto.randomUUID()}` }),
});
assert.equal(response.status, 201);
const note = await response.json();
try {
  console.log('Saved temporary note. Restarting the specified Fly machine.');
  execFileSync('flyctl', ['machine', 'restart', machine, '-a', app], { stdio: 'inherit', timeout: 90000 });
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try { if ((await get('/')).status === 200) { ready = true; break; } } catch { /* cold start */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.ok(ready, 'App did not return after restart');
  const saved = await get(`/notes/${note.id}`);
  assert.equal(saved.status, 200);
  assert.ok((await saved.text()).includes(note.body), 'Note disappeared after restart');
  console.log('PASS: saved note survived a real Fly machine restart.');
} finally {
  const removed = await fetch(`${base}/api/notes/${note.id}`, { method: 'DELETE', headers, signal: AbortSignal.timeout(15000) });
  assert.equal(removed.status, 200, 'Temporary test note could not be removed');
  console.log('Removed temporary test note using its original browser identity.');
}
