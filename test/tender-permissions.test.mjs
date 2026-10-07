import test from 'node:test';
import assert from 'node:assert/strict';
import {TENDER_ALL_PERMISSIONS,tenderAllowed,tenderCanList,tenderAdministration} from '../src/tender-permissions.mjs';
import {permitted,canSeePricing} from '../src/domain.mjs';
const user=(desktop=[],mobile=desktop)=>({roles:['System Administrator'],tenderPermissions:{desktop,mobile}});
test('Per-user selections override broad roles and global role defaults',()=>{
 const u=user(['menu.pipeline','overview.read']);
 assert.equal(tenderCanList(u),true);assert.equal(permitted(u,'overview','write'),false);
 assert.equal(permitted(u,'submission','write',{permissions:{submission:{write:['System Administrator']}}}),false);
 assert.equal(tenderAdministration(u),false);assert.equal(canSeePricing(u),false);
 assert.equal(permitted(user(TENDER_ALL_PERMISSIONS),'award','approve'),true);
});
test('Explicitly empty selections grant no features and cannot inherit another user or view',()=>{
 const u=user([],['menu.reports','overview.read']);
 assert.equal(tenderCanList(u),false);assert.equal(tenderAllowed(u,'menu.reports'),false);
 assert.equal(tenderAllowed({...u,permissionView:'mobile'},'menu.reports'),true);
 assert.equal(tenderAllowed(user(TENDER_ALL_PERMISSIONS),'menu.reports'),true);
 assert.equal(tenderAllowed(u,'menu.reports'),false);
});
test('Write, delete and approval require read access to the same submenu',()=>{
 assert.equal(permitted(user(['queries.write','queries.delete']),'queries','write'),false);
 assert.equal(permitted(user(['queries.read','queries.write']),'queries','write'),true);
 assert.equal(permitted(user(['queries.read','queries.write']),'queries','delete'),false);
 assert.equal(permitted(user(['award.approve']),'award','approve'),false);
});
