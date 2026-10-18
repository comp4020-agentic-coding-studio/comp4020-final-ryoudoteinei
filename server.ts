import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { bid, pawn, register, session, memberFor, digest, denied, state, tick, db, Fault, paddle, createCreditKey,creditKeys,redeemCreditKey } from './auction.ts';
import type { Member } from './auction.ts';
const scrypt = promisify(scryptCallback);
const streams = new Set<ServerResponse>();
function changed() { for (const res of streams) if (!res.write('event: changed\ndata: {}\n\n')) res.destroy(); }
const clock = setInterval(() => { try { if (tick()) changed(); } catch { console.error(JSON.stringify({action:'settlement.error',outcome:'error'})); } },250);
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]!);
function markdown(md: string) {
  const inline = (s: string) => escape(s).replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g,'<a href="$2">$1</a>').replace(/`([^`]+)`/g,'<code>$1</code>');
  return md.trim().split(/\r?\n\s*\r?\n/).map(block => { const h=block.match(/^(#{1,6}) (.+)$/); return h ? `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>` : `<p>${inline(block)}</p>`; }).join('\n');
}
function send(res: ServerResponse, code: number, data: unknown) { res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data)); }
const cookieToken = (req: IncomingMessage) => req.headers.cookie?.match(/(?:^|;\s*)auction_session=([a-f0-9]{64})(?:;|$)/)?.[1];
function setSession(res: ServerResponse, token: string) { res.setHeader('Set-Cookie',`auction_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${process.env.NODE_ENV==='production'?'; Secure':''}`); }
async function body(req: IncomingMessage) {
  const chunks:Buffer[]=[];let size=0;
  for await (const chunk of req) { size+=chunk.length;if(size>4096) throw new Fault(413,'Request too large.');chunks.push(chunk); }
  try {const value=JSON.parse(Buffer.concat(chunks).toString());if(!value || typeof value!=='object' || Array.isArray(value)) throw 0;return value as Record<string,unknown>;}catch {throw new Fault(400,'Invalid request.');}
}
const authAttempts = new Map<string,{at:number,count:number}>();
function limit(req:IncomingMessage) {
  const key=req.socket.remoteAddress||'unknown';const now=Date.now();const old=authAttempts.get(key);
  if(old && now-old.at<60000){if(++old.count>20) throw new Fault(429,'Too many sign-in attempts. Try again in a minute.');}
  else authAttempts.set(key,{at:now,count:1});
  if(authAttempts.size>1000)for(const [k,v] of authAttempts)if(now-v.at>60000)authAttempts.delete(k);
}
const server=createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  const url=new URL(req.url||'/','http://localhost');let member: Member|null|undefined;const requestId=randomBytes(6).toString('hex');res.setHeader('X-Request-Id',requestId);
  try {
    member=memberFor(cookieToken(req));
    if(req.method==='GET' && ['/','/style.css','/app.js'].includes(url.pathname)){
      const file=url.pathname==='/'?'index.html':url.pathname.slice(1);res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8');res.end(readFileSync(`public/${file}`));return;
    }
    if(req.method==='GET' && /^\/readme\/?$/.test(url.pathname)){
      res.setHeader('Content-Type','text/html; charset=utf-8');res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Intangible Auction House — About</title><link rel="stylesheet" href="/style.css"></head><body><header class="masthead"><a href="/" class="wordmark">THE INTANGIBLE<br><em>AUCTION HOUSE</em></a><a href="/">Return to the saleroom ↗</a></header><main class="readme">${markdown(readFileSync('README.md','utf8'))}</main></body></html>`);return;
    }
    if(req.method==='GET' && url.pathname==='/api/events'){
      res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform',Connection:'keep-alive','X-Accel-Buffering':'no'});res.write('retry: 1000\nevent: changed\ndata: {}\n\n');streams.add(res);
      const heartbeat=setInterval(()=>res.write(': heartbeat\n\n'),15000);res.on('close',()=>{clearInterval(heartbeat);streams.delete(res);});return;
    }
    if(req.method==='GET' && url.pathname==='/api/state'){if(tick())changed();send(res,200,state(member));return;}
    if(req.method==='GET' && url.pathname==='/api/admin/keys'){if(!member)throw new Fault(401,'Sign in first.');send(res,200,{keys:creditKeys(member)});return;}
    if(req.method!=='POST')throw new Fault(404,'Not found.');
    if(!req.headers['content-type']?.startsWith('application/json'))throw new Fault(415,'Send application/json.');
    if(req.headers.origin && new URL(req.headers.origin).host!==req.headers.host)throw new Fault(403,'Use this website to make changes.');
    const data=await body(req);
    if(url.pathname==='/api/register' || url.pathname==='/api/login'){
      limit(req);
      if(typeof data.name!=='string'||!/^[a-zA-Z0-9_-]{3,24}$/.test(data.name)||typeof data.password!=='string'||data.password.length<8||data.password.length>128)throw new Fault(400,'Use a bidder name of 3–24 letters, numbers, underscores or dashes, and a password of 8–128 characters.');
      const name=data.name.toLowerCase();
      if(url.pathname==='/api/register'){
        const salt=randomBytes(16).toString('hex');const hash=(await scrypt(data.password,salt,64) as Buffer).toString('hex');member=register(name,hash,salt);
      }else{
        const existing=db.prepare('SELECT * FROM members WHERE name=?').get(name) as Member|undefined;
        const hash=await scrypt(data.password,existing?.salt||'dummy-salt',64) as Buffer;
        if(!existing||!timingSafeEqual(hash,Buffer.from(existing.password,'hex')))throw new Fault(401,'Bidder name or password is incorrect.');member=existing;
        console.log(JSON.stringify({at:Date.now(),actor:paddle(member.id),action:'member.login',outcome:'ok',request_id:requestId}));
      }
      setSession(res,session(member.id));send(res,200,{ok:true});changed();return;
    }
    if(url.pathname==='/api/logout'){
      const token=cookieToken(req);if(token)db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token));setSession(res,'');send(res,200,{ok:true});return;
    }
    if(!member){denied(null,'auth.required',url.pathname,'Sign in before making changes.');throw new Fault(401,'Register or sign in to take part.');}
    if(url.pathname==='/api/admin/keys'){send(res,200,createCreditKey(member,data.amount));return;}
    if(url.pathname==='/api/redeem'){limit(req);const result=redeemCreditKey(member,data.code);changed();send(res,200,result);return;}
    const match=url.pathname.match(/^\/api\/lots\/(\d+)\/(bid|pawn)$/);
    if(!match)throw new Fault(404,'Not found.');
    if(tick())changed();const id=Number(match[1]);
    const result=match[2]==='bid'?bid(member,id,data.amount):data.confirm===true?pawn(member,id):(()=>{throw new Fault(400,'Confirm that this sale is final and the price is revealed only afterwards.');})();
    changed();send(res,200,result);
  }catch(error){
    const code=error instanceof Fault?error.status:500;
    console.log(JSON.stringify({at:Date.now(),request_id:requestId,actor:member?paddle(member.id):'GUEST',action:'request.rejected',path:url.pathname,outcome:code,reason:error instanceof Fault?error.message:'internal error'}));
    if(!res.headersSent)send(res,code,{error:error instanceof Fault?error.message:'The house could not complete that request. Try again.'});else res.end();
  }
});
server.requestTimeout=15000;
server.listen(Number(process.env.PORT||8080),process.env.HOST||'0.0.0.0',()=>console.log('Auction house listening on '+(process.env.PORT||8080)));
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{clearInterval(clock);for(const res of streams)res.end();server.close(()=>{db.close();process.exit(0);});});
