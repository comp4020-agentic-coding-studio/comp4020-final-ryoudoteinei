import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('keeps draft, focus and selection through incoming updates, errors and reconnection', async () => {
  const dom = new JSDOM(`<form id="note-form"><input name="name"><textarea name="body"></textarea><output id="counter"></output><button type="submit"></button><p id="form-error"></p></form><span id="connection"></span><span class="count"></span><div class="notes"></div><nav class="pagination"></nav><p id="status"></p>`, { url: 'http://localhost/', runScripts: 'outside-only' });
  const win = dom.window;
  let stream: FakeStream;
  class FakeStream {
    readyState = 1;
    listeners: Record<string, () => void> = {};
    constructor() { stream = this; }
    addEventListener(name: string, fn: () => void) { this.listeners[name] = fn; }
  }
  let html = '<article class="note" id="note-a"><p>A shared thought</p></article>';
  Object.assign(win, { EventSource: FakeStream, fetch: async () => ({ ok: true, json: async () => ({ html, total: 1, more: false }) }), AbortSignal });
  win.eval(readFileSync('public/app.js', 'utf8'));
  const body = win.document.querySelector('textarea')!;
  body.value = 'My unfinished thought'; body.focus(); body.setSelectionRange(3, 8);
  stream!.listeners.changed();
  await new Promise(resolve => setTimeout(resolve, 10));
  expect(win.document.getElementById('note-a')).not.toBeNull();
  expect(body.value).toBe('My unfinished thought');
  expect(win.document.activeElement).toBe(body);
  expect([body.selectionStart,body.selectionEnd]).toEqual([3,8]);
  stream!.listeners.error();
  expect(win.document.getElementById('connection')!.textContent).toContain('Reconnecting');
  html = '';
  stream!.listeners.open();
  await new Promise(resolve => setTimeout(resolve, 10));
  expect(win.document.getElementById('note-a')).toBeNull();
  expect(body.value).toBe('My unfinished thought');
  expect(win.document.activeElement).toBe(body);
  dom.window.close();
});
