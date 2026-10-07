import pg from 'pg';import {readFile} from 'node:fs/promises';
const config=JSON.parse(await readFile('.local/database.json','utf8'));const pool=new pg.Pool({...config,host:'127.0.0.1',database:'tender_tracker'});
const found=(await pool.query("SELECT id FROM tenders WHERE tender_id='TND-2097-99001' AND data->>'title'='Browser verification · private draft'")).rows;
for(const r of found){await pool.query('DELETE FROM audit WHERE tender_id=$1',[r.id]);await pool.query('DELETE FROM tenders WHERE id=$1 AND draft=true',[r.id]);}
console.log('Removed browser-only verification draft:',found.length);await pool.end();
