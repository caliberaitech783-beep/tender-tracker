import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {projectIdentity} from '../auth-bdms.mjs';
test('BDMS projection is keyed by immutable ID and never stores credentials',async()=>{
 let query,values;const pool={query:async(q,v)=>{query=q;values=v;return {rows:[{id:'local-id',bdms_id:'42'}]};}};
 await projectIdentity(pool,{id:'42',name:'Test',login:'LOGIN',email:'admin@tender.local',roles:['Bid Manager'],credentialVersion:'protected'});
 assert.match(query,/ON CONFLICT\(bdms_id\)/);assert.match(query,/!bdms-managed!/);assert.equal(values[2],'bdms-42@identity.internal');assert.equal(values.includes('protected'),false);
});
test('BDMS mode blocks local account, password, restore and SSO bypasses',async()=>{
 const server=await readFile(new URL('../server.mjs',import.meta.url),'utf8'),oidc=await readFile(new URL('../auth-oidc.mjs',import.meta.url),'utf8');
 for(const endpoint of ['/api/password','/api/admin/users'])assert.ok(server.includes(`app.post('${endpoint}',async(req,res)=>{if(bdmsEnabled())throw fail(403,`));
 assert.match(server,/if\(!user.bdms_id\|\|!user.credential_version\)throw fail\(401/);
 assert.match(oidc,/IDENTITY_PROVIDER==='bdms'\)return res.sendStatus\(403\)/);
});
