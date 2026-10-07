import pg from 'pg';import {readFile} from 'node:fs/promises';
const config=JSON.parse(await readFile('.local/database.json','utf8'));const p=new pg.Pool({...config,host:'127.0.0.1',database:'tender_tracker'});
const tenders=(await p.query("SELECT id FROM tenders WHERE tender_id LIKE 'TND-2098-%' AND data->>'title'='Edge verification'")).rows;
for(const {id}of tenders){await p.query('DELETE FROM audit WHERE tender_id=$1',[id]);await p.query('DELETE FROM tenders WHERE id=$1 AND draft=true',[id]);}
const feeds=(await p.query("SELECT id FROM portal_feed WHERE data->>'title' IN('Discovered verification','Imported edge verification') AND (data->>'client' LIKE 'Edge client %' OR data->>'client'='CSV verification client')")).rows;
for(const {id}of feeds){await p.query('DELETE FROM deliveries WHERE notification_id IN(SELECT id FROM notifications WHERE event_key LIKE $1)',['portal:'+id+'%']);await p.query('DELETE FROM notifications WHERE event_key LIKE $1',['portal:'+id+'%']);await p.query('DELETE FROM portal_feed WHERE id=$1',[id]);}
const users=(await p.query("SELECT id,email FROM users WHERE name='Scoped verification user' AND email LIKE 'scope-%@example.test'")).rows;
for(const {id,email}of users){await p.query('DELETE FROM sessions WHERE user_id=$1',[id]);await p.query('DELETE FROM audit WHERE actor=$1 OR changes::text LIKE $2',[id,'%'+email+'%']);await p.query('DELETE FROM users WHERE id=$1',[id]);}
await p.query("DELETE FROM masters WHERE list='Sector' AND code LIKE 'Verification sector %'");await p.query("DELETE FROM audit WHERE changes::text LIKE '%Verification sector %'");console.log('Cleaned isolated edge-verification fixtures.');await p.end();
