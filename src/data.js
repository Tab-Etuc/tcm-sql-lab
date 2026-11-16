const book = '衛福部《中藥常用方劑效能、適應症語意解析及英譯彙編》';
const pharmacopeia = '衛福部《臺灣中藥典第四版》基準方';

export const sources = [
  { title: '中國醫門診教學病例', detail: '以症狀、證型、舌象與脈象欄位為參考，編成 48 筆教學病例，連結年齡區間、主次證與示例方劑。' },
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

const syndromeSeeds = [
  ['肝鬱脾虛', 12, '情志與脾胃表現相關的教學證型。', '舌淡紅、苔薄白', '脈弦細', '腹脹 食慾不振 易怒 脅痛 便溏', '脅痛'],
  ['氣血兩虛', 9, '以氣與血不足的描述建立教學分類。', '舌淡、苔薄白', '脈細弱', '倦怠 頭暈 氣短 心悸 食慾不振', '虛勞'],
  ['脾胃濕熱', 7, '以脾胃與濕熱表現建立教學分類。', '舌紅、苔黃膩', '脈滑數', '口苦 腹脹 噁心 胸悶 便秘', '胃脘痛'],
  ['肝胃不和', 6, '以情志與胃部表現建立教學分類。', '舌淡紅、苔薄白', '脈弦', '脅痛 噁心 腹脹 口苦 食慾不振', '胃脘痛'],
  ['心脾兩虛', 5, '以睡眠、心悸與脾氣不足建立教學分類。', '舌淡、苔薄白', '脈細弱', '心悸 倦怠 頭暈 食慾不振 氣短', '不寐'],
  ['痰濕內阻', 4, '以痰與濕相關描述建立教學分類。', '舌淡、苔白膩', '脈滑', '痰多 胸悶 噁心 頭暈 咳嗽', '痰飲'],
  ['陰虛火旺', 3, '以陰虛與虛熱相關描述建立教學分類。', '舌紅、苔少', '脈細數', '口乾 盜汗 耳鳴 腰痠 頭暈', '虛勞'],
  ['風寒束表', 2, '以風寒表證的描述建立教學分類。', '舌淡紅、苔薄白', '脈浮緊', '畏寒 頭痛 咳嗽 發熱 咽痛', '感冒'],
];
const symptomSeeds = [
  ['失眠','睡眠'], ['腹脹','飲食'], ['食慾不振','飲食'], ['倦怠','頭身'], ['頭暈','頭身'], ['心悸','胸脅'],
  ['口苦','口咽'], ['胸悶','胸脅'], ['噁心','飲食'], ['便溏','二便'], ['口乾','口咽'], ['盜汗','頭身'],
  ['咳嗽','呼吸'], ['痰多','呼吸'], ['頭痛','頭身'], ['畏寒','頭身'], ['發熱','頭身'], ['咽痛','口咽'],
  ['腰痠','頭身'], ['耳鳴','頭身'], ['易怒','情志'], ['脅痛','胸脅'], ['氣短','呼吸'], ['便秘','二便'],
];
const id = (prefix, n, width=2) => `${prefix}-${String(n).padStart(width, '0')}`;
const data = { clinical_case:[], syndrome:[], case_syndrome:[], symptom:[], case_symptom:[], formula:[], herb:[], formula_herb:[], case_formula:[] };
data.syndrome = syndromeSeeds.map((s,i)=>({syndrome_id:id('SY',i+1),syndrome_name:s[0],description:s[2]}));
data.symptom = symptomSeeds.map((s,i)=>({symptom_id:id('SM',i+1),symptom_name:s[0],category:s[1]}));
const herbNames = [...new Set(formulaSeeds.flatMap(f=>f[3].split(' ')))];
data.herb = herbNames.map((n,i)=>({herb_id:id('HB',i+1),herb_name:n,category:null,reference_source:'依十方來源組成名稱整理；炮製品分列'}));
data.formula = formulaSeeds.map((f,i)=>({formula_id:id('FM',i+1),formula_name:f[0],category:f[1],reference_source:`《${f[2]}》；${f[4]}`}));
formulaSeeds.forEach((f,i)=>f[3].split(' ').forEach((h,j)=>data.formula_herb.push({formula_id:id('FM',i+1),herb_id:id('HB',herbNames.indexOf(h)+1),ingredient_order:j+1})));

let caseNumber=0;
const insomniaPresent = [3,7,16,20,35,36,37,38,39];
const insomniaAbsent = [10,18,22,28];
syndromeSeeds.forEach((s,si)=>{
  for(let j=0;j<s[1];j++) {
    const n=++caseNumber, case_id=id('CASE',n,3), ageIndex=((n-1)*17)%48;
    const age_group = ageIndex<10?'18–29':ageIndex<22?'30–39':ageIndex<34?'40–49':ageIndex<43?'50–59':'60+';
    const observations=[];
    if(insomniaPresent.includes(n)) observations.push(['失眠','present']);
    if(insomniaAbsent.includes(n)) observations.push(['失眠','absent']);
    const pool=s[5].split(' '), hasNegative=n%2===0;
    while(observations.length<(hasNegative && !insomniaAbsent.includes(n)?2:3)) {
      const next=pool[(j+observations.length)%pool.length];
      observations.push([next,'present']);
    }
    if(hasNegative && !insomniaAbsent.includes(n)) {
      const absent=['頭痛','咳嗽','口乾','便秘','畏寒'].find(x=>!observations.some(y=>y[0]===x));
      observations.push([absent,'absent']);
    }
    const positives=observations.filter(x=>x[1]==='present').map(x=>x[0]);
    const negatives=observations.filter(x=>x[1]==='absent').map(x=>x[0]);
    data.clinical_case.push({case_id,age_group,tcm_disease:insomniaPresent.includes(n)?'不寐':s[6],chief_complaint:`${positives.join('、')}。${negatives.length?`否認${negatives.join('、')}。`:''}`,present_illness:`教學情境：記錄${positives.join('、')}，症狀反覆。${negatives.length?`問診明確否認${negatives.join('、')}。`:''}其餘症狀未記載。`,tongue:s[3],pulse:s[4]});
    data.case_syndrome.push({case_id,syndrome_id:id('SY',si+1),syndrome_role:'primary'});
    observations.forEach(([name,status])=>data.case_symptom.push({case_id,symptom_id:data.symptom.find(v=>v.symptom_name===name).symptom_id,status}));
    if(n!==11 && n!==12) data.case_formula.push({case_id,formula_id:id('FM',si+1),formula_role:'示例方'});
  }
});
[[3,2],[8,5],[16,1],[24,4],[34,5],[46,6]].forEach(([n,s])=>data.case_syndrome.push({case_id:id('CASE',n,3),syndrome_id:id('SY',s),syndrome_role:'secondary'}));
export const dataset=data;
export const totals=Object.fromEntries(Object.entries(data).map(([name,rows])=>[name,rows.length]));

export const schema = [
 {name:'clinical_case',label:'病例',kind:'實體',description:'一列代表一筆教學門診病例，以 CASE 編號連接證型、症狀與方劑。',fields:[['case_id','TEXT','PK','教學編號 CASE-001…CASE-048'],['age_group','TEXT','NOT NULL · CHECK','18–29、30–39、40–49、50–59、60+'],['tcm_disease','TEXT','NOT NULL','中醫病名／主訴分類'],['chief_complaint','TEXT','NOT NULL','主訴，與症狀觀察標籤一致'],['present_illness','TEXT','NOT NULL','改寫病程，含明確否認及未記載狀態'],['tongue','TEXT','NOT NULL','舌象摘要'],['pulse','TEXT','NOT NULL','脈象摘要']]},
 {name:'syndrome',label:'證型',kind:'字典',description:'證型名稱集中維護；主證或次證是病例關聯的屬性。',fields:[['syndrome_id','TEXT','PK','證型編號'],['syndrome_name','TEXT','UNIQUE · NOT NULL','正規化證型名稱'],['description','TEXT','NOT NULL','教學說明']]},
 {name:'case_syndrome',label:'病例 × 證型',kind:'關聯',description:'複合主鍵避免重複；部分唯一索引限制每筆病例至多一個主證。種子驗證每例恰有一個主證。',fields:[['case_id','TEXT','PK · FK','→ clinical_case.case_id'],['syndrome_id','TEXT','PK · FK','→ syndrome.syndrome_id'],['syndrome_role','TEXT','NOT NULL · CHECK','primary 主證／secondary 次證']]},
 {name:'symptom',label:'症狀',kind:'字典',description:'同一個症狀名稱只存一次，有無症狀記錄在關聯表。',fields:[['symptom_id','TEXT','PK','症狀編號'],['symptom_name','TEXT','UNIQUE · NOT NULL','症狀名稱'],['category','TEXT','NOT NULL','睡眠、情志、飲食、二便、頭身等']]},
 {name:'case_symptom',label:'病例 × 症狀',kind:'關聯',description:'present 表示有症狀，absent 表示明確否認；沒有關聯列代表未記載。',fields:[['case_id','TEXT','PK · FK','→ clinical_case.case_id'],['symptom_id','TEXT','PK · FK','→ symptom.symptom_id'],['status','TEXT','NOT NULL · CHECK','present 為陽性、absent 為明確陰性']]},
 {name:'formula',label:'方劑',kind:'字典',description:'未使用的方劑仍保留，才能藉 LEFT JOIN 看見零次使用。',fields:[['formula_id','TEXT','PK','方劑編號'],['formula_name','TEXT','UNIQUE · NOT NULL','正規化方名'],['category','TEXT','NOT NULL','來源所載方劑分類'],['reference_source','TEXT','NOT NULL','古籍出處與查核文件']]},
 {name:'herb',label:'藥材',kind:'字典',description:'藥材與炮製品名稱分列，如甘草與炙甘草。未查核的分類為 NULL。',fields:[['herb_id','TEXT','PK','藥材編號'],['herb_name','TEXT','UNIQUE · NOT NULL','保留來源組成名稱'],['category','TEXT','NULL','沒有分類佐證，保留空值'],['reference_source','TEXT','NOT NULL','組成字典來源']]},
 {name:'formula_herb',label:'方劑 × 藥材',kind:'關聯',description:'拆解方劑的多對多組成；ingredient_order 保留來源呈現順序。',fields:[['formula_id','TEXT','PK · FK','→ formula.formula_id'],['herb_id','TEXT','PK · FK','→ herb.herb_id'],['ingredient_order','INTEGER','NOT NULL · CHECK > 0','組成顯示順序；同方順序唯一']]},
 {name:'case_formula',label:'病例 × 方劑',kind:'關聯',description:'一例可關聯多方；本教學資料每例至多一方，兩例完全沒有用方記錄。',fields:[['case_id','TEXT','PK · FK','→ clinical_case.case_id'],['formula_id','TEXT','PK · FK','→ formula.formula_id'],['formula_role','TEXT','NOT NULL','教學病例所連結的示例方']]},
];

export const createSQL = `PRAGMA foreign_keys = ON;
CREATE TABLE clinical_case (
 case_id TEXT PRIMARY KEY NOT NULL,
 age_group TEXT NOT NULL CHECK(age_group IN ('18–29','30–39','40–49','50–59','60+')),
 tcm_disease TEXT NOT NULL, chief_complaint TEXT NOT NULL,
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
