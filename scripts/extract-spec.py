import json,re
from pathlib import Path
a=json.loads(Path('docs/workbook-inspection.json').read_text(encoding='utf-8'))
masters=next(s for s in a if s['sheet'].strip()=='Masters')
bycell={c['cell']:c['value'] for c in masters['cells']}
lists={}
for c in masters['cells']:
    if c['cell'].endswith('4') and c['value'] and str(c['value']).startswith('L_'):
        col=re.sub(r'\d+','',c['cell']); lists[c['value'][2:]]=[bycell[f'{col}{i}'] for i in range(5,19) if bycell.get(f'{col}{i}')]
mapping=next(s for s in a if s['sheet']=='HTML format')
rows={}
for c in mapping['cells']:
    col=re.sub(r'\d+','',c['cell']); r=int(re.search(r'\d+',c['cell']).group()); rows.setdefault(r,{})[col]=c['value']
keys={'A':'tenderId','B':'clientRef','C':'title','D':'client','E':'clientType','F':'sector','G':'businessUnit','H':'country','I':'region','J':'location','K':'source','L':'portalUrl','M':'tenderType','N':'bidSystem','O':'contractType','P':'procurementMode','Q':'publishDate','R':'downloadDate','S':'queryDeadline','T':'meetingDate','U':'visitDate','V':'deadline','W':'submissionTime','X':'technicalOpening','Y':'financialOpening','Z':'validityDays','AA':'daysRemaining','AB':'deadlineAlert','AC':'currency','AD':'estimatedValue','AE':'durationMonths','AF':'documentFee','AG':'emdAmount','AH':'emdForm','AI':'performanceSecurity','AJ':'paymentTerms','AK':'mobilisationAdvance','AL':'priceVariation','AM':'ldTerms','AN':'turnoverRequired','AO':'netWorthRequired','AP':'experienceRequired','AQ':'certifications','AR':'jvAllowed','AS':'subcontracting','AT':'localPreference','AU':'eligibility','BL':'corrigendumCount','BM':'documentCompleteness','BN':'score','BO':'recommendation','BP':'goDecision','BQ':'decisionDate','BR':'approvedBy','BS':'owner','BT':'priority','BU':'winProbability','BV':'weightedValue','BW':'pipelineStatus','BX':'remarks'}
lookup={'clientType':'ClientType','sector':'Sector','businessUnit':'BU','source':'Source','tenderType':'TenderType','bidSystem':'BidSystem','contractType':'ContractType','procurementMode':'ProcMode','currency':'Currency','emdForm':'EMDForm','mobilisationAdvance':'YesNo','priceVariation':'YesNo','jvAllowed':'YesNo','subcontracting':'YesNo','localPreference':'YesNo','eligibility':'Eligibility','goDecision':'GoDecision','priority':'Priority','pipelineStatus':'PipelineStatus'}
fields=[]; docs=[]
for r in range(19,95):
    row=rows[r]; label=row['G']; col=row['F']
    if '(File Path)' in label or 'File Path)' in label:
        docs.append({'key':col,'label':label.split(' (')[0],'required':'Mandatory' in row['H']}); continue
    key=keys[col]; fmt=row['I']; typ='text'
    if fmt=='Date': typ='date'
    if fmt=='Time': typ='time'
    if fmt in ['Currency','Number','Percent']: typ='number'
    if fmt=='Long text': typ='textarea'
    if key in lookup: typ='select'
    if key=='owner': typ='user'
    fields.append({'key':key,'label':label,'type':typ,'required':'Mandatory' in row['H'],'section':row['B'],'list':lookup.get(key),'computed':any(x in row['H'] for x in ['Formula','Lookup']),'sourceColumn':col})
Path('src').mkdir(exist_ok=True)
Path('src/workbook.json').write_text(json.dumps({'masters':lists,'fields':fields,'documents':docs},indent=2),encoding='utf-8')
print(len(fields),'fields',len(docs),'document types',len(lists),'master lists')
