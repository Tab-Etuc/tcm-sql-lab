import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { createDatabase } from './data.js';

let SQL, seed;
const init=initSqlJs({locateFile:()=>wasmUrl}).then(sql=>{
  SQL=sql;
  const db=createDatabase(SQL);
  seed=db.export();db.close();
});

self.onmessage=async({data})=>{
  const {id,sql,type}=data;
  let db;
  try {
    await init;
    if(type==='init'){self.postMessage({id,ready:true});return;}
    if(type==='export'){self.postMessage({id,bytes:seed});return;}
    db=new SQL.Database(seed);
    db.run('PRAGMA foreign_keys=ON; PRAGMA query_only=ON;');
    // Reject controls that could turn off query_only; the SQL still runs in a disposable worker database.
    const plain=sql.replace(/--[^\n]*|\/\*[\s\S]*?\*\//g,' ').trim();
    if(!plain) throw new Error('請輸入 SQL 查詢。');
    if(/\bPRAGMA\s+(?:\w+\.)?query_only\b/i.test(plain)) throw new Error('readonly: query_only 設定不可變更。');
    const start=performance.now();
    const results=[];
    for(const stmt of db.iterateStatements(sql)) {
      const columns=stmt.getColumnNames(),values=[];
      if(!columns.length){stmt.step();continue;}
      while(stmt.step()) {
        if(values.length===2000)throw new Error('結果超過 2,000 列，請加入 LIMIT 或縮小條件。');
        values.push(stmt.get());
      }
      results.push({columns,values});
      if(results.length>8)throw new Error('一次最多執行 8 組結果，請分次查詢。');
    }
    self.postMessage({id,results,elapsed:performance.now()-start});
  } catch(error) {self.postMessage({id,error:error.message});}
  finally {db?.close();}
};
