import sampled from './sampled-cases.json' with {type:'json'};
const book = '衛福部《中藥常用方劑效能、適應症語意解析及英譯彙編》';
const pharmacopeia = '衛福部《臺灣中藥典第四版》基準方';

export const sources = [
  { title: '中國醫門診教學病例', detail: '以固定種子 20261117，從 819 筆病例不重複隨機抽取 100 筆，保留證型、症狀與來源處方。來源證型清單第一項作為查詢主證，其餘為次證。' },
  { title: '中藥常用方劑語意解析及英譯彙編', detail: '方劑分類、出處與藥材組成。逍遙散參照 PDF 第 68–69 頁；歸脾湯第 96 頁。', url: 'https://www.mohw.gov.tw/dl-69997-92bcd2d5-5987-48d1-a15e-ffb2185fb1e7.html' },
  { title: '臺灣中藥典第四版', detail: '八珍湯、二陳湯參照 PDF 第 136、149 頁（基準方項次 017、187）。保留炙甘草與甘草的名稱差異。', url: 'https://www.mohw.gov.tw/dl-71936-0a89f40d-7558-4ab2-8f4b-55e58de6552b.html' },
  { title: '八珍湯 · 衛福部基準方', detail: '十個組成名稱，包含煎服用的生薑、大棗。可透過 SQL 查詢方劑與藥材的組成關係。', url: 'https://dep.mohw.gov.tw/DOcMAP/fp-866-5540-108.html' },
  { title: '一貫煎 · 衛福部臺北醫院', detail: '北沙參、麥門冬、生地黃、當歸、枸杞子、川楝子六個組成名稱。', url: 'https://www.tph.mohw.gov.tw/?aid=86&iid=446&page_name=detail&pid=44' },
  { title: 'sql.js · SQLite in the browser', detail: '透過 WebAssembly 在瀏覽器內執行真正的 SQLite。', url: 'https://sql.js.org/documentation/' },
];

export const formulaSeeds = [
  ['逍遙散', '和解之劑', '太平惠民和劑局方', '炙甘草 白芍 當歸 茯苓 白朮 柴胡 煨薑 薄荷', book],
  ['八珍湯', '補養之劑', '證治準繩', '當歸 川芎 白芍 熟地黃 人參 白朮 茯苓 炙甘草 生薑 大棗', pharmacopeia],
  ['甘露消毒丹', '清熱瀉火之劑', '醫效秘傳', '滑石 黃芩 茵陳蒿 藿香 連翹 石菖蒲 白豆蔻 薄荷 木通 射干 川貝母', book],
  ['小柴胡湯', '和解之劑', '傷寒論', '柴胡 黃芩 人參 炙甘草 半夏 生薑 大棗', book],
  ['歸脾湯', '補養之劑', '校註婦人良方', '人參 龍眼肉 黃耆 炙甘草 白朮 茯苓 木香 當歸 酸棗仁 遠志 生薑 大棗', book],
  ['二陳湯', '祛痰之劑', '太平惠民和劑局方', '半夏 陳皮 茯苓 炙甘草 生薑', pharmacopeia],
  ['知柏地黃丸', '補養之劑', '醫方集解', '熟地黃 山茱萸 茯苓 山藥 牡丹皮 澤瀉 知母 黃柏', book],
  ['荊防敗毒散', '發表之劑', '奇效良方', '荊芥 防風 羌活 獨活 柴胡 前胡 川芎 枳殼 桔梗 茯苓 甘草 生薑 薄荷', book],
  ['六味地黃丸', '補養之劑', '小兒藥證直訣', '熟地黃 山茱萸 山藥 澤瀉 牡丹皮 茯苓', book],
  ['一貫煎', '補養之劑', '續名醫類案', '北沙參 麥門冬 當歸 生地黃 枸杞子 川楝子', book],
];

const id=(prefix,n,width=2)=>`${prefix}-${String(n).padStart(width,'0')}`;
export const sampling=sampled.sampling;
const data={clinical_case:[],syndrome:[],case_syndrome:[],symptom:[],case_symptom:[],formula:[],herb:[],formula_herb:[],case_formula:[]};
const syndromeNames=[...new Set(sampled.cases.flatMap(c=>c.patterns))];
data.syndrome=syndromeNames.map((name,i)=>({syndrome_id:id('SY',i+1),syndrome_name:name,description:'來源病例所載證型；主次角色依來源清單順序建立。'}));
const symptomNames=[...new Set(sampled.cases.flatMap(c=>c.observations.map(o=>o.name)))];
data.symptom=symptomNames.map((name,i)=>({symptom_id:id('SM',i+1),symptom_name:name,category:'問診觀察'}));
const herbNames=[...new Set(formulaSeeds.flatMap(f=>f[3].split(' ')))];
data.herb=herbNames.map((name,i)=>({herb_id:id('HB',i+1),herb_name:name,category:null,reference_source:'依十方來源組成名稱整理；炮製品分列'}));
data.formula=formulaSeeds.map((f,i)=>({formula_id:id('FM',i+1),formula_name:f[0],category:f[1],reference_source:`《${f[2]}》；${f[4]}`}));
formulaSeeds.forEach((f,i)=>f[3].split(' ').forEach((h,j)=>data.formula_herb.push({formula_id:id('FM',i+1),herb_id:id('HB',herbNames.indexOf(h)+1),ingredient_order:j+1})));
for(const name of new Set(sampled.cases.flatMap(c=>c.formulas)))if(!data.formula.some(f=>f.formula_name===name))data.formula.push({formula_id:id('FM',data.formula.length+1),formula_name:name,category:'來源處方',reference_source:'中國醫門診教學病例 · 處方名稱'});
for(const c of sampled.cases){
 const {patterns,formulas,observations,...record}=c;data.clinical_case.push(record);
 patterns.forEach((name,i)=>data.case_syndrome.push({case_id:c.case_id,syndrome_id:data.syndrome.find(s=>s.syndrome_name===name).syndrome_id,syndrome_role:i===0?'primary':'secondary'}));
 observations.forEach(o=>data.case_symptom.push({case_id:c.case_id,symptom_id:data.symptom.find(s=>s.symptom_name===o.name).symptom_id,status:o.status}));
 formulas.forEach(name=>data.case_formula.push({case_id:c.case_id,formula_id:data.formula.find(f=>f.formula_name===name).formula_id,formula_role:'來源處方'}));
}
export const featuredCases=(()=>{const seen=new Set(),ids=[];for(const c of sampled.cases){if(!seen.has(c.patterns[0])){seen.add(c.patterns[0]);ids.push(c.case_id);}if(ids.length===4)break;}return ids;})();
export const dataset=data;
export const totals=Object.fromEntries(Object.entries(data).map(([name,rows])=>[name,rows.length]));

export const schema = [
 {name:'clinical_case',label:'病例',kind:'實體',description:'一列代表一筆教學門診病例，以 CASE 編號連接證型、症狀與方劑。',fields:[['case_id','TEXT','PK','教學編號 CASE-001…CASE-100'],['age_group','TEXT','NOT NULL · CHECK','0–17、18–29、30–39、40–49、50–59、60+、未記載'],['diagnosis','TEXT','NOT NULL','來源病例診斷名稱'],['chief_complaint','TEXT','NOT NULL','來源主訴摘要'],['present_illness','TEXT','NOT NULL','改寫病程，含明確否認及未記載狀態'],['tongue','TEXT','NOT NULL','舌象摘要'],['pulse','TEXT','NOT NULL','脈象摘要']]},
 {name:'syndrome',label:'證型',kind:'字典',description:'證型名稱集中維護；主證或次證是病例關聯的屬性。',fields:[['syndrome_id','TEXT','PK','證型編號'],['syndrome_name','TEXT','UNIQUE · NOT NULL','正規化證型名稱'],['description','TEXT','NOT NULL','教學說明']]},
 {name:'case_syndrome',label:'病例 × 證型',kind:'關聯',description:'複合主鍵避免重複；部分唯一索引限制每筆病例至多一個主證。來源清單第一項設為查詢主證，其餘設為次證；每例恰有一個主證。',fields:[['case_id','TEXT','PK · FK','→ clinical_case.case_id'],['syndrome_id','TEXT','PK · FK','→ syndrome.syndrome_id'],['syndrome_role','TEXT','NOT NULL · CHECK','primary 主證／secondary 次證']]},
 {name:'symptom',label:'症狀',kind:'字典',description:'同一個症狀名稱只存一次，有無症狀記錄在關聯表。',fields:[['symptom_id','TEXT','PK','症狀編號'],['symptom_name','TEXT','UNIQUE · NOT NULL','症狀名稱'],['category','TEXT','NOT NULL','來源結構化問診觀察']]},
 {name:'case_symptom',label:'病例 × 症狀',kind:'關聯',description:'present 表示有症狀，absent 表示明確否認；沒有關聯列代表未記載。',fields:[['case_id','TEXT','PK · FK','→ clinical_case.case_id'],['symptom_id','TEXT','PK · FK','→ symptom.symptom_id'],['status','TEXT','NOT NULL · CHECK','present 為陽性、absent 為明確陰性']]},
 {name:'formula',label:'方劑',kind:'字典',description:'收錄抽樣病例的所有處方名稱，另附十方組成字典。十方的藥材組成可透過 formula_herb 查詢，其餘方劑保留來源名稱。',fields:[['formula_id','TEXT','PK','方劑編號'],['formula_name','TEXT','UNIQUE · NOT NULL','正規化方名'],['category','TEXT','NOT NULL','來源所載方劑分類'],['reference_source','TEXT','NOT NULL','古籍出處與查核文件']]},
 {name:'herb',label:'藥材',kind:'字典',description:'藥材與炮製品名稱分列，如甘草與炙甘草。未查核的分類為 NULL。',fields:[['herb_id','TEXT','PK','藥材編號'],['herb_name','TEXT','UNIQUE · NOT NULL','保留來源組成名稱'],['category','TEXT','NULL','沒有分類佐證，保留空值'],['reference_source','TEXT','NOT NULL','組成字典來源']]},
 {name:'formula_herb',label:'方劑 × 藥材',kind:'關聯',description:'拆解方劑的多對多組成；ingredient_order 保留來源呈現順序。',fields:[['formula_id','TEXT','PK · FK','→ formula.formula_id'],['herb_id','TEXT','PK · FK','→ herb.herb_id'],['ingredient_order','INTEGER','NOT NULL · CHECK > 0','組成顯示順序；同方順序唯一']]},
 {name:'case_formula',label:'病例 × 方劑',kind:'關聯',description:'每例可關聯零到多個來源方劑，複合主鍵保留每組病例與方劑的配對。',fields:[['case_id','TEXT','PK · FK','→ clinical_case.case_id'],['formula_id','TEXT','PK · FK','→ formula.formula_id'],['formula_role','TEXT','NOT NULL','來源病例的方劑紀錄']]},
];

export const createSQL = `PRAGMA foreign_keys = ON;
CREATE TABLE clinical_case (
 case_id TEXT PRIMARY KEY NOT NULL,
 age_group TEXT NOT NULL CHECK(age_group IN ('0–17','18–29','30–39','40–49','50–59','60+','未記載')),
 diagnosis TEXT NOT NULL, chief_complaint TEXT NOT NULL,
 present_illness TEXT NOT NULL, tongue TEXT NOT NULL, pulse TEXT NOT NULL
);
CREATE TABLE syndrome (syndrome_id TEXT PRIMARY KEY NOT NULL, syndrome_name TEXT NOT NULL UNIQUE, description TEXT NOT NULL);
CREATE TABLE symptom (symptom_id TEXT PRIMARY KEY NOT NULL, symptom_name TEXT NOT NULL UNIQUE, category TEXT NOT NULL);
CREATE TABLE formula (formula_id TEXT PRIMARY KEY NOT NULL, formula_name TEXT NOT NULL UNIQUE, category TEXT NOT NULL, reference_source TEXT NOT NULL);
CREATE TABLE herb (herb_id TEXT PRIMARY KEY NOT NULL, herb_name TEXT NOT NULL UNIQUE, category TEXT, reference_source TEXT NOT NULL);
CREATE TABLE case_syndrome (
 case_id TEXT NOT NULL REFERENCES clinical_case(case_id), syndrome_id TEXT NOT NULL REFERENCES syndrome(syndrome_id),
 syndrome_role TEXT NOT NULL CHECK(syndrome_role IN ('primary','secondary')), PRIMARY KEY(case_id,syndrome_id)
);
CREATE UNIQUE INDEX one_primary_syndrome ON case_syndrome(case_id) WHERE syndrome_role='primary';
CREATE TABLE case_symptom (
 case_id TEXT NOT NULL REFERENCES clinical_case(case_id), symptom_id TEXT NOT NULL REFERENCES symptom(symptom_id),
 status TEXT NOT NULL CHECK(status IN ('present','absent')), PRIMARY KEY(case_id,symptom_id)
);
CREATE TABLE formula_herb (
 formula_id TEXT NOT NULL REFERENCES formula(formula_id), herb_id TEXT NOT NULL REFERENCES herb(herb_id),
 ingredient_order INTEGER NOT NULL CHECK(ingredient_order>0), PRIMARY KEY(formula_id,herb_id), UNIQUE(formula_id,ingredient_order)
);
CREATE TABLE case_formula (
 case_id TEXT NOT NULL REFERENCES clinical_case(case_id), formula_id TEXT NOT NULL REFERENCES formula(formula_id),
 formula_role TEXT NOT NULL, PRIMARY KEY(case_id,formula_id)
);`;

const loadOrder=['clinical_case','syndrome','symptom','formula','herb','case_syndrome','case_symptom','formula_herb','case_formula'];
export function createDatabase(SQL) {
  const db=new SQL.Database();
  db.run(createSQL);
  db.run('BEGIN');
  for(const table of loadOrder) {
    const rows=data[table], columns=Object.keys(rows[0]);
    const stmt=db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`);
    try { for(const row of rows) stmt.run(columns.map(c=>row[c])); } finally { stmt.free(); }
  }
  db.run('COMMIT');
  return db;
}

export const seedSQL = createSQL+'\n\n'+loadOrder.map(t=>data[t].map(row=>`INSERT INTO ${t} (${Object.keys(row).join(', ')}) VALUES (${Object.values(row).map(v=>v===null?'NULL':typeof v==='number'?v:`'${v.replaceAll("'","''")}'`).join(', ')});`).join('\n')).join('\n\n');
