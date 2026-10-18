// Live QA creates one clearly labelled fictional bidder, buys one lot and pawns it.
// No credentials are printed or written to disk. All money is game currency.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
const base='https://comp4020-final-ryoudoteinei.fly.dev';
const name='qa_'+Date.now().toString(36),password=randomBytes(24).toString('hex');
let cookie='';
async function post(path,data){const r=await fetch(base+path,{method:'POST',headers:{cookie,'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(20000)});return {r,data:await r.json()};}
async function state(){const r=await fetch(base+'/api/state',{headers:{cookie},signal:AbortSignal.timeout(20000)});assert.equal(r.status,200);return r.json();}
const registered=await post('/api/register',{name,password});assert.equal(registered.r.status,200);cookie=registered.r.headers.get('set-cookie').split(';')[0];
const before=await state();assert.equal(before.me.balance,1000);console.log('PASS: registration granted exactly $1,000 to '+before.me.paddle);
const lot=before.lots.filter(l=>!l.bidder_id).sort((a,b)=>a.ends-b.ends)[0];assert.ok(lot,'No unbid lot available for QA');
const amount=lot.price+10;assert.equal((await post('/api/lots/'+lot.id+'/bid',{amount})).r.status,200);
console.log('PASS: bid reserved; waiting for normal server settlement of lot '+lot.id);
let owned;
for(let i=0;i<90;i++){
  const s=await state();owned=s.collection.find(l=>l.id===lot.id);
  if(owned)break;
  if(i%10===0)console.log('Waiting for the public deadline…');
  await new Promise(r=>setTimeout(r,2000));
}
assert.ok(owned,'QA bidder did not win the expected lot');assert.equal(owned.payout,null);assert.ok(!('valuation' in owned));
console.log('PASS: settlement delivered a collectible without revealing the appraisal');
const sold=await post('/api/lots/'+lot.id+'/pawn',{confirm:true});assert.equal(sold.r.status,200);assert.ok(sold.data.payout>0);
assert.equal((await state()).me.balance,1000-amount+sold.data.payout);
assert.equal((await post('/api/lots/'+lot.id+'/pawn',{confirm:true})).r.status,403);
const logged=await post('/api/login',{name,password});assert.equal(logged.r.status,200);cookie=logged.r.headers.get('set-cookie').split(';')[0];
assert.equal((await state()).me.balance,1000-amount+sold.data.payout);
console.log('PASS: blind sale paid once; signing in again did not repeat the grant');
console.log('Verified real live register → bid → collect → pawn flow. QA account remains labelled '+name+'.');
