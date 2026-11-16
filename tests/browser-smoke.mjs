import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir,readFile } from 'node:fs/promises';
import initSqlJs from 'sql.js';
import {schema,totals} from '../src/data.js';
import { questions } from '../src/queries.js';

const url=process.env.TEST_URL??'http://127.0.0.1:4173/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const badRequests=[];page.on('response',r=>{if(r.status()>=400)badRequests.push(`${r.status()} ${r.url()}`);});
const go=async hash=>{await page.goto(`${url}#${hash}`);await page.getByText('SQLite 已就緒',{exact:true}).waitFor();};
const setSQL=async sql=>{const input=page.getByLabel('SQL 查詢編輯器');await input.fill(sql);};
const run=async()=>{await page.getByRole('button',{name:'執行查詢',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#result-status')?.textContent.includes('執行中'));};
try {
 await go('case');
 await page.getByLabel('切換示範病例').selectOption('CASE-011');
 await page.getByText('尚無處方',{exact:true}).waitFor();
 await go('database');
 await page.getByRole('button',{name:/病例 × 症狀/}).click();
 assert.equal(await page.locator('#table-select').inputValue(),'case_symptom');
 await page.getByRole('tab',{name:/樣本資料/}).click();
 assert.equal(await page.locator('#dictionary tbody tr').count(),10);
 await page.getByRole('button',{name:'查詢這張表',exact:true}).click();
 await page.getByRole('heading',{name:'探索病例 × 症狀資料'}).waitFor();
 await run();assert.match(await page.locator('#result-status').innerText(),/144 筆/);
 for(const t of schema){
  await go(`database/${t.name}`);
  await page.getByRole('tab',{name:/欄位說明/}).click();
  assert.equal(await page.locator('#dictionary tbody tr').count(),t.fields.length);
  await page.getByRole('tab',{name:/樣本資料/}).click();
  assert.equal(await page.locator('#dictionary tbody tr').count(),Math.min(10,totals[t.name]));
 }
 for(const q of questions){
  await go(`query/${q.id}`);
  await run();
  assert.match(await page.locator('#result-status').innerText(),new RegExp(`${q.expected} 筆`));
  await page.getByText('結果符合預期答案。',{exact:true}).waitFor();
  await page.getByRole('button',{name:'載入修改範例'}).click();
  await run();
  assert.match(await page.locator('#result-status').innerText(),new RegExp(`${q.modified} 筆`));
  await go(`compare/${q.id}`);
  await page.locator('.comparison-grid').waitFor();
  const counts=await page.locator('.count-transition strong').allTextContents();
  assert.deepEqual(counts,[`${q.expected}筆`,`${q.modified}筆`]);
 }
 await go('query/Q01');
 assert.match(await page.locator('#result-status').innerText(),/26 筆/);
 await page.getByRole('tab',{name:/預期結果/}).click();
 await page.locator('#results tbody tr').first().waitFor();
 assert.equal(await page.locator('#result-status').innerText(),'預期 14 筆');
 await page.getByRole('tab',{name:'實際結果',exact:true}).click();
 assert.match(await page.locator('#result-status').innerText(),/26 筆/);
 await go('query/Q10');await page.getByRole('button',{name:'還原',exact:true}).click();
 await go('compare/Q10');await page.locator('.comparison-grid').waitFor();
 await page.getByRole('button',{name:'只看差異資料',exact:true}).click();
 assert.equal(await page.locator('.comparison-side tbody tr').count(),4);
 await page.getByRole('button',{name:'我的 SQL',exact:true}).click();
 await page.getByText('資料內容相同',{exact:true}).waitFor();
 assert.equal(await page.locator('.comparison-side tbody tr').count(),20);
 assert.equal(await page.locator('.comparison-side .empty-cell').count(),0);
 await page.getByRole('button',{name:'修改範例',exact:true}).click();
 await page.getByRole('button',{name:'顯示全部結果',exact:true}).click();
 await go('query/Q01');
 await setSQL('SELEC * FROM clinical_case;');await run();
 assert.match(await page.locator('.error-state').innerText(),/syntax error/);
 await setSQL('SELECT * FROM missing_table;');await run();
 assert.match(await page.locator('.error-state').innerText(),/no such table/);
 await setSQL('SELECT case_id FROM clinical_case WHERE 0;');await run();
 await page.getByText('0 筆結果。這個條件下沒有符合的資料。',{exact:true}).waitFor();
 assert.equal(await page.locator('#results thead th').first().innerText(),'case_id');
 await setSQL('DELETE FROM clinical_case;');await run();
 assert.match(await page.locator('.error-state').innerText(),/readonly/);
 await setSQL('SELECT COUNT(*) AS total FROM clinical_case;');await run();
 assert.equal(await page.locator('#results tbody tr td').innerText(),'48');
 await page.getByRole('tab',{name:/預期結果/}).click();
 await page.locator('#results tbody tr').first().waitFor();
 assert.equal(await page.locator('#results tbody tr').count(),14);
 await page.getByRole('tab',{name:'實際結果',exact:true}).click();
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'CSV',exact:true}).click();
 const csvFile=await downloadPromise;
 assert.match(csvFile.suggestedFilename(),/\.csv$/);
 assert.match(await readFile(await csvFile.path(),'utf8'),/"total"\r\n"48"/);
 await page.getByRole('button',{name:'還原',exact:true}).click();
 await run();
 const dbPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'下載 SQLite 資料庫'}).click();
 const dbFile=await dbPromise;
 assert.equal(dbFile.suggestedFilename(),'tcm-teaching.sqlite');
 const SQL=await initSqlJs(),downloadedDb=new SQL.Database(await readFile(await dbFile.path()));
 assert.equal(downloadedDb.exec('SELECT COUNT(*) FROM clinical_case')[0].values[0][0],48);
 assert.deepEqual(downloadedDb.exec('PRAGMA foreign_key_check'),[]);downloadedDb.close();
 await page.getByRole('button',{name:'資料來源與說明'}).click();
 assert.equal(await page.locator('dialog').evaluate(el=>el.open),true);
 await page.keyboard.press('Escape');
 await mkdir('.taste-skill/browser',{recursive:true});
 await page.screenshot({path:'.taste-skill/browser/query-executed.png',fullPage:true});
 for(const width of [1440,768,390]) {
  await page.setViewportSize({width,height:900});
  for(const route of ['case','database','query/Q02','compare/Q10']){
   await go(route);
   if(route.startsWith('compare'))await page.locator('.comparison-grid').waitFor();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,`Page overflow at ${width} ${route}`);
  }
 }
 await page.getByRole('button',{name:'開啟導覽'}).click();
 await page.locator('.sidebar [data-route="database"]').click();
 await page.getByRole('heading',{name:'資料庫設計',exact:true}).waitFor();
 assert.equal(await page.locator('.app-shell').evaluate(el=>el.classList.contains('menu-open')),false);
 await page.emulateMedia({reducedMotion:'reduce'});
 await go('case');
 await page.getByRole('heading',{name:'中醫臨床資料庫'}).waitFor();
 assert.deepEqual(errors,[]);assert.deepEqual(badRequests,[]);
 console.log(JSON.stringify({passed:true,checks:'24 SQL executions, 12 comparisons, schema samples, free query, errors, readonly/reset, empty columns, downloads, modal, three widths, navigation, reduced motion',errors,badRequests},null,2));
}finally{await browser.close();}
