import 'dotenv/config';
import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import {randomBytes,randomUUID,scryptSync} from 'node:crypto';
import {existsSync,promises as fs} from 'node:fs';
import path from 'node:path';
import {DEFAULT_SETTINGS} from './src/domain.mjs';
import {runtimeConfig} from './runtime-config.mjs';
export const localDir=runtimeConfig().stateDir;await fs.mkdir(localDir,{recursive:true});
export const dataDir=process.env.TENDER_DATA_DIR||path.join(process.env.LOCALAPPDATA||localDir,'TenderTracker','postgres');
const configPath=path.join(localDir,'database.json');
const config=existsSync(configPath)?JSON.parse(await fs.readFile(configPath,'utf8')):{user:'tender_local',password:randomBytes(32).toString('hex'),port:5448};
await fs.writeFile(configPath,JSON.stringify(config),{mode:0o600});
export let embedded;
if(!process.env.DATABASE_URL){embedded=new EmbeddedPostgres({databaseDir:dataDir,...config,persistent:true,postgresFlags:['-h','127.0.0.1'],initdbFlags:['--encoding=UTF8','--locale=C'],onLog:()=>{},onError:m=>{if(String(m).includes('FATAL'))console.error(m);}});if(!existsSync(path.join(dataDir,'PG_VERSION')))await embedded.initialise();await embedded.start();const admin=embedded.getPgClient();await admin.connect();const found=await admin.query("SELECT 1 FROM pg_database WHERE datname='tender_tracker'");await admin.end();if(!found.rowCount)await embedded.createDatabase('tender_tracker');}
export const pool=new pg.Pool(process.env.DATABASE_URL?{connectionString:process.env.DATABASE_URL}:{...config,host:'127.0.0.1',database:'tender_tracker',max:10});
await pool.query(await fs.readFile('schema.sql','utf8'));
await pool.query('INSERT INTO settings(id,data) VALUES(1,$1) ON CONFLICT DO NOTHING',[JSON.stringify(DEFAULT_SETTINGS)]);
const spec=JSON.parse(await fs.readFile('src/workbook.json','utf8'));
for(const [list,values]of Object.entries(spec.masters))for(const value of values)await pool.query('INSERT INTO masters(id,list,value,code) VALUES($1,$2,$3,$3) ON CONFLICT DO NOTHING',[randomUUID(),list,value]);
export function hashPassword(password){const salt=randomBytes(16).toString('hex');return `${salt}:${scryptSync(password,salt,64).toString('hex')}`;}
const count=await pool.query('SELECT count(*) FROM users');
if(Number(count.rows[0].count)===0){const password=process.env.INITIAL_ADMIN_PASSWORD||randomBytes(12).toString('base64url');if(password.length<10)throw new Error('Initial administrator password must have at least 10 characters.');await pool.query('INSERT INTO users(id,name,email,password_hash,roles) VALUES($1,$2,$3,$4,$5)',[randomUUID(),'Admin','admin@tender.local',hashPassword(password),JSON.stringify(['System Administrator','Bid Manager','BU Head','Bid Committee / Director'])]);await fs.writeFile(path.join(localDir,'initial-login.txt'),`Local Tender Tracker\nEmail: admin@tender.local\nPassword: ${password}\n`,{mode:0o600});console.log('Initial login saved to .local/initial-login.txt');}
export async function transaction(fn){const c=await pool.connect();try{await c.query('BEGIN');const result=await fn(c);await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
export async function settings(){return (await pool.query('SELECT data FROM settings WHERE id=1')).rows[0].data;}
export async function audit(c,user,tenderId,action,entity,before,after){const changes={};for(const k of new Set([...Object.keys(before||{}),...Object.keys(after||{})]))if(JSON.stringify(before?.[k])!==JSON.stringify(after?.[k]))changes[k]={old:before?.[k]??null,new:after?.[k]??null};await c.query('INSERT INTO audit(tender_id,actor,action,entity,changes) VALUES($1,$2,$3,$4,$5)',[tenderId||null,user?.id||null,action,entity,JSON.stringify(changes)]);}
