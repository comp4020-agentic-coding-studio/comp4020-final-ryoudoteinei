import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';

async function house(duration=1800) {
  const dir=await mkdtemp(join(tmpdir(),'auction-spec-'));
  const probe=createServer();await new Promise<void>(r=>probe.listen(0,'127.0.0.1',r));const port=(probe.address() as {port:number}).port;await new Promise<void>(r=>probe.close(()=>r()));
  let child:ChildProcess;let logs='';
  const start=()=>new Promise<void>((resolve,reject)=>{
    child=spawn(process.execPath,['server.ts'],{env:{...process.env,NODE_ENV:'test',HOST:'127.0.0.1',PORT:String(port),DATA_DIR:dir,AUCTION_MS:String(duration),SOFT_CLOSE_MS:'150'},stdio:['ignore','pipe','pipe']});
    const timer=setTimeout(()=>reject(new Error('Startup timeout: '+logs)),7000);
    child.once('error',reject);child.stdout!.on('data',chunk=>{logs+=chunk.toString();if(chunk.toString().includes('listening')){clearTimeout(timer);resolve();}});
    child.stderr!.on('data',chunk=>{logs+=chunk.toString();});
  });
  const stop=()=>new Promise<void>(resolve=>{if(child.exitCode!==null){resolve();return;}child.once('exit',()=>resolve());child.kill();});
  await start();const base=`http://127.0.0.1:${port}`;
  const get=async(cookie='')=>(await fetch(base+'/api/state',{headers:{cookie}})).json();
  const post=(path:string,data:unknown,cookie='')=>fetch(base+path,{method:'POST',headers:{cookie,'Content-Type':'application/json'},body:JSON.stringify(data)});
  const register=async(name:string)=>{const r=await post('/api/register',{name,password:'test-passphrase-09'});expect(r.status).toBe(200);return r.headers.get('set-cookie')!.split(';')[0];};
  const appraisal=(id:number)=>{const reader=new DatabaseSync(join(dir,'auction.sqlite'),{readOnly:true});try{return (reader.prepare('SELECT valuation FROM lots WHERE id=?').get(id) as {valuation:number}).valuation;}finally{reader.close();}};
  const promote=(name:string)=>{const writer=new DatabaseSync(join(dir,'auction.sqlite'));try{writer.prepare("UPDATE members SET role='admin' WHERE name=?").run(name);}finally{writer.close();}};
  return {base,get,post,register,stop,start,appraisal,promote,logs:()=>logs,close:async()=>{await stop();await rm(dir,{recursive:true,force:true});}};
}

it('runs registration, competing bids, one settlement and one blind pawn payout without leaking private state',async()=>{
  const h=await house();
  try{
    const a=await h.register('alice'),b=await h.register('bob');
    const initial=await h.get(a);const lot=initial.lots[0];
    expect(initial.me.balance).toBe(1000);expect(initial.pool).toBeGreaterThan(50);
    expect(JSON.stringify(initial)).not.toMatch(/valuation|password|salt|token/);
    expect((await h.post('/api/lots/'+lot.id+'/bid',{amount:10})).status).toBe(401);
    expect((await h.post('/api/lots/'+lot.id+'/bid',{amount:10},a)).status).toBe(200);
    expect((await h.get(a)).me).toMatchObject({balance:990,held:10});
    const otherLot=initial.lots[1].id;
    expect((await h.post('/api/lots/'+otherLot+'/bid',{amount:995},a)).status).toBe(409);
    expect((await h.get(a)).me.balance).toBe(990);
    expect((await h.post('/api/lots/'+lot.id+'/bid',{amount:1001},b)).status).toBe(409);
    expect((await h.post('/api/lots/'+lot.id+'/bid',{amount:20},b)).status).toBe(200);
    expect((await h.get(a)).me.balance).toBe(1000);
    const simultaneous=await Promise.all([h.post('/api/lots/'+lot.id+'/bid',{amount:30},a),h.post('/api/lots/'+lot.id+'/bid',{amount:30},b)]);
    expect(simultaneous.map(r=>r.status).sort()).toEqual([200,400]);
    const after=await h.get(a);const winner=after.lots.find((l:{id:number})=>l.id===lot.id).bidder_id;
    const winnerCookie=winner===after.me.id?a:b,otherCookie=winnerCookie===a?b:a;
    expect((await h.get(winnerCookie)).me.balance).toBe(970);expect((await h.get(otherCookie)).me.balance).toBe(1000);
    const abort=new AbortController();const stream=await fetch(h.base+'/api/events',{signal:abort.signal});expect(new TextDecoder().decode((await stream.body!.getReader().read()).value)).toContain('changed');abort.abort();
    await new Promise(r=>setTimeout(r,1900));
    const owned=await h.get(winnerCookie);expect(owned.collection.find((l:{id:number})=>l.id===lot.id).status).toBe('owned');expect(owned.me.balance).toBe(970);
    expect(JSON.stringify(owned.collection)).not.toContain('valuation');expect(owned.collection[0].payout).toBeNull();
    expect((await h.post('/api/lots/'+lot.id+'/pawn',{confirm:true},otherCookie)).status).toBe(403);
    expect((await h.post('/api/lots/'+lot.id+'/pawn',{},winnerCookie)).status).toBe(400);
    const sold=await h.post('/api/lots/'+lot.id+'/pawn',{confirm:true},winnerCookie);expect(sold.status).toBe(200);const result=await sold.json();expect(result.payout).toBeGreaterThanOrEqual(20);
    expect((await h.get(winnerCookie)).me.balance).toBe(970+result.payout);
    expect((await h.post('/api/lots/'+lot.id+'/pawn',{confirm:true},winnerCookie)).status).toBe(403);
    expect((await h.get(winnerCookie)).me.balance).toBe(970+result.payout);
    expect((await h.get(otherCookie)).collection).toEqual([]);
    const login=await h.post('/api/login',{name:'alice',password:'test-passphrase-09'});expect(login.status).toBe(200);
    const returned=login.headers.get('set-cookie')!.split(';')[0];expect((await h.get(returned)).me.balance).toBe((await h.get(a)).me.balance);
    expect((await h.post('/api/register',{name:'ALICE',password:'test-passphrase-09'})).status).toBe(409);
    expect(h.logs()).toContain('B0001');expect(h.logs()).toContain('B0002');expect(h.logs()).toContain('auction.won');expect(h.logs()).toContain('pawn.sold');expect(h.logs()).toContain('denied');expect(h.logs()).not.toContain('test-passphrase-09');
  }finally{await h.close();}
},15000);

it('restricts key issuance to admins and credits a one-use key only once across concurrent redemption and restart',async()=>{
  const h=await house(10000);
  try{
    const admin=await h.register('issuer'),b=await h.register('redeemer'),c=await h.register('otheruser');
    expect((await h.post('/api/admin/keys',{amount:500,role:'admin'},b)).status).toBe(403);
    expect((await fetch(h.base+'/api/admin/keys',{headers:{cookie:b}})).status).toBe(403);
    expect((await fetch(h.base+'/api/admin/keys')).status).toBe(401);
    h.promote('issuer');
    expect((await h.get(admin)).me.role).toBe('admin');
    expect((await h.post('/api/admin/keys',{amount:-1},admin)).status).toBe(400);
    const issued=await h.post('/api/admin/keys',{amount:500},admin);expect(issued.status).toBe(200);const key=await issued.json();expect(key.code).toMatch(/^IAH-[A-F0-9]{32}$/);
    const listing=await(await fetch(h.base+'/api/admin/keys',{headers:{cookie:admin}})).json();expect(listing.keys[0].amount).toBe(500);expect(JSON.stringify(listing)).not.toContain(key.code);expect(JSON.stringify(await h.get(b))).not.toContain(key.code);
    const attempts=await Promise.all([h.post('/api/redeem',{code:key.code,amount:99999},b),h.post('/api/redeem',{code:key.code},c)]);
    expect(attempts.map(r=>r.status).sort()).toEqual([200,409]);
    expect((await h.get(b)).me.balance+(await h.get(c)).me.balance).toBe(2500);
    expect((await h.post('/api/redeem',{code:'IAH-'+'0'.repeat(32)},b)).status).toBe(409);
    await h.stop();await h.start();
    expect((await h.post('/api/redeem',{code:key.code},admin)).status).toBe(409);
    expect((await h.get(b)).me.balance+(await h.get(c)).me.balance).toBe(2500);
    expect(h.logs()).toContain('credit_key.redeemed');expect(h.logs()).not.toContain(key.code);
  }finally{await h.close();}
},15000);

it('persists identity, held funds, hidden appraisal and overdue settlement across process restart',async()=>{
  const h=await house(1500);
  try{
    const cookie=await h.register('returning');const before=await h.get(cookie);const id=before.lots[0].id;const appraisal=h.appraisal(id);
    await h.post('/api/lots/'+id+'/bid',{amount:100},cookie);await h.stop();await new Promise(r=>setTimeout(r,1600));await h.start();
    const after=await h.get(cookie);expect(after.me.balance).toBe(900);expect(after.me.held).toBe(0);expect(after.collection[0].id).toBe(id);
    const sold=await(await h.post('/api/lots/'+id+'/pawn',{confirm:true},cookie)).json();expect(sold.payout).toBe(appraisal);
    await h.stop();await h.start();const final=await h.get(cookie);expect(final.me.balance).toBe(900+sold.payout);expect(final.collection[0].payout).toBe(sold.payout);
  }finally{await h.close();}
},15000);

it('streams committed bid changes to an independent viewer and reconnects with authoritative state',async()=>{
  const h=await house(12000);const abort=new AbortController();
  try{
    const cookie=await h.register('livebidder');const lot=(await h.get()).lots[0];
    const response=await fetch(h.base+'/api/events',{signal:abort.signal});const reader=response.body!.getReader();await reader.read();
    const begin=performance.now();await h.post('/api/lots/'+lot.id+'/bid',{amount:25},cookie);
    const event=await reader.read();expect(new TextDecoder().decode(event.value)).toContain('changed');const shared=await h.get();expect(shared.lots[0].price).toBe(25);expect(shared.me).toBeNull();expect(shared.collection).toEqual([]);expect(performance.now()-begin).toBeLessThan(1000);
    abort.abort();
    expect((await h.post('/api/lots/'+lot.id+'/bid',{amount:26},cookie)).status).toBe(400);
    const denied=await h.post('/api/lots/'+lot.id+'/bid',{amount:40},cookie);expect(denied.status).toBe(200);expect((await h.get()).lots[0].price).toBe(40);
  }finally{abort.abort();await h.close();}
},15000);
