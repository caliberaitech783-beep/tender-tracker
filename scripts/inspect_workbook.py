import zipfile, xml.etree.ElementTree as E, posixpath, json
from pathlib import Path
z = zipfile.ZipFile(r'C:\Users\anoop\OneDrive\Documents\tendor format.xlsx')
n = {'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
ss = [''.join(t.itertext()) for t in E.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',n)]
rel = {r.attrib['Id']:r.attrib['Target'] for r in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
wb = E.fromstring(z.read('xl/workbook.xml'))
out = []
for s in wb.findall('m:sheets/m:sheet',n):
    t = rel[s.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
    p = t.lstrip('/') if t.startswith('/') else posixpath.normpath('xl/'+t)
    root = E.fromstring(z.read(p))
    cells=[]
    for c in root.findall('m:sheetData/m:row/m:c',n):
        v=c.find('m:v',n); f=c.find('m:f',n)
        val=v.text if v is not None else ''
        if c.attrib.get('t')=='s' and val: val=ss[int(val)]
        if c.find('m:is',n) is not None: val=''.join(c.find('m:is',n).itertext())
        if val or f is not None: cells.append({'cell':c.attrib['r'],'value':val,**({'formula':f.text} if f is not None else {})})
    extra={tag:E.tostring(root.find('m:'+tag,n),encoding='unicode') for tag in ['dataValidations','hyperlinks','mergeCells'] if root.find('m:'+tag,n) is not None}
    out.append({'sheet':s.attrib['name'],'dimension':root.find('m:dimension',n).attrib,'cells':cells,**extra})
Path('docs').mkdir(exist_ok=True)
Path('docs/workbook-inspection.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
for s in out:
    print('\nSHEET',s['sheet'],s['dimension'],'POPULATED',len(s['cells']))
    for c in s['cells']:
        print(c['cell'],str(c['value']).replace('\n',' / '),('FORMULA '+str(c['formula'])) if 'formula' in c else '')
print('EXTRA PARTS',[p for p in z.namelist() if any(k in p for k in ['comments','connections','externalLink','vba'])])
