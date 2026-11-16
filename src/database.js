let worker,sequence=0;
const pending=new Map();
function spawn(){
  worker=new Worker(new URL('./db.worker.js',import.meta.url),{type:'module'});
  worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p)return;clearTimeout(p.timer);pending.delete(data.id);data.error?p.reject(new Error(data.error)):p.resolve(data);};
  worker.onerror=()=>restart('SQLite 載入失敗，請重新整理頁面再試。');
}
function restart(message){worker?.terminate();for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error(message));}pending.clear();spawn();}
function request(payload,timeout=8000){
  if(!worker)spawn();
  return new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>restart('查詢超過 8 秒，已停止運算。請縮小查詢範圍後再試。'),timeout);pending.set(id,{resolve,reject,timer});worker.postMessage({id,...payload});});
}
export const ready=()=>request({type:'init'},30000);
export const execute=async sql=>{const r=await request({type:'query',sql});return {...r,result:r.results.at(-1)??{columns:[],values:[]}};};
export const exportDatabase=()=>request({type:'export'});
export const cancel=()=>restart('查詢已取消。資料庫已回復初始狀態。');
