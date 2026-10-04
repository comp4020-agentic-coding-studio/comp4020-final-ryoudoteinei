import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { expect, it } from 'vitest';

it('keeps a saved note and its owner after the application process restarts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'commonplace-spec-'));
  const probe = createServer();
  await new Promise<void>(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = (probe.address() as { port: number }).port;
  await new Promise<void>(resolve => probe.close(() => resolve()));
  let child: ChildProcess | undefined;
  const start = () => new Promise<void>((resolve, reject) => {
    child = spawn(process.execPath, ['server.ts'], { env: { ...process.env, NODE_ENV: 'test', HOST: '127.0.0.1', PORT: String(port), DATA_DIR: dir }, stdio: ['ignore','pipe','pipe'] });
    const timer = setTimeout(() => reject(new Error('Test server startup timed out')), 8000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Test server exited: ${code}`)); });
    child.stdout!.on('data', chunk => { if (chunk.toString().includes('listening')) { clearTimeout(timer); resolve(); } });
  });
  const stop = () => new Promise<void>(resolve => {
    if (!child || child.exitCode !== null) { resolve(); return; }
    child.once('exit', () => resolve()); child.kill();
  });
  try {
    await start();
    const base = `http://127.0.0.1:${port}`;
    const cookie = (await fetch(base)).headers.get('set-cookie')!.split(';')[0];
    const response = await fetch(`${base}/api/notes`, { method: 'POST', headers: { cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Return visitor', kind: 'discovery', body: 'This thought survives a restart.' }) });
    expect(response.status).toBe(201);
    const note = await response.json();
    await stop(); await start();
    const saved = await (await fetch(`${base}/api/notes`, { headers: { cookie } })).json();
    expect(saved.notes[0].id).toBe(note.id);
    expect(saved.notes[0].mine).toBe(true);
    expect(await (await fetch(`${base}/notes/${note.id}`)).text()).toContain(note.body);
  } finally { await stop(); await rm(dir, { recursive: true, force: true }); }
}, 20000);
