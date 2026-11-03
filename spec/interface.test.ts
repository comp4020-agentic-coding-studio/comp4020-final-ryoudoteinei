import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';

it('retains active bids and collectible keyboard focus when unrelated live changes arrive',async()=>{
  const dom=new JSDOM(readFileSync('public/index.html','utf8'),{url:'http://localhost/',runScripts:'outside-only'});
  const win=dom.window;
  let notify=()=>{};
  class Stream{readyState=1;addEventListener(name:string,fn:()=>void){if(name==='changed')notify=fn;}}
  const lot={id:1,title:'A Sunday',description:'A quiet day',category:'time',edition:1,ends:Date.now()+60000,price:10,bidder_id:2,bidder_name:'other'};
  let state={now:Date.now(),me:{id:1,name:'reviewer',paddle:'B0001',balance:1000,held:0,role:'collector'},lots:[lot],collection:[{...lot,id:9,status:'owned'}],ledger:[],upcoming:[],pool:93};
  Object.assign(win,{EventSource:Stream,AbortSignal,fetch:async()=>({ok:true,json:async()=>state})});
  win.eval(readFileSync('public/app.js','utf8'));
  await new Promise(r=>setTimeout(r,10));
  const bid=win.document.querySelector<HTMLInputElement>('#bid-1')!;bid.value='57';bid.focus();
  state={...state,lots:[{...lot,price:40}]};notify();await new Promise(r=>setTimeout(r,10));
  expect(bid.value).toBe('57');expect(win.document.activeElement).toBe(bid);
  const pawn=win.document.querySelector<HTMLButtonElement>('[data-pawn]')!;pawn.focus();
  state={...state,lots:[{...lot,price:60}]};notify();await new Promise(r=>setTimeout(r,10));
  expect(win.document.querySelector('[data-pawn]')).toBe(pawn);expect(win.document.activeElement).toBe(pawn);
  expect(win.document.querySelector('#admin-key-section')!.hasAttribute('hidden')).toBe(true);
  dom.window.close();
});
