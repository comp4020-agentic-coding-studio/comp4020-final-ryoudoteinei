import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';

const base='https://comp4020-final-ryoudoteinei.fly.dev';
const app='comp4020-final-ryoudoteinei';
const checks=[];
function pass(text){checks.push(text);console.log('PASS: '+text);}
async function get(cookie=''){
  const r=await fetch(base+'/api/state',{headers:{cookie},signal:AbortSignal.timeout(15000)});assert.equal(r.status,200);return r.json();
}
async function post(path,data,cookie=''){
  const r=await fetch(base+path,{method:'POST',headers:{cookie,'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(15000)});
  return {status:r.status,headers:r.headers,data:await r.json()};
}
async function account(suffix){const credentials={name:'qa_final_'+Date.now().toString(36)+suffix,password:randomBytes(20).toString('hex')};const r=await post('/api/register',credentials);assert.equal(r.status,200);return {credentials,cookie:r.headers.get('set-cookie').split(';')[0]};}
const a=await account('a'),b=await account('b');
const initial=await get(a.cookie);assert.equal(initial.me.balance,1000);assert.equal((await get(b.cookie)).me.balance,1000);pass('two independent accounts each receive one welcome grant');
const lot=initial.lots.filter(l=>!l.bidder_id && l.ends>initial.now+15000).sort((x,y)=>x.ends-y.ends)[0];assert.ok(lot,'No unbid lot with sufficient time available');
const abort=new AbortController();const stream=await fetch(base+'/api/events',{signal:abort.signal});const reader=stream.body.getReader();await reader.read();
const started=performance.now();assert.equal((await post('/api/lots/'+lot.id+'/bid',{amount:10},a.cookie)).status,200);await reader.read();const shared=await get(b.cookie);assert.equal(shared.lots.find(l=>l.id===lot.id).price,10);const latency=Math.round(performance.now()-started);pass('live bid notification and second-account snapshot ('+latency+'ms)');abort.abort();
assert.equal((await post('/api/lots/'+lot.id+'/bid',{amount:20},b.cookie)).status,200);assert.equal((await get(a.cookie)).me.balance,1000);assert.equal((await get(b.cookie)).me.balance,980);pass('outbid reservation refunds A while B reserves 20 credits');
console.log('Restarting the existing Fly machine to verify volume-backed state.');
execFileSync('flyctl',['machine','restart','80e39ea64e9108','-a',app],{stdio:'inherit',timeout:90000});
let recovered;
for(let i=0;i<12;i++){try{recovered=await get(b.cookie);break;}catch{await new Promise(r=>setTimeout(r,1000));}}
assert.ok(recovered,'Application did not recover');assert.equal(recovered.me.balance,980);pass('account session and balance survive actual Fly restart');
let owned;
for(let i=0;i<100;i++){
  const s=await get(b.cookie);owned=s.collection.find(l=>l.id===lot.id);
  if(owned)break;
  if(i%10===0)console.log('Waiting for the ordinary auction deadline…');
  await new Promise(r=>setTimeout(r,2000));
}
assert.ok(owned,'Winning collectible not delivered');assert.equal(owned.payout,null);assert.ok(!('valuation' in owned));pass('one settlement delivers the collectible without exposing its appraisal');
assert.equal((await post('/api/lots/'+lot.id+'/pawn',{confirm:true},a.cookie)).status,403);pass('non-owner cannot pawn the winner’s item');
const sale=await post('/api/lots/'+lot.id+'/pawn',{confirm:true},b.cookie);assert.equal(sale.status,200);assert.ok(sale.data.payout>0);assert.equal((await post('/api/lots/'+lot.id+'/pawn',{confirm:true},b.cookie)).status,403);assert.equal((await get(b.cookie)).me.balance,980+sale.data.payout);pass('blind sale reveals and credits one payout, rejecting a repeat');
const login=await post('/api/login',b.credentials);assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];assert.equal((await get(cookie)).me.balance,980+sale.data.payout);pass('return login retains the final balance without another welcome grant');
const report={date:'2026-11-03',scope:'Operator-run technical checks using independent HTTP sessions, not a participant study',lot:lot.id,notificationAndSnapshotMs:latency,checks};
writeFileSync('docs/verification/release-results.json',JSON.stringify(report,null,2)+'\n');
