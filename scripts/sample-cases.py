import json,random,re,hashlib,sys
from pathlib import Path
source=Path(sys.argv[1])
all_cases=json.loads(source.read_text(encoding='utf-8'))
selected=random.Random(20261117).sample(all_cases,100)
assert len({c['case_id'] for c in selected})==100
out=[]
for i,c in enumerate(selected,1):
 d=json.loads(c['differentiation_input'])
 text=c['present_illness']
 # Only a lead age statement is used; duration/history numbers stay out of age classification.
 age=re.search(r'^\s*(?:一位|患者為|患者是|患者|病人為|病人|個案為)?\s*(\d{1,3})\s*歲',text)
 n=int(age[1]) if age else None
 group='未記載' if n is None else '0–17' if n<18 else '18–29' if n<30 else '30–39' if n<40 else '40–49' if n<50 else '50–59' if n<60 else '60+'
 symptoms=list(dict.fromkeys(d.get('symptoms',[])))
 observations=[{'name':s,'status':'present'} for s in symptoms if s and not re.match(r'^(舌|苔|脈)',s)]
 for name in ['咳嗽','頭痛','失眠','口乾','口苦','胸悶','心悸','耳鳴','腹痛','腹脹','便秘']:
  if name in symptoms:continue
  if re.search(r'(?:無|否認)'+name+r'|'+name+r'\s*[（(]\s*[-－]\s*[）)]',text):observations.append({'name':name,'status':'absent'})
 if not any(x['name']=='失眠' for x in observations) and not any(x in symptoms for x in ['淺眠','易醒','入睡困難','眠差']):
  if re.search(r'睡眠正常|睡眠可|眠可',text):observations.append({'name':'失眠','status':'absent'})
 observations=list({x['name']:x for x in observations}.values())
 # Publish a concise record assembled from structured observations, rather than unrelated source history.
 positive=[x['name'] for x in observations if x['status']=='present']
 negative=[x['name'] for x in observations if x['status']=='absent']
 out.append({'case_id':f'CASE-{i:03d}','age_group':group,'diagnosis':'、'.join(c['wm_diseases']) or '診斷未記載','chief_complaint':re.sub(r'\([^)]*\)|（[^）]*）','',c['chief_complaint']).strip(),
 'present_illness':'問診記錄：'+('、'.join(positive) or '症狀待補')+'。'+('明確否認'+ '、'.join(negative)+'。' if negative else ''),
 'tongue':'、'.join(d.get('tongue',[])) or '未記載','pulse':'、'.join(d.get('pulse',[])) or '未記載',
 'patterns':list(dict.fromkeys(c['patterns'])),'formulas':list(dict.fromkeys(c['formulas'])),'observations':observations})
target=Path('src/sampled-cases.json')
target.write_text(json.dumps({'sampling':{'method':'simple random sample without replacement','seed':20261117,'population':len(all_cases),'count':100,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'primary_rule':'來源證型清單第一項作為查詢主證，其餘作為次證','age_rule':'僅取病程開頭的明確年齡，其餘標示未記載'},'cases':out},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Sampled',len(out),'unique cases;',len({s for c in out for s in c['patterns']}),'syndromes;',len({f for c in out for f in c['formulas']}),'source formula names.')

