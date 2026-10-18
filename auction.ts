import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomInt, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export class Fault extends Error { status: number; constructor(status: number, message: string) { super(message); this.status = status; } }
export type Member = { id: number; name: string; password: string; salt: string; balance: number };
type Lot = { id: number; title: string; description: string; category: string; edition: number; valuation: number; status: string; price: number; bidder: number | null; ends: number | null; owner: number | null; payout: number | null };
const dir = resolve(process.env.DATA_DIR || 'data'); mkdirSync(dir, { recursive: true });
export const db = new DatabaseSync(resolve(dir, 'auction.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS members(id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, password TEXT NOT NULL, salt TEXT NOT NULL, balance INTEGER NOT NULL CHECK(balance>=0));
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, member INTEGER NOT NULL REFERENCES members(id), expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS lots(id INTEGER PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL, edition INTEGER NOT NULL, valuation INTEGER NOT NULL CHECK(valuation>0), status TEXT NOT NULL, price INTEGER NOT NULL DEFAULT 0, bidder INTEGER REFERENCES members(id), ends INTEGER, owner INTEGER REFERENCES members(id), payout INTEGER);
CREATE TABLE IF NOT EXISTS bids(id INTEGER PRIMARY KEY, lot INTEGER NOT NULL REFERENCES lots(id), member INTEGER NOT NULL REFERENCES members(id), amount INTEGER NOT NULL, at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS ledger(id INTEGER PRIMARY KEY, member INTEGER NOT NULL REFERENCES members(id), delta INTEGER NOT NULL, action TEXT NOT NULL, lot INTEGER, at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, at INTEGER NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, outcome TEXT NOT NULL, detail TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS lots_status ON lots(status);`);
export const paddle = (id: number) => `B${String(id).padStart(4, '0')}`;
export const digest = (token: string) => createHash('sha256').update(token).digest('hex');
function log(actor: number | null, action: string, target: string, outcome: string, detail: Record<string, unknown> = {}) {
  const entry = { at: Date.now(), actor: actor ? paddle(actor) : 'HOUSE', action, target, outcome, detail: JSON.stringify(detail) };
  const r = db.prepare('INSERT INTO audit(at,actor,action,target,outcome,detail) VALUES (?,?,?,?,?,?)').run(entry.at, entry.actor, action, target, outcome, entry.detail);
  return { event_id: Number(r.lastInsertRowid), ...entry, detail };
}
export function denied(actor: number | null, action: string, target: string, reason: string) {
  console.log(JSON.stringify(log(actor, action, target, 'denied', { reason })));
}
function transaction<T>(actor: number | null, action: string, target: string, fn: () => T): T {
  const previous = (db.prepare('SELECT COALESCE(max(id),0) id FROM audit').get() as {id:number}).id;
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    const detail = action==='bid.accepted' ? {amount:(result as {amount:number}).amount} : action==='pawn.sold' ? {payout:(result as {payout:number}).payout} : {};
    log(actor, action, target, 'ok',detail);
    db.exec('COMMIT');
    const committed=db.prepare('SELECT * FROM audit WHERE id>? ORDER BY id').all(previous);
    for(const row of committed)console.log(JSON.stringify({...row,detail:JSON.parse(String(row.detail))}));
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    if (err instanceof Fault) denied(actor, action, target, err.message);
    throw err;
  }
}
function movement(member: number, delta: number, action: string, lot: number | null = null) {
  db.prepare('UPDATE members SET balance = balance + ? WHERE id = ?').run(delta, member);
  db.prepare('INSERT INTO ledger(member,delta,action,lot,at) VALUES (?,?,?,?,?)').run(member, delta, action, lot, Date.now());
}
const catalogue = [
  ['A Sunday without deadlines','A whole day with nothing due. Includes a slow breakfast. Monday is sold separately.','time'],
  ['Eight uninterrupted hours of sleep','No alarms, no notifications, no remembering something at 3 a.m. Supplied in one piece.','time'],
  ['One perfectly timed silence','For the moment when saying nothing says exactly enough. Previously unopened.','feeling'],
  ['A message from an old friend','The opening line reads: I was just thinking about you. The rest is yours to discover.','memory'],
  ['The last train, caught','A platform, a closing door, and a small kindness from probability. Valid for one impossible arrival.','chance'],
  ['A second first impression','A clean beginning with someone who has already met you. Minor traces of the original may remain.','chance'],
  ['The courage to say no','One gentle, complete refusal. No explanation enclosed. Guilt is not included.','feeling'],
  ['Seventeen returned minutes','Recovered from a meeting that should have been an email. All seventeen minutes are accounted for.','time'],
  ['A summer you can revisit','Warm pavement, a familiar doorway, and the light at six o’clock. Dates may differ from memory.','memory'],
  ['Ownership of Thursday','One weekday with full naming rights. Existing obligations remain the responsibility of the calendar.','chance'],
  ['A small, unreasonable hope','Resilient in poor conditions. Keep away from people who insist they are only being realistic.','feeling'],
  ['The smell of a vanished home','Carefully preserved in an unmarked envelope. The address is no longer recognised by the post office.','memory'],
  ['One mistake nobody remembers','A rare example of collective forgetfulness. Documentation has, naturally, been misplaced.','chance'],
  ['The end of an awkward conversation','An immaculate exit, with no invented phone call. Works equally well at parties and family gatherings.','feeling'],
  ['A morning before the internet','Birdsong and a newspaper that does not refresh. Some assembly of attention required.','time'],
  ['The name on the tip of your tongue','Comes back just when you need it. Identity withheld until the appropriate moment.','memory'],
];
function seed() {
  if ((db.prepare('SELECT count(*) n FROM lots').get() as {n:number}).n) return;
  const insert = db.prepare('INSERT INTO lots(title,description,category,edition,valuation,status) VALUES (?,?,?,?,?,?)');
  db.exec('BEGIN');
  try { for (let edition = 1; edition <= 6; edition++) for (const [title, description, category] of catalogue) insert.run(title, description, category, edition, randomInt(20,1601), 'queued'); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; }
}
seed();
export const duration = process.env.NODE_ENV === 'test' ? Number(process.env.AUCTION_MS || 90000) : 90000;
export const softClose = process.env.NODE_ENV === 'test' ? Number(process.env.SOFT_CLOSE_MS || 10000) : 10000;
export function tick() {
  const due = db.prepare("SELECT * FROM lots WHERE status='live' AND ends<=?").all(Date.now()) as unknown as Lot[];
  for (const lot of due) transaction(lot.bidder, lot.bidder ? 'auction.won' : 'auction.unsold', `lot:${lot.id}`, () => {
    db.prepare('UPDATE lots SET status=?,owner=? WHERE id=? AND status=?').run(lot.bidder ? 'owned' : 'unsold', lot.bidder, lot.id, 'live');
    // The winning amount was already deducted at bid acceptance, never again at settlement.
  });
  const remaining=(db.prepare("SELECT count(*) n FROM lots WHERE status='queued'").get() as {n:number}).n;
  if(remaining<6)transaction(null,'vault.replenished','catalogue',()=>{
    const edition=(db.prepare('SELECT max(edition) n FROM lots').get() as {n:number}).n+1;
    for(const [title,description,category] of catalogue)db.prepare('INSERT INTO lots(title,description,category,edition,valuation,status) VALUES (?,?,?,?,?,?)').run(title,description,category,edition,randomInt(20,1601),'queued');
  });
  const live = (db.prepare("SELECT count(*) n FROM lots WHERE status='live'").get() as {n:number}).n;
  const queue = db.prepare("SELECT id FROM lots WHERE status='queued' ORDER BY id LIMIT ?").all(3-live) as {id:number}[];
  for (let i=0;i<queue.length;i++) transaction(null, 'auction.opened', `lot:${queue[i].id}`, () => {
    db.prepare("UPDATE lots SET status='live',ends=? WHERE id=?").run(Date.now() + duration + (live+i)*Math.floor(duration/3), queue[i].id);
  });
  return !!(due.length || queue.length);
}
export function register(name: string, hash: string, salt: string) {
  return transaction(null, 'member.registered', 'registration', () => {
    if (db.prepare('SELECT id FROM members WHERE name=?').get(name)) throw new Fault(409,'That bidder name is already registered. Try signing in.');
    const r = db.prepare('INSERT INTO members(name,password,salt,balance) VALUES (?,?,?,0)').run(name,hash,salt);
    const id = Number(r.lastInsertRowid); movement(id,1000,'welcome');
    log(id,'wallet.welcome','wallet','ok',{amount:1000});
    return db.prepare('SELECT * FROM members WHERE id=?').get(id) as Member;
  });
}
export function session(member: number) {
  const token = randomBytes(32).toString('hex');
  db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
  db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(digest(token),member,Date.now()+30*86400000); return token;
}
export function memberFor(token?: string) {
  if (!token) return null;
  return db.prepare('SELECT m.* FROM members m JOIN sessions s ON m.id=s.member WHERE s.token=? AND s.expires>?').get(digest(token),Date.now()) as Member | undefined;
}
export function bid(member: Member, id: number, amount: unknown) {
  return transaction(member.id,'bid.accepted',`lot:${id}`,() => {
    const lot = db.prepare('SELECT * FROM lots WHERE id=?').get(id) as Lot | undefined;
    if (!lot || lot.status !== 'live' || lot.ends! <= Date.now()) throw new Fault(409,'This lot is no longer accepting bids.');
    if (!Number.isSafeInteger(amount) || (amount as number) < lot.price+10 || (amount as number)>1000000) throw new Fault(400,`The next bid must be a whole number of at least $${lot.price+10}.`);
    const wallet = db.prepare('SELECT balance FROM members WHERE id=?').get(member.id) as {balance:number};
    const reusable = lot.bidder === member.id ? lot.price : 0;
    if (wallet.balance+reusable < (amount as number)) throw new Fault(409,'Insufficient available funds. Your other leading bids remain reserved.');
    if (lot.bidder) movement(lot.bidder,lot.price,'bid.refund',id);
    movement(member.id,-(amount as number),'bid.reserve',id);
    db.prepare('UPDATE lots SET bidder=?,price=?,ends=? WHERE id=?').run(member.id,amount as number,Math.max(lot.ends!,Date.now()+softClose),id);
    db.prepare('INSERT INTO bids(lot,member,amount,at) VALUES (?,?,?,?)').run(id,member.id,amount as number,Date.now());
    return {ok:true,amount};
  });
}
export function pawn(member: Member, id: number) {
  return transaction(member.id,'pawn.sold',`lot:${id}`,() => {
    const lot = db.prepare('SELECT * FROM lots WHERE id=?').get(id) as Lot | undefined;
    if (!lot || lot.owner !== member.id || lot.status !== 'owned') throw new Fault(403,'Only the owner can sell an unpawned collectible.');
    db.prepare("UPDATE lots SET status='pawned',payout=valuation WHERE id=?").run(id);
    movement(member.id,lot.valuation,'pawn.payout',id);
    return {ok:true,payout:lot.valuation,paid:lot.price,profit:lot.valuation-lot.price,title:lot.title};
  });
}
export function state(member: Member | null | undefined) {
  const visible = db.prepare("SELECT l.id,l.title,l.description,l.category,l.edition,l.status,l.price,l.ends,m.name bidder_name,m.id bidder_id FROM lots l LEFT JOIN members m ON m.id=l.bidder WHERE l.status='live' ORDER BY l.id").all();
  const me = member ? db.prepare('SELECT id,name,balance FROM members WHERE id=?').get(member.id) : null;
  const collection = member ? db.prepare("SELECT id,title,description,category,edition,status,price,payout FROM lots WHERE owner=? ORDER BY id DESC").all(member.id) : [];
  const ledger = member ? db.prepare('SELECT id,delta,action,lot,at FROM ledger WHERE member=? ORDER BY id DESC LIMIT 40').all(member.id) : [];
  const held = member ? (db.prepare("SELECT COALESCE(sum(price),0) amount FROM lots WHERE status='live' AND bidder=?").get(member.id) as {amount:number}).amount : 0;
  const upcoming = db.prepare("SELECT id,title,category,edition FROM lots WHERE status='queued' ORDER BY id LIMIT 6").all();
  const pool = (db.prepare("SELECT count(*) n FROM lots WHERE status='queued'").get() as {n:number}).n;
  return {now:Date.now(),me:me ? {...me,paddle:paddle(member!.id),held} : null,lots:visible,collection,ledger,upcoming,pool};
}
tick();
