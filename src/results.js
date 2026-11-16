/** Multiset comparison preserves duplicate rows. Column positions and order are explicit. */
export function compareResults(before, after) {
  if (JSON.stringify(before.columns)!==JSON.stringify(after.columns)) return {kind:'columns',added:[],removed:[],unchanged:0,orderChanged:false};
  const count=rows=>{const m=new Map();for(const row of rows){const k=JSON.stringify(row);m.set(k,(m.get(k)||0)+1);}return m;};
  const left=count(before.values), right=count(after.values), added=[],removed=[];
  for(const row of after.values){const k=JSON.stringify(row);if(left.get(k)>0)left.set(k,left.get(k)-1);else added.push(row);}
  for(const row of before.values){const k=JSON.stringify(row);if(right.get(k)>0)right.set(k,right.get(k)-1);else removed.push(row);}
  const orderChanged=!added.length&&!removed.length&&JSON.stringify(before.values)!==JSON.stringify(after.values);
  return {kind:'rows',added,removed,unchanged:before.values.length-removed.length,orderChanged};
}

export function csv(result) {
  const cell=value=>`"${String(value??'').replaceAll('"','""')}"`;
  return '\uFEFF'+[result.columns,...result.values].map(row=>row.map(cell).join(',')).join('\r\n');
}

export function explainError(message) {
  if(/no such table/i.test(message))return '資料表不存在。可到「資料庫設計」確認拼字，或使用左側的九張資料表。';
  if(/no such column/i.test(message))return '找不到欄位。請確認欄位名稱及別名；JOIN 後可以加上表格別名。';
  if(/syntax error|incomplete input|unrecognized token/i.test(message))return 'SQL 語法未完成或有拼字錯誤。請檢查 SELECT、逗號、引號、括號，以及關鍵字的順序。';
  if(/ambiguous/i.test(message))return '這個欄位同時存在於多張表。請加上表格別名，例如 c.case_id。';
  if(/misuse of aggregate/i.test(message))return '聚合條件請放在 HAVING，並確認 GROUP BY 與 COUNT 的使用位置。';
  if(/readonly/i.test(message))return '這個實驗室接受唯讀查詢。每次執行都使用相同的教學資料，請用 SELECT、WITH 或唯讀 PRAGMA。';
  return 'SQLite 無法完成這次查詢。可先還原參考 SQL，再一次修改一個條件。';
}
