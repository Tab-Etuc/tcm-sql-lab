import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import initSqlJs from 'sql.js';
import {createDatabase,schema,totals} from '../src/data.js';
import {questions} from '../src/queries.js';

const base=process.env.TEST_URL??'http://127.0.0.1:4173/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const page=await browser.newPage();const SQL=await initSqlJs(),reference=createDatabase(SQL);
const go=async hash=>{await page.goto(base+'#'+hash);await page.getByText('SQLite 已就緒',{exact:true}).waitFor();};
const readQuery=(db,sql)=>{const stmt=db.prepare(sql);try{const result={columns:stmt.getColumnNames(),values:[]};while(stmt.step())result.values.push(stmt.get());return result;}finally{stmt.free();}};
const rendered=r=>({columns:r.columns,values:r.values.map(row=>row.map(v=>v===null?'NULL':String(v)))});
async function displayed(root,expected){
 const table=root.locator('table');assert.deepEqual(await table.locator('thead th').allTextContents(),expected.columns);
 const rows=await table.locator('tbody tr').evaluateAll(rows=>rows.filter(r=>!r.querySelector('.empty-cell')).map(r=>[...r.querySelectorAll('td')].map(c=>c.textContent)));
 assert.deepEqual(rows,expected.values);
}
function parseCSV(text){
 const rows=[],row=[];let cell='',quoted=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){
  const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
  else if(!quoted&&c===','){row.push(cell);cell='';}
  else if(!quoted&&(c==='\r'||c==='\n')){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push([...row]);row.length=0;cell='';}
  else cell+=c;
 }
 if(cell||row.length){row.push(cell);rows.push([...row]);}return rows;
}
async function verifyCSV(result){
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'CSV',exact:true}).click();
 const file=await pending,text=await readFile(await file.path(),'utf8');
 assert.deepEqual(parseCSV(text),[result.columns,...result.values.map(row=>row.map(v=>String(v??'')))]);
}
try{
 await go('database');
 let downloading=page.waitForEvent('download');await page.getByRole('button',{name:'下載建表與種子 SQL'}).click();
 const seedText=await readFile(await(await downloading).path(),'utf8');const fromSQL=new SQL.Database();fromSQL.run(seedText);
 downloading=page.waitForEvent('download');await page.getByRole('button',{name:'下載 SQLite 資料庫'}).click();
 const fromFile=new SQL.Database(await readFile(await(await downloading).path()));
 for(const table of schema){
  const order=table.fields.filter(f=>f[2].includes('PK')).map(f=>f[0]).join(', '),sql=`SELECT * FROM ${table.name} ORDER BY ${order}`;
  const expected=readQuery(reference,sql);assert.equal(expected.values.length,totals[table.name]);
  assert.deepEqual(readQuery(fromSQL,sql),expected,'seed '+table.name);assert.deepEqual(readQuery(fromFile,sql),expected,'SQLite '+table.name);
 }
 for(const db of [fromSQL,fromFile]){assert.deepEqual(db.exec('PRAGMA foreign_key_check'),[]);db.close();}
 for(const file of ['tcm_sql_design_spec.md','tcm_sql_erd.svg']){
  const response=await page.request.get(base+file);assert.equal(response.status(),200);
  assert.equal((await response.text()).replaceAll('\r\n','\n'),(await readFile('public/'+file,'utf8')).replaceAll('\r\n','\n'),file+' published content');
 }
 for(const q of questions){
  const before=readQuery(reference,q.sql),after=readQuery(reference,q.variant);
  await go('query/'+q.id);
  await page.getByRole('button',{name:'執行查詢',exact:true}).click();await page.getByText('結果符合預期答案。',{exact:true}).waitFor();
  let show=page.locator('#results [data-action="show-all"]');if(await show.count())await show.click();
  await displayed(page.locator('#results'),rendered(before));await verifyCSV(before);
  await page.getByRole('tab',{name:/預期結果/}).click();await page.locator('#result-match .result-note').waitFor();
  show=page.locator('#results [data-action="show-all"]');if(await show.count())await show.click();
  await displayed(page.locator('#results'),rendered(before));await verifyCSV(before);
  await page.getByRole('button',{name:'載入修改範例'}).click();await page.getByRole('button',{name:'執行查詢',exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('#result-status').textContent.includes('執行中'));
  show=page.locator('#results [data-action="show-all"]');if(await show.count())await show.click();
  await displayed(page.locator('#results'),rendered(after));await verifyCSV(after);
  await go('compare/'+q.id);await page.locator('.comparison-grid').waitFor();
  assert.equal(await page.locator('.comparison-reason>p').innerText(),q.why);
  for(const [side,expected] of [['before',before],['after',after]]){
   const table=page.locator(`[data-side="${side}"] table`);
   const columns=await table.locator('thead th:not(.change-cell)').allTextContents();
   const values=await table.locator('tbody tr').evaluateAll(rows=>rows.filter(r=>!r.querySelector('.empty-cell')).map(r=>[...r.querySelectorAll('td:not(.change-cell)')].map(c=>c.textContent)));
   assert.deepEqual({columns,values},rendered(expected),q.id+' '+side);
  }
 }
 console.log('PASS: all 9 downloaded tables match cell-for-cell in SQLite and seed SQL; 24 actual, 12 expected and 24 comparison result tables match; 36 CSV downloads match; published design document and ERD match current source.');
}finally{reference.close();await browser.close();}
