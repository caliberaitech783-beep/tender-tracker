import test from 'node:test';
import assert from 'node:assert/strict';
import {importCell} from '../tender-import.mjs';
import {tenderAdministration} from '../src/tender-permissions.mjs';
test('Excel cells retain numeric zero and convert native dates and times',()=>{
 assert.equal(importCell(0,{type:'number'}),0);
 assert.equal(importCell(new Date('2026-11-10T00:00:00Z'),{type:'date'}),'2026-11-10');
 assert.equal(importCell(0.625,{type:'time'}),'15:00');
 assert.equal(importCell({richText:[{text:'Tender '},{text:'test'}]}),'Tender test');
 assert.throws(()=>importCell({formula:'1+1',result:2}),/values rather than formulas/);
});
test('Administration requires an administrator role even with explicit menu grants',()=>{
 assert.equal(tenderAdministration({roles:['Bid Manager'],tenderPermissions:{desktop:['admin.users']}}),false);
 assert.equal(tenderAdministration({roles:['System Administrator']}),true);
});
