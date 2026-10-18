// Run through trusted local/SSH shell only, never exposed as an HTTP endpoint.
import { DatabaseSync } from 'node:sqlite';
import { randomBytes,scryptSync } from 'node:crypto';
import { resolve } from 'node:path';
const configuredDir=process.argv.find(arg=>arg.startsWith('--data-dir='))?.slice(11)||process.env.DATA_DIR||'data';
const db=new DatabaseSync(resolve(configuredDir,'auction.sqlite'));
if(!(db.prepare('PRAGMA table_info(members)').all()).some(c=>c.name==='role'))db.exec("ALTER TABLE members ADD COLUMN role TEXT NOT NULL DEFAULT 'collector' CHECK(role IN ('collector','admin'))");
if(db.prepare("SELECT id FROM members WHERE role='admin'").get())throw new Error('An administrator already exists. No credentials were changed.');
let supplied;
if(process.argv.includes('--import')){let input='';for await(const chunk of process.stdin){input+=chunk;if(input.length>4096)throw new Error('Credentials input too large');}supplied=JSON.parse(input);}
const username=supplied?.username||'house_admin_'+randomBytes(3).toString('hex');
const password=supplied?.password||randomBytes(18).toString('base64url');
if(!/^[a-z0-9_-]{3,24}$/.test(username)||typeof password!=='string'||password.length<16||password.length>128)throw new Error('Invalid administrator credentials');
const salt=randomBytes(16).toString('hex');
db.exec('BEGIN IMMEDIATE');
try{
  if(db.prepare("SELECT id FROM members WHERE role='admin'").get())throw new Error('An administrator already exists.');
  const result=db.prepare("INSERT INTO members(name,password,salt,balance,role) VALUES (?,?,?,1000,'admin')").run(username,scryptSync(password,salt,64).toString('hex'),salt);
  const id=Number(result.lastInsertRowid);
  db.prepare('INSERT INTO ledger(member,delta,action,lot,at) VALUES (?,1000,?,NULL,?)').run(id,'welcome',Date.now());
  db.prepare('INSERT INTO audit(at,actor,action,target,outcome,detail) VALUES (?,?,?,?,?,?)').run(Date.now(),'HOUSE','admin.provisioned','B'+String(id).padStart(4,'0'),'ok','{}');
  db.exec('COMMIT');console.log(JSON.stringify({username,password}));
}catch(error){db.exec('ROLLBACK');throw error;}finally{db.close();}
