export function importCell(value,field){
 if(value instanceof Date)return field?.type==='time'?value.toISOString().slice(11,16):value.toISOString().slice(0,10);
 if(value&&typeof value==='object'){
  if(value.formula||value.sharedFormula)throw new Error('Use values rather than formulas in import cells.');
  value=value.text??value.richText?.map(part=>part.text).join('')??'';
 }
 if(field?.type==='time'&&typeof value==='number'&&value>=0&&value<1){const minutes=Math.round(value*1440);return String(Math.floor(minutes/60)%24).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');}
 return typeof value==='string'?value.trim():value??'';
}
