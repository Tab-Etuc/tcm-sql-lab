import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import initSqlJs from 'sql.js';
import {createDatabase,dataset,totals,seedSQL,schema,featuredCases} from '../src/data.js';
import {questions} from '../src/queries.js';

const SQL=await initSqlJs(),db=createDatabase(SQL);
const run=sql=>{const stmt=db.prepare(sql);try{const result={columns:stmt.getColumnNames(),values:[]};while(stmt.step())result.values.push(stmt.get());return result;}finally{stmt.free();}};
const doc=readFileSync('public/tcm_sql_design_spec.md','utf8');
const oral=readFileSync('docs/EXPLAIN.md','utf8');
test('downloadable seed SQL reproduces every column and row of all nine tables',()=>{
 const restored=new SQL.Database();restored.run(seedSQL);
 for(const t of schema){const order=t.fields.filter(f=>f[2].includes('PK')).map(f=>f[0]).join(', ');const sql=`SELECT * FROM ${t.name} ORDER BY ${order}`;assert.deepEqual(restored.exec(sql),db.exec(sql),t.name);}
 assert.deepEqual(restored.exec('PRAGMA foreign_key_check'),[]);restored.close();
});
test('all 24 documented SQL blocks, counts, sample rows and explanations match live query definitions',()=>{
 const blocks=[...doc.matchAll(/```sql\n([\s\S]*?)\n```/g)];assert.equal(blocks.length,24);
 let n=0;
 const cell=v=>String(v??'NULL').replaceAll('|','\\|').replaceAll('\n',' ');
 for(const q of questions){
  const section=doc.split(`### ${q.id} · `)[1].split(/\n### Q\d+/)[0];
  assert.ok(section.includes(q.why),q.id+' document explanation');
  assert.ok(oral.includes(`${q.expected} → ${q.modified} 列。${q.why}`),q.id+' oral explanation');
  for(const [sql,count] of [[q.sql,q.expected],[q.variant,q.modified]]){
   assert.equal(blocks[n++][1],sql,q.id+' SQL');const result=run(sql);assert.equal(result.values.length,count);
   assert.ok(section.includes(`結果：**${count} 列**`));
   for(const row of result.values.slice(0,5))assert.ok(section.includes(`| ${row.map(cell).join(' | ')} |`),q.id+' sample row');
  }
 }
});
test('downloadable ERD and documents show all current counts, fields and source prescriptions',()=>{
 const svg=readFileSync('public/tcm_sql_erd.svg','utf8');
 for(const t of schema){
  assert.ok(doc.includes(`| ${t.name} | ${t.label} | ${totals[t.name]} |`));
  assert.ok(svg.includes(`${t.label} · ${totals[t.name]} 筆`));
  for(const f of t.fields){assert.ok(doc.includes(`| ${f[0]} | ${f[1]} | ${f[2]} |`));assert.ok(svg.includes(f[0]));}
 }
 for(const id of featuredCases){
  const row=doc.split('\n').find(s=>s.startsWith(`| ${id} |`));assert.ok(row);
  for(const rx of dataset.case_formula.filter(r=>r.case_id===id))assert.ok(row.includes(dataset.formula.find(f=>f.formula_id===rx.formula_id).formula_name));
 }
});
test('twelve explanations agree with the independently executed 100-case results',()=>{
 const counts=questions.map(q=>[run(q.sql).values.length,run(q.variant).values.length]);
 assert.deepEqual(counts,[[9,15],[37,39],[18,30],[123,100],[29,1],[3,5],[8,12],[3,0],[3,6],[110,110],[4,8],[17,0]]);
 assert.deepEqual(run(questions[5].variant).values,[['氣滯血瘀',37],['肝腎陰虛',16],['脾胃氣虛',10],['脾腎陽虛',4],['肝陽上亢',3]]);
 assert.deepEqual(run(questions[8].variant).values.map(r=>r[0]),['逍遙散','八珍湯','小柴胡湯','歸脾湯','二陳湯','一貫煎']);
 assert.equal(run(questions[9].sql).values.reduce((sum,row)=>sum+row[1],0),208);
 assert.equal(run(questions[9].variant).values.reduce((sum,row)=>sum+row[1],0),211);
 assert.equal(run("SELECT COUNT(*) FROM case_symptom cs JOIN symptom s USING(symptom_id) WHERE s.symptom_name='失眠' AND status='absent'").values[0][0],12);
});
test('current pages and teaching documents contain no obsolete 48-case dataset descriptions',()=>{
 const files=['src/data.js','src/views.js','src/queries.js','src/main.js','index.html','README.md','docs/SOURCES.md','docs/EXPLAIN.md','docs/ACCEPTANCE.md','public/tcm_sql_design_spec.md'];
 const old=/(?:48|四十八)\s*(?:筆|份|例)\s*(?:病例|教學|固定|抽樣|資料)|(?:病例|資料集|總病例數)[^\n。]{0,8}(?:共|總計|合計|：|:)\s*48\b|CASE-001[….～~—–-]+CASE-048|54\s*列證型關聯|144\s*筆病例症狀關聯|46\s*筆病例方劑關聯/;
 for(const file of files)assert.doesNotMatch(readFileSync(file,'utf8'),old,file);
});
test.after(()=>db.close());
