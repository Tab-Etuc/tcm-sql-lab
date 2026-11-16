import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import './style.css';
import {dataset,totals,schema,seedSQL} from './data.js';
import {questions} from './queries.js';
import {ready,execute,exportDatabase,cancel} from './database.js';
import {compareResults,csv,explainError} from './results.js';
import {icon,mark,escape as e,table,download} from './ui.js';
import {overview,databaseView,dictionary,erd,queryView,compareView,questionList,sourceDialog} from './views.js';
import {createEditor,setEditorDoc} from './editor.js';

const $=s=>document.querySelector(s);
const storageKey='tcm-sql-lab-v1';
let saved={};try{saved=JSON.parse(localStorage.getItem(storageKey)||'{}');}catch{}
const state={route:'case',qid:'Q02',selectedCase:'CASE-003',selectedTable:'clinical_case',dictionaryTab:'fields',resultTab:'actual',compareMode:'example',diffOnly:false,drafts:saved.drafts??{},completed:new Set((saved.completed??[]).filter(id=>questions.some(q=>q.id===id))),results:new Map(),baselines:new Map(),comparison:null,ready:false,running:false,renderId:0,expanded:new Set()};
let editor,toastTimer,customQuestion;
const compactNavigation=window.matchMedia('(max-width:1100px)');
function syncNavigation(){
 const open=$('.app-shell')?.classList.contains('menu-open');
 if($('.sidebar'))$('.sidebar').inert=compactNavigation.matches&&!open;
 if($('#main'))$('#main').inert=compactNavigation.matches&&open;
}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({drafts:state.drafts,completed:[...state.completed]}));}catch{}}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3000);}
function getQuestion(){return customQuestion??questions.find(q=>q.id===state.qid)??questions[1];}
function tableQuestion(name){
 const t=schema.find(s=>s.name===name);if(!t)return null;
 const sql=`SELECT *\nFROM ${name}\nORDER BY ${t.fields[0][0]};`;
 return {id:`table_${name}`,title:`探索${t.label}資料`,group:'資料表探索',level:'自由查詢',tags:['SELECT','ORDER BY'],tables:[name],prompt:`直接查閱 ${name} 的完整教學資料。你可以加入 WHERE、選擇欄位，或與其他資料表 JOIN。`,sql,variant:sql.replace(';','\nLIMIT 5;'),expected:totals[name],modified:Math.min(5,totals[name]),before:'全部資料',after:'前 5 筆資料',steps:['SELECT * 顯示所有欄位。','ORDER BY 依第一個鍵欄位排列。','嘗試用 LIMIT 控制結果列數。'],why:'LIMIT 5 只保留排序後的前五筆，資料庫裡的其他資料仍然存在。',takeaway:'自由查詢的結果可與完整資料表基準比較。'};
}
const nav=[['case','case','案例背景','使用情境與資料'],['database','nodes','資料庫設計','關聯模型與字典'],['query','code','SQL 實驗室','12 題互動練習'],['compare','compare','結果比較','理解每一次改動']];
$('#app').innerHTML=`<div class="app-shell"><aside class="sidebar" aria-label="主導覽"><a class="brand" href="#case">${mark}<span>中醫處方實驗室<small>TCM SQL Lab</small></span></a><div class="workspace-label">中醫臨床資料庫</div><nav>${nav.map(([route,ic,label,sub])=>`<a href="#${route}" data-route="${route}">${icon(ic)}<span>${label}<small>${sub}</small></span></a>`).join('')}</nav><div class="sidebar-bottom"><div class="learning-progress"><div><span>練習進度</span><span class="num" id="nav-progress"></span></div><progress id="learning-progress" max="12" value="0" aria-label="已驗證題目進度"></progress><p>執行並符合預期結果後記錄</p></div><button class="sidebar-utility" data-action="download-db">${icon('download')}下載 SQLite 資料庫</button><button class="sidebar-utility" data-action="sources">${icon('book')}資料來源與說明</button><div class="sidebar-credit">資料庫課程 · 2026 秋季</div></div></aside><header class="topbar"><button class="icon-button menu-toggle" aria-label="開啟導覽" aria-expanded="false" data-action="toggle-menu">${icon('menu')}</button><div class="breadcrumb"><span>教學工作區</span>${icon('chevron')}<span id="route-name">案例背景</span></div><div class="db-status" id="db-status" role="status"><span class="status-dot loading"></span>正在載入 SQLite</div></header><main id="main" class="main-sheet"></main><div class="nav-scrim" data-action="toggle-menu"></div></div>${sourceDialog()}<div class="toast" id="toast" role="status"></div>`;

function updateProgress(){
 $('#nav-progress').textContent=`${state.completed.size} / ${questions.length}`;
 $('#learning-progress').value=state.completed.size;
}
function navigate(hash){if(location.hash===`#${hash}`)renderRoute();else location.hash=hash;}
function parseRoute(){
 const [r,id]=location.hash.slice(1).split('/');state.route=nav.some(n=>n[0]===r)?r:'case';
 customQuestion=null;
 if(['query','compare'].includes(state.route)&&id){
  if(id.startsWith('table_'))customQuestion=tableQuestion(id.slice(6));
  if(questions.some(q=>q.id===id)||customQuestion)state.qid=id;
 }
 if(state.qid.startsWith('table_')&&!customQuestion&&['query','compare'].includes(state.route))customQuestion=tableQuestion(state.qid.slice(6));
 if(state.route==='database'&&schema.some(t=>t.name===id))state.selectedTable=id;
}
async function baseline(q){
 if(!state.baselines.has(q.id))state.baselines.set(q.id,execute(q.sql).then(r=>r.result).catch(err=>{state.baselines.delete(q.id);throw err;}));
 return state.baselines.get(q.id);
}
function renderRoute(){
 const activeMain=document.activeElement?.closest('#main');
 state.renderId++;editor?.destroy();editor=null;
 parseRoute();state.expanded.clear();
 $('.app-shell').classList.remove('menu-open');$('.menu-toggle').setAttribute('aria-expanded','false');
 syncNavigation();
 document.querySelectorAll('[data-route]').forEach(a=>{const active=a.dataset.route===state.route;a.classList.toggle('active',active);active?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current');});
 $('#route-name').textContent=nav.find(n=>n[0]===state.route)[2];
 const q=getQuestion();
 document.title=`${nav.find(n=>n[0]===state.route)[2]} · 中醫處方實驗室`;
 $('#main').innerHTML=state.route==='case'?overview(state.selectedCase):state.route==='database'?databaseView(state.selectedTable,state.dictionaryTab):state.route==='query'?queryView(q,state.completed):compareView(q,state.compareMode==='custom');
 if(state.route==='query'){
  editor=createEditor($('#sql-editor'),state.drafts[q.id]??q.sql,runQuery,doc=>{state.drafts[q.id]=doc;persist();const result=state.results.get(q.id);if(result&&doc!==result.sql)$('#result-status').textContent='SQL 已修改 · 請重新執行';});
  if(customQuestion){const sel=$('#question-select');sel.insertAdjacentHTML('afterbegin',`<option selected value="${q.id}">${q.title}</option>`);}
  renderQueryResults();
  const run=$('#run-button');if(!state.ready){run.disabled=true;run.title='SQLite 正在載入';}
  baseline(q).then(()=>{if(state.route==='query'&&getQuestion().id===q.id)renderQueryResults();}).catch(err=>{if(state.route==='query')$('#results').innerHTML=errorBlock(err.message);});
 }
 if(state.route==='compare'){
  if(customQuestion)$('#compare-select').insertAdjacentHTML('afterbegin',`<option selected value="${q.id}">${q.title}</option>`);
  loadComparison();
 }
 updateProgress();window.scrollTo(0,0);if(activeMain||state.renderId>1)$('h1')?.focus({preventScroll:true});
}
function errorBlock(message){return `<div class="error-state" role="alert"><div>${icon('info')}<strong>查詢無法完成</strong></div><code>${e(message)}</code><p>${e(explainError(message))}</p><button class="text-button" data-action="reset-sql">還原參考 SQL ${icon('reset')}</button></div>`;}
async function renderQueryResults(){
 if(state.route!=='query')return;
 const q=getQuestion(),renderId=state.renderId,stored=state.results.get(q.id),tab=state.resultTab;
 document.querySelectorAll('[data-result-tab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.resultTab===tab));
 let result;
 if(tab==='expected'){
  $('#results').innerHTML='<div class="empty-state">正在執行基準查詢…</div>';
  try{result=await baseline(q);}catch(err){if(state.renderId===renderId)$('#results').innerHTML=errorBlock(err.message);return;}
  if(state.renderId!==renderId||state.resultTab!==tab)return;
 }else if(stored?.error){$('#results').innerHTML=errorBlock(stored.error);$('#result-match').innerHTML='';return;}
 else result=stored?.result;
 if(!result){$('#results').innerHTML='<div class="empty-state">點選「執行查詢」，查看這段 SQL 的實際結果。<br><span>或切換「預期結果」，先閱讀參考答案。</span></div>';return;}
 $('#results').innerHTML=table(result,{limit:state.expanded.has('query')?2000:25,label:tab==='expected'?'預期結果':'實際結果'});
 if(tab==='expected')$('#result-match').innerHTML=`<p class="result-note">${icon('info')}由參考 SQL 實際執行取得，共 ${result.values.length} 筆。</p>`;
 else if(stored){
  try{
   const expected=await baseline(q);if(state.renderId!==renderId||state.resultTab!==tab)return;
   const d=compareResults(expected,result);
   const match=d.kind==='rows'&&!d.added.length&&!d.removed.length;
   const text=d.kind==='columns'?'欄位名稱或順序與預期不同，請檢查 SELECT。':match?d.orderChanged?'資料內容符合預期，排序不同。':'結果符合預期答案。':`與預期相比，新增 ${d.added.length} 列、移除 ${d.removed.length} 列。`;
   $('#result-match').innerHTML=`<div class="match-status ${match?'matched':''}">${icon(match?'check':'info')}<span>${text}</span><a href="#compare/${q.id}" data-use-custom>比較我的 SQL ${icon('arrow')}</a></div>`;
  }catch{}
 }
}
async function runQuery(){
 if(state.running||!editor)return;
 const q=getQuestion(),sql=editor.state.doc.toString(),renderId=state.renderId;
 if(!sql.trim()){toast('請先輸入 SQL 查詢。');editor.focus();return;}
 state.running=true;$('#run-button').innerHTML=`${icon('stop')}停止查詢`;$('#run-button').dataset.action='cancel-query';$('#result-status').textContent='執行中…';
 try{
  const output=await execute(sql),expected=await baseline(q);
  state.results.set(q.id,{...output,sql});
  const d=compareResults(expected,output.result);
  if(questions.some(v=>v.id===q.id)&&d.kind==='rows'&&!d.added.length&&!d.removed.length){state.completed.add(q.id);persist();}
  if(state.renderId===renderId){
   state.resultTab='actual';$('#result-status').textContent=`${output.result.values.length} 筆 · ${output.elapsed.toFixed(1)} ms${output.results.length>1?` · 顯示第 ${output.results.length} 組結果`:''}`;
   renderQueryResults();updateProgress();$('#question-list').innerHTML=questionList(q.id,state.completed,$('#question-search').value);
   $('.progress-label').innerHTML=`已驗證 <strong class="num">${state.completed.size} / ${questions.length}</strong> 題`;
  }
 }catch(err){state.results.set(q.id,{error:err.message,sql});if(state.renderId===renderId){state.resultTab='actual';$('#result-status').textContent='執行失敗';renderQueryResults();}}
 finally{state.running=false;if(state.renderId===renderId){$('#run-button').innerHTML=`${icon('play')}執行查詢`;$('#run-button').dataset.action='run';}}
}
function sqlDiff(sql,other,kind){
 const otherLines=new Set(other.split('\n'));
 return `<pre class="compare-sql"><code>${sql.split('\n').map(line=>`<span class="sql-line ${otherLines.has(line)?'':kind}"><span class="line-sign" aria-hidden="true">${otherLines.has(line)?' ':kind==='added'?'+':'−'}</span>${e(line)||' '}</span>`).join('')}</code></pre>`;
}
function renderComparison(){
 const c=state.comparison;if(!c||state.route!=='compare')return;
 const q=getQuestion(),d=compareResults(c.before,c.after),schemaChanged=d.kind==='columns';
 const delta=c.after.values.length-c.before.values.length;
 const own=state.compareMode==='custom';
 const summary=schemaChanged?'欄位結構改變':d.orderChanged?'內容相同，排序不同':!d.added.length&&!d.removed.length?'資料內容相同':`新增 ${d.added.length} 列 · 移除 ${d.removed.length} 列`;
 $('#comparison').innerHTML=`<div class="comparison-summary"><div class="count-transition"><div><span>原版結果</span><strong class="num">${c.before.values.length}<small>筆</small></strong></div>${icon('arrow')}<div><span>${own?'我的結果':'修改結果'}</span><strong class="num">${c.after.values.length}<small>筆</small></strong></div></div><div class="delta-summary"><strong>${summary}</strong><span>${delta===0?'結果列數不變':`比原版${delta>0?'增加':'減少'} ${Math.abs(delta)} 筆`}${schemaChanged?' · 欄位不同，不逐列判定增減':''}</span>${!schemaChanged&&(d.added.length||d.removed.length)?`<button class="text-button diff-filter" data-action="toggle-differences" aria-pressed="${state.diffOnly}">${state.diffOnly?'顯示全部結果':'只看差異資料'}</button>`:''}</div></div><div class="comparison-grid" style="--sql-lines:${Math.max(q.sql.split('\n').length,c.sql.split('\n').length)}">${[
 ['before',c.before,q.sql,c.sql,'原版 SQL',q.before,'removed',schemaChanged?[]:d.removed],
 ['after',c.after,c.sql,q.sql,own?'我的 SQL':'修改版 SQL',own?'目前編輯器內容':q.after,'added',schemaChanged?[]:d.added]
 ].map(([side,result,sql,other,label,desc,type,changes])=>`<section class="comparison-side" data-side="${side}" aria-label="${label}"><div class="compare-side-heading"><div><h3>${label}</h3><span>${desc}</span></div><button class="icon-button" data-action="copy-comparison" data-side="${side}" aria-label="複製${label}">${icon('copy')}</button></div>${sqlDiff(sql,other,type)}<div class="compare-result-heading"><h3>${side==='before'?'原版':'修改版'}結果</h3><span class="num">${state.diffOnly&&!schemaChanged?`差異 ${changes.length} / `:''}${result.values.length} 筆</span></div>${table(state.diffOnly&&!schemaChanged?{...result,values:changes}:result,{limit:2000,changes,changeType:type,label:`${label}的查詢結果`})}</section>`).join('')}</div><section class="comparison-reason"><div>${icon('book')}<h2>${own?'如何解讀這次比較？':'為什麼結果改變了？'}</h2></div><p>${own?schemaChanged?'你的 SELECT 欄位名稱或順序與原版不同。請先對齊欄位，再比較各列資料的內容。':d.orderChanged?'兩側資料列內容與重複次數一致，但排列順序不同。使用 ORDER BY 指定排序欄位，可以固定結果的排列順序。':!d.added.length&&!d.removed.length?'這次查詢回傳與原版相同的資料內容。SQL 寫法可能不同，結果仍可等價。你可以再修改 WHERE、JOIN 或 HAVING，檢查新的假設。':'比較以完整資料列為單位，保留重複列次數。新增與移除標記表示原版／修改版的差集；同一病例的儲存格改變，也會呈現一列移除與一列新增。請對照上方 SQL 變更行，確認篩選或聚合方式的影響。':q.why}</p><div class="reason-bottom"><span>${q.takeaway}</span><a class="button secondary" href="#query/${q.id}">回編輯器試試 ${icon('arrow')}</a></div></section>`;
}
async function loadComparison(){
 const q=getQuestion(),renderId=state.renderId,mode=state.compareMode;
 const sql=mode==='custom'?(state.drafts[q.id]??q.sql):q.variant;
 $('#comparison').innerHTML='<div class="empty-state">正在執行兩段 SQL，計算真實差異…</div>';
 try{
  const before=await baseline(q),after=await execute(sql);
  if(state.renderId!==renderId||state.compareMode!==mode)return;
  state.comparison={before,after:after.result,sql};renderComparison();
 }catch(err){if(state.renderId===renderId)$('#comparison').innerHTML=`${errorBlock(err.message)}<a class="button secondary" href="#query/${q.id}">回到編輯器修正 ${icon('arrow')}</a>`;}
}
function selectTable(name){
 if(!schema.some(t=>t.name===name))return;
 state.selectedTable=name;$('#erd').innerHTML=erd(name);$('#dictionary').innerHTML=dictionary(name,state.dictionaryTab);$('#table-select').value=name;
 history.replaceState(null,'',`#database/${name}`);
}
document.addEventListener('click',async ev=>{
 const target=ev.target.closest('button,a,[data-action]');if(!target)return;
 if(target.hasAttribute('data-use-custom'))state.compareMode='custom';
 if(target.dataset.table){selectTable(target.dataset.table);return;}
 if(target.dataset.dictionaryTab){state.dictionaryTab=target.dataset.dictionaryTab;$('#dictionary').innerHTML=dictionary(state.selectedTable,state.dictionaryTab);return;}
 if(target.dataset.resultTab){state.resultTab=target.dataset.resultTab;state.expanded.delete('query');renderQueryResults();return;}
 if(target.dataset.compareMode){state.compareMode=target.dataset.compareMode;state.expanded.clear();document.querySelectorAll('[data-compare-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.compareMode===state.compareMode));loadComparison();return;}
 const action=target.dataset.action;
 try{
 switch(action){
  case 'toggle-menu':{const open=$('.app-shell').classList.toggle('menu-open');$('.menu-toggle').setAttribute('aria-expanded',String(open));syncNavigation();if(open)$('.sidebar nav a')?.focus();break;}
  case 'sources':$('#sources-dialog').showModal();break;
  case 'toggle-differences':state.diffOnly=!state.diffOnly;renderComparison();break;
  case 'toggle-erd':{const expanded=$('#erd').classList.toggle('expanded');target.setAttribute('aria-expanded',String(expanded));target.textContent=expanded?'收合完整圖':'展開完整 ERD';break;}
  case 'close-dialog':$('#sources-dialog').close();break;
  case 'run':runQuery();break;
  case 'cancel-query':cancel();break;
  case 'copy-sql':await navigator.clipboard.writeText(editor.state.doc.toString());toast('SQL 已複製。');break;
  case 'reset-sql':{const q=getQuestion();if(editor)setEditorDoc(editor,q.sql);else{state.drafts[q.id]=q.sql;persist();navigate(`query/${q.id}`);}toast('已還原參考 SQL。');break;}
  case 'load-variant':setEditorDoc(editor,getQuestion().variant);toast('已載入修改範例，執行查詢即可查看差異。');break;
  case 'seed-download':download('tcm-sql-seed.sql',seedSQL);break;
  case 'download-db':{const r=await exportDatabase();download('tcm-teaching.sqlite',r.bytes,'application/vnd.sqlite3');toast('SQLite 資料庫已下載。');break;}
  case 'query-table':navigate(`query/table_${target.dataset.tableName}`);break;
  case 'copy-comparison':await navigator.clipboard.writeText(target.dataset.side==='before'?getQuestion().sql:state.comparison.sql);toast('SQL 已複製。');break;
  case 'export-csv':{const q=getQuestion(),result=state.resultTab==='expected'?await baseline(q):state.results.get(q.id)?.result;if(!result){toast('請先執行查詢。');break;}download(`${q.id}-${state.resultTab}.csv`,csv(result),'text/csv;charset=utf-8');break;}
  case 'show-all':{const side=target.closest('.comparison-side')?.dataset.side;state.expanded.add(side??'query');side?renderComparison():renderQueryResults();break;}
 }
 }catch(err){toast(err.message||'操作未完成，請再試一次。');}
});
document.addEventListener('change',ev=>{
 const el=ev.target;
 if(el.id==='case-select'){state.selectedCase=el.value;$('#main').innerHTML=overview(state.selectedCase);$('#case-select').focus({preventScroll:true});$('.clinical-trace').classList.add('trace-updated');}
 if(el.id==='table-select')selectTable(el.value);
 if(el.id==='question-select')navigate(`query/${el.value}`);
 if(el.id==='compare-select')navigate(`compare/${el.value}`);
});
document.addEventListener('input',ev=>{if(ev.target.id==='question-search')$('#question-list').innerHTML=questionList(getQuestion().id,state.completed,ev.target.value);});
document.addEventListener('keydown',ev=>{
 if($('.app-shell').classList.contains('menu-open')){
  if(ev.key==='Escape'){$('.app-shell').classList.remove('menu-open');$('.menu-toggle').setAttribute('aria-expanded','false');syncNavigation();$('.menu-toggle').focus();}
  if(ev.key==='Tab'){
   const controls=[...$('.sidebar').querySelectorAll('a,button')],first=controls[0],last=controls.at(-1);
   if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}
   if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}
  }
 }
 const tab=ev.target.closest('[role="tab"]');
 if(tab&&['ArrowLeft','ArrowRight'].includes(ev.key)){
  const tabs=[...tab.parentElement.querySelectorAll('[role="tab"]')],index=tabs.indexOf(tab),next=tabs[(index+(ev.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];
  ev.preventDefault();next.click();const selector=next.dataset.resultTab?`[data-result-tab="${next.dataset.resultTab}"]`:`[data-dictionary-tab="${next.dataset.dictionaryTab}"]`;$(selector)?.focus();
 }
});
compactNavigation.addEventListener('change',syncNavigation);
window.addEventListener('hashchange',renderRoute);
renderRoute();
ready().then(()=>{state.ready=true;$('#db-status').innerHTML='<span class="status-dot"></span>SQLite 已就緒';if($('#run-button'))$('#run-button').disabled=false;}).catch(err=>{$('#db-status').innerHTML='<span class="status-dot failed"></span>資料庫載入失敗';toast(err.message);});
