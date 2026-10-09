import ExcelJS from 'exceljs';
import {Readable} from 'node:stream';

const invalid=message=>Object.assign(new Error(message),{status:422});
const normalize=value=>String(value??'').trim().toLowerCase();
function cellValue(cell){
 if(cell instanceof Date)return cell;
 if(cell&&typeof cell==='object'){
  if('formula' in cell||'sharedFormula' in cell)throw invalid('Replace spreadsheet formulas with values before importing.');
  if(cell.richText)return cell.richText.map(x=>x.text).join('');
  return cell.text??'';
 }
 return cell??'';
}

export async function readFormImport(buffer,filename,fields,masters=[],users=[]){
 const workbook=new ExcelJS.Workbook();
 try{if(/\.xlsx$/i.test(filename))await workbook.xlsx.load(buffer);else if(/\.csv$/i.test(filename))await workbook.csv.read(Readable.from(buffer));else throw invalid('Use an .xlsx or .csv file.');}
 catch(e){if(e.status)throw e;throw invalid('Unable to read this workbook. Choose a valid Excel or CSV file.');}
 const sheet=workbook.getWorksheet('Tenders')||workbook.worksheets[0];
 if(!sheet)throw invalid('The workbook has no worksheets.');
 const editable=fields.filter(f=>!f.computed&&!['decisionDate','approvedBy'].includes(f.key));
 const headers=sheet.getRow(1).values.slice(1).map(cellValue);
 const mapped=headers.map(h=>editable.find(f=>normalize(f.key)===normalize(h)||normalize(f.label)===normalize(h)));
 if(!mapped.some(f=>f?.key==='tenderId'))throw invalid('The first row must contain the tenderId template header.');
 const keys=mapped.filter(Boolean).map(f=>f.key);
 if(new Set(keys).size!==keys.length)throw invalid('The workbook contains duplicate field columns.');
 const rows=[];
 for(let row=2;row<=sheet.rowCount;row++){
  const data={},warnings=[];
  mapped.forEach((field,i)=>{
   if(!field)return;
   let value=cellValue(sheet.getRow(row).getCell(i+1).value);
   if(value===''||value===null||value===undefined)return;
   if(field.type==='date'){
    if(value instanceof Date)value=value.toISOString().slice(0,10);
    else if(typeof value==='number')value=new Date(Date.UTC(1899,11,30)+value*86400000).toISOString().slice(0,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value)){warnings.push(`${field.label}: use YYYY-MM-DD.`);return;}
   }else if(field.type==='time'){
    if(value instanceof Date)value=value.toISOString().slice(11,16);
    else if(typeof value==='number'){const minutes=Math.round((value%1)*1440)%1440;value=String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');}
    value=String(value).trim();
    if(!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)){warnings.push(`${field.label}: use HH:MM.`);return;}
   }else if(field.type==='number'){
    value=Number(String(value).replace(/,/g,'').trim());
    if(!Number.isFinite(value)||value<0){warnings.push(`${field.label}: enter a non-negative number.`);return;}
   }else value=String(value).trim();
   if(field.key==='goDecision'&&!['Pending Review','Hold / Awaiting Info'].includes(value)){warnings.push('Go / No-Go decision requires the approval workflow; kept the current decision.');return;}
   if(field.list){const option=masters.find(m=>m.active&&m.list===field.list&&[m.code,m.value].some(v=>normalize(v)===normalize(value)));if(!option){warnings.push(`${field.label}: "${value}" is not an active option.`);return;}value=option.code;}
   if(field.type==='user'){const user=users.find(u=>u.active&&normalize(u.name)===normalize(value));if(!user){warnings.push(`${field.label}: "${value}" is not an active user.`);return;}value=user.name;}
   data[field.key]=value;
  });
  if(Object.keys(data).length||warnings.length)rows.push({row,data,warnings});
  if(rows.length>1000)throw invalid('Use a file with at most 1,000 tender rows.');
 }
 if(!rows.length)throw invalid('The template is empty. Enter tender details below the headers, then import it.');
 return {rows};
}
