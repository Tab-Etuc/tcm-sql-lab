import test from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';
import {createDatabase,dataset,totals} from '../src/data.js';
import {questions} from '../src/queries.js';
import {compareResults} from '../src/results.js';
import sampled from '../src/sampled-cases.json' with {type:'json'};

const SQL=await initSqlJs();
const run=(db,sql)=>db.exec(sql)[0]??{columns:[],values:[]};
test('the fixed sample retains 100 distinct cases with mixed first-page syndromes and original multi-formula links',()=>{
 assert.equal(sampled.sampling.seed,20261117);
 assert.equal(sampled.sampling.population,819);
 assert.equal(new Set(sampled.cases.map(c=>c.case_id)).size,100);
 assert.ok(new Set(sampled.cases.slice(0,10).map(c=>c.patterns[0])).size>=4);
 assert.ok(sampled.cases.some(c=>c.formulas.length>1));
 assert.equal(sampled.cases.reduce((n,c)=>n+c.formulas.length,0),208);
 for(const c of sampled.cases){
  assert.equal(dataset.case_syndrome.filter(r=>r.case_id===c.case_id).length,c.patterns.length);
  assert.equal(dataset.case_formula.filter(r=>r.case_id===c.case_id).length,c.formulas.length);
 }
});
test('the seed has the specified nine-table counts and valid relationships',()=>{
 const db=createDatabase(SQL);
 assert.deepEqual(totals,{"clinical_case":100,"syndrome":34,"case_syndrome":123,"symptom":908,"case_symptom":1459,"formula":110,"herb":49,"formula_herb":86,"case_formula":208});
 assert.deepEqual(db.exec('PRAGMA foreign_key_check'),[]);
 assert.deepEqual(run(db,'PRAGMA integrity_check').values,[['ok']]);
 assert.deepEqual(db.exec("SELECT case_id FROM case_syndrome GROUP BY case_id HAVING SUM(syndrome_role='primary') != 1"),[]);
 assert.deepEqual(run(db,'SELECT age_group,COUNT(*) FROM clinical_case GROUP BY age_group ORDER BY age_group').values,[['0–17',3],['18–29',3],['30–39',3],['40–49',6],['50–59',2],['60+',7],['未記載',76]]);
 assert.equal(run(db,"SELECT COUNT(*) FROM case_symptom WHERE status='absent'").values[0][0],29);
 assert.throws(()=>db.run("INSERT INTO case_syndrome VALUES ('CASE-001','SY-02','primary')"),/UNIQUE/);
 assert.throws(()=>db.run("INSERT INTO case_formula VALUES ('MISSING','FM-01','示例方')"),/FOREIGN KEY/);
 assert.throws(()=>db.run("UPDATE case_symptom SET status='unknown' WHERE case_id='CASE-001'"),/CHECK/);
 db.close();
});
for(const q of questions)test(`${q.id}: baseline ${q.expected} rows, variant ${q.modified} rows`,()=>{
 const db=createDatabase(SQL);
 assert.equal(run(db,q.sql).values.length,q.expected);
 assert.equal(run(db,q.variant).values.length,q.modified);
 db.close();
});
test('important values and identities, not just row counts, are correct',()=>{
 const db=createDatabase(SQL);
 assert.equal(run(db,questions[4].sql).values.reduce((n,r)=>n+r[1],0),100);
 assert.deepEqual(run(db,questions[4].variant).values,[[100]]);
 assert.deepEqual(run(db,questions[7].sql).values,[['FM-01','逍遙散'],['FM-02','八珍湯'],['FM-08','荊防敗毒散']]);
 assert.deepEqual(run(db,questions[8].sql).values,[['逍遙散'],['八珍湯'],['歸脾湯']]);
 assert.equal(run(db,questions[9].sql).values.filter(r=>r[1]===0).length,3);
 assert.equal(run(db,questions[9].variant).values.reduce((n,r)=>n+r[1],0),211);
 assert.equal(run(db,questions[11].sql).values.length,17);
 const delta=compareResults(run(db,questions[1].sql),run(db,questions[1].variant));
 assert.equal(delta.added.length,2);
 assert.equal(delta.removed.length,0);
 db.close();
});
test('sampled observations preserve their explicit positive and negative states',()=>{
 for(const c of dataset.clinical_case){
  const observations=dataset.case_symptom.filter(x=>x.case_id===c.case_id);
  assert.ok(observations.length>0);
  assert.equal(new Set(observations.map(v=>v.symptom_id)).size,observations.length);
  for(const o of observations){
   const name=dataset.symptom.find(v=>v.symptom_id===o.symptom_id).symptom_name;
   assert.ok(c.present_illness.includes(name));
   if(o.status==='absent') assert.ok(c.present_illness.includes(name));
  }
 }
});
test('diff preserves duplicates and distinguishes order, NULL and schema changes',()=>{
 const result=values=>({columns:['value'],values});
 assert.equal(compareResults(result([[1],[1]]),result([[1]])).removed.length,1);
 assert.equal(compareResults(result([[1],[2]]),result([[2],[1]])).orderChanged,true);
 assert.equal(compareResults(result([[null]]),result([['NULL']])).added.length,1);
 assert.equal(compareResults(result([[1]]),{columns:['total'],values:[[1]]}).kind,'columns');
});
test('an empty result retains columns in a prepared statement; a fresh seed recovers from modifications',()=>{
 const db=createDatabase(SQL),statement=db.prepare('SELECT case_id FROM clinical_case WHERE 0');
 assert.deepEqual(statement.getColumnNames(),['case_id']);assert.equal(statement.step(),false);statement.free();
 db.run('DELETE FROM case_symptom');db.close();
 const restored=createDatabase(SQL);assert.equal(run(restored,'SELECT COUNT(*) FROM case_symptom').values[0][0],1459);
 assert.throws(()=>restored.exec('SELEC case_id FROM clinical_case'),/syntax error/);restored.close();
});
