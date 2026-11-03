import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const base='https://comp4020-final-ryoudoteinei.fly.dev';
const registration=await fetch(base+'/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'qa_latency_'+Date.now().toString(36),password:randomBytes(20).toString('hex')})});
assert.equal(registration.status,200);await registration.json();const cookie=registration.headers.get('set-cookie').split(';')[0];
const initial=await(await fetch(base+'/api/state')).json();const lot=initial.lots.find(l=>!l.bidder_id&&l.ends>initial.now+15000);assert.ok(lot);
const abort=new AbortController();const deadline=setTimeout(()=>abort.abort(),15000);
try{
  const response=await fetch(base+'/api/events',{signal:abort.signal});const reader=response.body.getReader();await reader.read();
  const start=performance.now();const accepted=await fetch(base+'/api/lots/'+lot.id+'/bid',{method:'POST',headers:{cookie,'Content-Type':'application/json'},body:JSON.stringify({amount:10})});assert.equal(accepted.status,200);await accepted.json();const acknowledgement=performance.now();
  const notice=await reader.read();assert.ok(new TextDecoder().decode(notice.value).includes('changed'));
  const snapshot=await(await fetch(base+'/api/state')).json();assert.equal(snapshot.lots.find(l=>l.id===lot.id).price,10);
  const result={date:'2026-11-03',lot:lot.id,method:'Public HTTPS: independent anonymous event subscriber and registered bidder; measured on established connections',clickEquivalentRoundTripMs:Math.round(performance.now()-start),acceptedToSnapshotMs:Math.round(performance.now()-acknowledgement)};
  assert.ok(result.clickEquivalentRoundTripMs<1000,'Live HTTPS round trip exceeded one second');
  writeFileSync('docs/verification/live-latency.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{clearTimeout(deadline);abort.abort();}
