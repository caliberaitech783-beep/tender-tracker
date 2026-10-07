import test from 'node:test';
import assert from 'node:assert/strict';
import {runtimeConfig} from '../runtime-config.mjs';

test('local startup stays bound to loopback',()=>{
 assert.equal(runtimeConfig({}).host,'127.0.0.1');
});
test('production refuses a missing database or an insecure public URL',()=>{
 assert.throws(()=>runtimeConfig({NODE_ENV:'production'}),/DATABASE_URL/);
 assert.throws(()=>runtimeConfig({NODE_ENV:'production',DATABASE_URL:'postgresql://localhost/tender',PUBLIC_APP_URL:'http://tender.cmll.in'}),/HTTPS/);
});
test('Azure production accepts its HTTPS domain and persistent storage paths',()=>{
 const config=runtimeConfig({NODE_ENV:'production',DATABASE_URL:'postgresql://localhost/tender',PUBLIC_APP_URL:'https://tender.cmll.in',TENDER_STATE_DIR:'/home/tender/state',TENDER_DOCUMENTS_DIR:'/home/tender/documents'});
 assert.equal(config.host,'0.0.0.0');
 assert.equal(config.publicOrigin,'https://tender.cmll.in');
 assert.ok(config.documentsDir.endsWith('documents'));
});
