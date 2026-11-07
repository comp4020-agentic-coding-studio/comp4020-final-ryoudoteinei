import { request } from 'node:http';
import { request as secureRequest } from 'node:https';
import { expect, inject, it } from 'vitest';

it('rejects an invalid request URL without stopping the server', async () => {
  const base = new URL(inject('baseUrl'));
  const send = base.protocol === 'https:' ? secureRequest : request;
  const status = await new Promise<number | undefined>((resolve, reject) => {
    // Send the raw target, since fetch would reject or normalise it first.
    const req = send(base, { path: '//example.com:notaport', signal: AbortSignal.timeout(3000) }, res => {
      res.on('error', reject);
      res.on('end', () => resolve(res.statusCode));
      res.resume();
    });
    req.on('error', reject);
    req.end();
  });
  expect(status).toBe(400);
  expect((await fetch(new URL('/', base))).status).toBe(200);
});
