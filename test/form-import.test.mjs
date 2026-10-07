import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {readFormImport} from '../form-import.mjs';
const fields=[{key:'tenderId',label:'Tender ID',type:'text'},{key:'title',type:'text'},{key:'deadline',label:'Deadline',type:'date'},{key:'submissionTime',label:'Time',type:'time'},{key:'estimatedValue',label:'Value',type:'number'},{key:'sector',label:'Sector',type:'select',list:'Sector'},{key:'goDecision',type:'select'},{key:'approvedBy',type:'text'}];
async function file(rows){const w=new ExcelJS.Workbook();w.addWorksheet('Tenders').addRows(rows);return w.xlsx.writeBuffer();}
test('maps Excel dates, times, numbers and master labels without approval fields',async()=>{
 const buffer=await file([fields.map(f=>f.key),['TND-2026-1234','Example',new Date('2026-10-15T00:00:00Z'),0.5,'1,234','civil','Go','Administrator']]);
 const {rows}=await readFormImport(buffer,'input.xlsx',fields,[{list:'Sector',code:'CIVIL',value:'Civil',active:true}]);
 assert.deepEqual(rows[0].data,{tenderId:'TND-2026-1234',title:'Example',deadline:'2026-10-15',submissionTime:'12:00',estimatedValue:1234,sector:'CIVIL'});
 assert.equal(rows[0].warnings.length,1);
});
test('rejects empty templates and duplicate headers',async()=>{
 await assert.rejects(readFormImport(await file([['tenderId','title']]),'empty.xlsx',fields),/template is empty/);
 await assert.rejects(readFormImport(await file([['tenderId','Tender ID'],['one','two']]),'duplicates.xlsx',fields),/duplicate/);
});
test('preserves multiple CSV rows and skips invalid values with warnings',async()=>{
 const {rows}=await readFormImport(Buffer.from('tenderId,title,estimatedValue,sector\nTND-2026-1234,"A, B",-5,Unknown\nTND-2026-1235,Second,0,\n'),'input.csv',fields);
 assert.equal(rows.length,2);assert.equal(rows[0].data.title,'A, B');assert.equal(rows[0].warnings.length,2);assert.equal(rows[1].data.estimatedValue,0);
});
test('rejects formulas rather than trusting cached results',async()=>{
 await assert.rejects(readFormImport(await file([['tenderId','title'],['TND-2026-1234',{formula:'1+1',result:2}]]),'formula.xlsx',fields),/formulas/);
});
