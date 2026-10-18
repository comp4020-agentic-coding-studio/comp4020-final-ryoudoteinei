// Read-only deployment smoke check. Domain/restart tests use isolated databases.
import assert from 'node:assert/strict';
const app=process.argv[2]||'comp4020-final-ryoudoteinei';
if(!/^[a-z0-9-]+$/.test(app))throw new Error('Invalid Fly app name');
const base=`https://${app}.fly.dev`;
for(const path of ['/','/readme/','/app.js','/style.css']){
  const res=await fetch(base+path,{signal:AbortSignal.timeout(20000)});assert.equal(res.status,200,path);console.log('PASS',path,res.status);await res.text();
}
const response=await fetch(base+'/api/state',{signal:AbortSignal.timeout(20000)});assert.equal(response.status,200);const state=await response.json();
assert.equal(state.me,null);assert.deepEqual(state.collection,[]);assert.ok(state.lots.length>0);assert.ok(!JSON.stringify(state).match(/valuation|password|token|salt/));
console.log('PASS: public saleroom responds without exposing accounts or sealed appraisals');
const abort=new AbortController();const timeout=setTimeout(()=>abort.abort(),15000);
try{const events=await fetch(base+'/api/events',{signal:abort.signal});assert.equal(events.status,200);const first=await events.body.getReader().read();assert.ok(new TextDecoder().decode(first.value).includes('changed'));console.log('PASS: event stream is ready for live changes');}finally{clearTimeout(timeout);abort.abort();}
