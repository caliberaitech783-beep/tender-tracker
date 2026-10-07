import {readFile,readdir,unlink} from 'node:fs/promises';import pg from 'pg';import path from 'node:path';
const config=JSON.parse(await readFile('.local/database.json','utf8'));const p=new pg.Pool({...config,host:'127.0.0.1',database:'tender_tracker'});
const counts=(await p.query("SELECT (SELECT count(*) FROM tenders)::int AS tenders,(SELECT count(*) FROM documents)::int AS documents,(SELECT count(*) FROM users)::int AS users,(SELECT count(DISTINCT list) FROM masters)::int AS master_lists,(SELECT count(*) FROM portal_feed)::int AS portal_discoveries")).rows[0];
const referenced=new Set((await p.query('SELECT stored_path FROM documents')).rows.map(d=>path.resolve(d.stored_path)));let removed=0;
for(const filename of await readdir('data/documents')){const file=path.resolve('data/documents',filename);if(/^[a-f0-9-]{36}\.[a-z0-9]+$/i.test(filename)&&!referenced.has(file)){await unlink(file);removed++;}}
console.log(JSON.stringify({...counts,orphanedVerificationFilesRemoved:removed}));
const health=await fetch('http://127.0.0.1:4310/api/health').then(r=>r.json());console.log(JSON.stringify({server:health.status,database:health.database,url:'http://localhost:4310'}));await p.end();
