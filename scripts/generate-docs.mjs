import {writeFileSync} from 'node:fs';
import initSqlJs from 'sql.js';
import {dataset,totals,schema,sources,createDatabase,featuredCases} from '../src/data.js';
import {questions} from '../src/queries.js';

const SQL=await initSqlJs(),db=createDatabase(SQL);
const mdCell=v=>String(v??'NULL').replaceAll('|','\\|').replaceAll('\n',' ');
const mdTable=(headers,rows)=>[headers,headers.map(()=>'---'),...rows].map(row=>`| ${row.map(mdCell).join(' | ')} |`).join('\n');
const run=sql=>{const stmt=db.prepare(sql);try{const result={columns:stmt.getColumnNames(),values:[]};while(stmt.step())result.values.push(stmt.get());return result;}finally{stmt.free();}};
const example=(sql,expected)=>{const r=run(sql);if(r.values.length!==expected)throw new Error('Document query count mismatch');return `\`\`\`sql\n${sql}\n\`\`\`\n\n結果：**${r.values.length} 列**。${r.values.length>5?'以下列出前 5 列；完整結果可在網站執行查看。':''}\n\n${mdTable(r.columns,r.values.slice(0,5))}${r.values.length?'':'\n\n此查詢得到 0 列。'}`;};
const cases=featuredCases.map(id=>{
 const c=dataset.clinical_case.find(x=>x.case_id===id);
 const syndromes=dataset.case_syndrome.filter(x=>x.case_id===id).map(x=>`${dataset.syndrome.find(s=>s.syndrome_id===x.syndrome_id).syndrome_name}（${x.syndrome_role==='primary'?'主':'次'}證）`).join('、');
 const prescriptions=dataset.case_formula.filter(x=>x.case_id===id).map(rx=>dataset.formula.find(f=>f.formula_id===rx.formula_id).formula_name);
 return [id,c.age_group,c.chief_complaint,syndromes,prescriptions.length?prescriptions.join('、'):'尚無處方'];
});
const doc=`# 中醫處方實驗室 — 資料庫設計與查詢說明

[開啟網站](https://tab-etuc.github.io/tcm-sql-lab/) · [完整 ERD](./tcm_sql_erd.svg)

本文件由網站使用的欄位字典、固定資料與 SQL 題庫產生，樣本內容和查詢結果與網站共用同一份資料。

## 案例背景

中醫教學診所需要跨病例整理主訴、舌脈、症狀、證型與用方。醫師查找相同證型的病例，研究助理統計各證型與方劑的使用情形，學生透過修改 SQL 理解關聯查詢與結果差異。

病例資料從中國醫門診教學病例 819 筆中，以固定種子 20261117 不重複隨機抽取 100 筆。保留全部來源處方名稱，共 110 種方劑；其中十方的藥材組成依衛福部文件整理。來源證型清單第一項為查詢主證，其餘為次證。

## 資料庫設計

${mdTable(['資料表','中文名稱','筆數'],schema.map(t=>[t.name,t.label,totals[t.name]]))}

五張實體／字典表保存病例、證型、症狀、方劑與藥材；四張中介表保存多對多關聯。

\`\`\`text
clinical_case 1 —— N case_syndrome N —— 1 syndrome
clinical_case 1 —— N case_symptom  N —— 1 symptom
clinical_case 1 —— N case_formula  N —— 1 formula
formula       1 —— N formula_herb N —— 1 herb
\`\`\`

每筆中介表紀錄的兩個外來鍵都對應一筆主表紀錄，主表可對應 0 到多筆中介表紀錄。複合主鍵使每組配對唯一。主證部分唯一索引限制每例至多一筆主證，種子檢查確認每例恰有一筆。

症狀分成三種紀錄狀態：present 表示陽性、absent 表示明確陰性、缺少關聯列表示未記載。狀態屬於病例與症狀的關聯。

### 抽樣病例示例

${mdTable(['病例','年齡區間','主訴','證型','全部來源處方'],cases)}

${schema.map(t=>`### ${t.label} · ${t.name}\n\n${t.description}\n\n${mdTable(['欄位','型別','限制','說明'],t.fields)}\n\n樣本資料（前 ${Math.min(3,totals[t.name])} 筆）：\n\n${mdTable(Object.keys(dataset[t.name][0]),dataset[t.name].slice(0,3).map(Object.values))}`).join('\n\n')}

## 查詢操作與結果比較

選擇題目後可編輯 SQL、執行查詢、切換預期與實際結果。每題提供修改範例；比較頁同時呈現兩段 SQL、兩側結果、資料列增減及原因。「我的 SQL」使用目前編輯器草稿。「只看差異資料」篩選變更列，完整結果可隨時切回。

${mdTable(['題目','SQL 重點','原版列數','修改列數'],questions.map(q=>[`${q.id} ${q.title}`,q.tags.join('、'),q.expected,q.modified]))}

${questions.map(q=>`### ${q.id} · ${q.title}\n\n${q.prompt}\n\n#### 原版：${q.before}\n\n${example(q.sql,q.expected)}\n\n#### 修改版：${q.after}\n\n${example(q.variant,q.modified)}\n\n**結果解釋**：${q.why}\n\n**讀懂 SQL**：\n\n${q.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\n**學習重點**：${q.takeaway}`).join('\n\n')}

## 執行方式

GitHub Pages 提供靜態網站。sql.js 將 SQLite 編譯成 WebAssembly，在瀏覽器 Web Worker 執行查詢。每次查詢重新載入固定種子；基準答案亦由 SQLite 實際執行取得。

實驗室接受唯讀查詢，每次最多 2,000 列與八組結果，畫面顯示最後一組。查詢可手動停止，超過八秒會自動停止。語法、欄位或資料表錯誤會顯示原生 SQLite 訊息及中文提示。CSV 下載對應目前選取的預期／實際結果分頁；SQLite 與建表 SQL 可從網站下載。

結果比較保留重複列次數；欄位結構不同時先提示對齊欄位。資料相同而排序不同時會標示排序差異。每題草稿與完成進度保存在目前瀏覽器。

## 資料來源

${sources.map(s=>`- ${s.url?`[${s.title}](${s.url})`:s.title}：${s.detail}`).join('\n')}

## 課堂說明要點

1. 說明五張主表與四張中介表，以及複合主鍵、外來鍵的用途。
2. 用 Q03 解釋 present、absent、未記載，對照 18 與 30 筆結果。
3. 用 Q04 解釋 100 份病例為何形成 123 列證型關聯。
4. 用 Q06 說明 WHERE 篩選資料列、HAVING 篩選群組。
5. 用 Q10 的三個 0 → 1 儲存格，解釋 COUNT(欄位) 與 COUNT(*)。
`;
writeFileSync('public/tcm_sql_design_spec.md',doc);
writeFileSync('docs/EXPLAIN.md',`# 中醫處方實驗室 · 100 筆抽樣版口頭說明

## 資料怎麼來？

從 819 筆中國醫門診教學病例，以固定種子 20261117 不重複隨機抽取 100 筆。網站每次載入相同樣本，SQL 結果可重現。證型字典有 ${totals.syndrome} 種，Q05 列出 ${run(questions[4].sql).values.length} 個查詢主證組別；主次角色依來源清單順序建立。年齡由病程開頭的明確記錄整理，未記載者另列一組。

## 九張表如何連接？

病例、證型、症狀、方劑、藥材是五張主表；四張中介表記錄多對多配對。一份病例可有多證型、多方劑。方劑共 ${totals.formula} 種，十方已有完整藥材組成，其餘保留來源方名。

## 逐題結果與原因

${questions.map(q=>`### ${q.id} ${q.title}\n\n${q.expected} → ${q.modified} 列。${q.why}`).join('\n\n')}

## 三分鐘操作

先切換 CASE-001 與 CASE-002，展示不同診斷和證型，以及零到多個處方。打開病例症狀表，說明 present／absent／缺少紀錄。執行 Q03，再展示 Q04 的 ${questions[3].expected}／${questions[3].modified} 列，最後用 Q10 解釋 COUNT(欄位) 與 COUNT(*)。
`);

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const layout={clinical_case:[40,290],case_syndrome:[390,50],syndrome:[740,50],case_symptom:[390,320],symptom:[740,320],case_formula:[390,590],formula:[740,590],formula_herb:[1090,590],herb:[1090,240]};
const height=t=>68+t.fields.length*28;
const links=[
 ['clinical_case','case_syndrome','M320 390 H350 V130 H390',335,378,375,118],
 ['clinical_case','case_symptom','M320 430 H365 V400 H390',335,418,375,388],
 ['clinical_case','case_formula','M320 470 H350 V670 H390',335,458,375,658],
 ['syndrome','case_syndrome','M740 130 H670',725,118,685,118],
 ['symptom','case_symptom','M740 400 H670',725,388,685,388],
 ['formula','case_formula','M740 670 H670',725,658,685,658],
 ['formula','formula_herb','M1020 670 H1090',1035,658,1075,658],
 ['herb','formula_herb',`M1230 ${240+height(schema.find(t=>t.name==='herb'))} V590`,1244,438,1244,578],
];
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1430 880" role="img" aria-labelledby="title desc">
<title id="title">中醫處方實驗室：九表關聯模型</title><desc id="desc">五張主表與四張中介表。線段的 1 與 N 表示一對多，每張中介表的兩端為外來鍵和複合主鍵。</desc>
<style>text{font-family:'Microsoft JhengHei',sans-serif;fill:#24352e}.name{font-size:18px;font-weight:600}.label{font-size:14px;fill:#52665d}.field{font-family:monospace;font-size:15px}.cardinality{font-family:monospace;font-size:17px;font-weight:700;fill:#246956}</style>
<rect width="1430" height="880" fill="#f4f8f5"/>
${links.map(([a,b,path,x1,y1,xn,yn])=>`<g><title>${a} 1 對多 ${b}</title><path d="${path}" fill="none" stroke="#7a9e8e" stroke-width="2"/><text class="cardinality" x="${x1}" y="${y1}" text-anchor="middle">1</text><text class="cardinality" x="${xn}" y="${yn}" text-anchor="middle">N</text></g>`).join('')}
${schema.map(t=>{const[x,y]=layout[t.name];return `<g transform="translate(${x} ${y})"><rect width="280" height="${height(t)}" rx="8" fill="white" stroke="#8eac9e"/><path d="M0 52 H280" stroke="#ccdcd3"/><text class="name" x="14" y="25">${esc(t.name)}</text><text class="label" x="14" y="44">${esc(t.label)} · ${totals[t.name]} 筆</text>${t.fields.map((f,i)=>`<text class="field" x="14" y="${76+i*28}">${esc(`${f[2].includes('PK')?'PK ':''}${f[2].includes('FK')?'FK ':''}${f[0]}`)}</text>`).join('')}</g>`;}).join('')}
<text x="40" y="816" class="name">中醫處方實驗室 · 九表關聯模型</text>
<text x="40" y="844" class="label">1 → N：主表一筆可對應 0 到多筆中介表紀錄。PK：主鍵；FK：外來鍵。中介表的兩個 PK 欄位共同組成複合主鍵。</text>
<text x="40" y="866" class="label">主證：每例至多一筆由部分唯一索引限制；每例恰有一筆由固定資料驗證。完整型別與限制請見網站欄位說明。</text></svg>`;
writeFileSync('public/tcm_sql_erd.svg',svg);
db.close();
console.log('Generated current design document, verified 24 query counts, and generated nine-table ERD.');
