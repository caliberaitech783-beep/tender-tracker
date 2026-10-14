import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ExcelJS from 'exceljs';
import {REGISTRATION_COLUMNS,REGISTRATION_SECTIONS,registrationRequired,registrationField} from '../src/registration-format.mjs';
import {DEFAULT_SETTINGS} from '../src/domain.mjs';
import {readFormImport} from '../form-import.mjs';
const spec=JSON.parse(fs.readFileSync(new URL('../src/workbook.json',import.meta.url)));
test('registration renders exactly 30 columns in the workbook order',()=>{
 assert.equal(REGISTRATION_COLUMNS.length,30);
 assert.deepEqual(REGISTRATION_SECTIONS.flatMap(([,keys])=>keys),REGISTRATION_COLUMNS.map(([key])=>key));
 for(const [key,label]of REGISTRATION_COLUMNS)assert.equal(registrationField(spec.fields.find(f=>f.key===key)).label,label);
 assert.deepEqual(registrationField(spec.fields.find(f=>f.key==='tenderType')).allowedValues,['OB','Logistics','MDO']);
 assert.ok(registrationField(spec.fields.find(f=>f.key==='tenderType'),{tenderType:'Open Tender'}).allowedValues.includes('Open Tender'));
});
test('hidden fields and workbook optional columns cannot block registration',()=>{
 assert.deepEqual(registrationRequired(['tenderId','businessUnit','documentFee','turnoverRequired','netWorthRequired','experienceRequired','workingCapital']),[]);
 assert.deepEqual(DEFAULT_SETTINGS.requiredRegistrationFields,[]);
 assert.equal(DEFAULT_SETTINGS.requireDocuments,false);
 for(const field of spec.fields)assert.equal(registrationField(field).required,false);
});
test('imports row-four headers, both Time columns and new financial/corrigendum fields',async()=>{
 const w=new ExcelJS.Workbook(),s=w.addWorksheet('Sheet1');
 s.getRow(4).values=REGISTRATION_COLUMNS.map(([,label])=>label);
 s.getRow(5).getCell(5).value='Dropdown OB, Logistics , MDO';s.getRow(5).getCell(25).value='Note: Not mandatory';
 const values={tenderId:'TND-2026-1234',title:'Mine contract',client:'Client',tenderType:'OB',publishDate:new Date('2026-10-12T00:00:00Z'),publishTime:0.375,deadline:new Date('2026-10-30T00:00:00Z'),submissionTime:0.625,workingCapital:500000,corrigendum:'Deadline extended'};
 s.getRow(6).values=REGISTRATION_COLUMNS.map(([key])=>values[key]??null);
 const masters=Object.entries(spec.masters).flatMap(([list,values])=>values.map(value=>({list,code:value,value,active:true})));
 const {rows}=await readFormImport(await w.xlsx.writeBuffer(),'new tender format.xlsx',spec.fields,masters);
 assert.equal(rows.length,1);assert.equal(rows[0].row,6);assert.deepEqual(rows[0].warnings,[]);
 assert.equal(rows[0].data.publishTime,'09:00');assert.equal(rows[0].data.submissionTime,'15:00');
 assert.equal(rows[0].data.workingCapital,500000);assert.equal(rows[0].data.corrigendum,'Deadline extended');assert.equal(rows[0].data.tenderType,'OB');
});
