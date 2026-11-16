export const escape = value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={
 leaf:'M5 19C5 9 10 5 20 4c0 11-5 16-15 15Zm0 0L16 8',
 case:'M8 4h8v4H8zM8 6H5v15h14V6h-3M9 12h6m-6 4h6',
 database:'M20 6c0 2-4 3-8 3S4 8 4 6s4-3 8-3 8 1 8 3Zm0 0v12c0 2-4 3-8 3s-8-1-8-3V6m0 6c0 2 4 3 8 3s8-1 8-3',
 code:'m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
 compare:'M8 4v16m8-16v16M4 8l4-4 4 4m0 8 4 4 4-4',
 arrow:'M4 12h16m-6-6 6 6-6 6',
 down:'m6 9 6 6 6-6',
 play:'m8 5 11 7-11 7z',
 check:'m5 12 4 4L19 6',
 reset:'M4 10a8 8 0 1 1 1 8M4 4v6h6',
 download:'M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5',
 external:'M14 3h7v7m0-7L11 13m-1-8H4v15h15v-6',
 book:'M12 6c-3-2-6-2-10-2v15c4 0 7 0 10 2m0-15c3-2 6-2 10-2v15c-4 0-7 0-10 2V6',
 search:'M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6-2 6 6',
 menu:'M4 6h16M4 12h16M4 18h16',
 close:'m6 6 12 12M6 18 18 6',
 copy:'M8 8h12v13H8zM16 8V3H3v13h5',
 info:'M12 8v.1m0 4v5m0-15a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
 stop:'M6 6h12v12H6z',
 return:'M9 6 3 12l6 6M3 12h12a5 5 0 0 0 5-5V4',
 chevron:'m9 5 7 7-7 7',
 nodes:'M3 3h6v6H3zM15 15h6v6h-6zM15 3h6v6h-6zM9 6h6M6 9v9h9',
 spark:'M12 3v4m0 10v4M3 12h4m10 0h4M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3',
};
export function icon(name,cls=''){return `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]??paths.info}"/></svg>`;}
export const mark=`<svg class="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M10 8H5v24h5M30 8h5v24h-5M13 27c0-10 5-14 15-14 0 9-5 14-15 14Zm0 0 10-10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function table(result,{limit=50,changes=[],changeType='',label='查詢結果',id=''}={}) {
 if(!result)return '<div class="empty-state">正在準備資料…</div>';
 if(!result.columns.length)return '<div class="empty-state">查詢沒有回傳結果欄位。</div>';
 const counts=new Map();for(const r of changes){const k=JSON.stringify(r);counts.set(k,(counts.get(k)||0)+1);}
 const numeric=result.columns.map((_,i)=>result.values.some(v=>typeof v[i]==='number')&&result.values.every(v=>v[i]===null||typeof v[i]==='number'));
 const visible=result.values.slice(0,limit);
 return `<div class="table-scroll" tabindex="0" role="region" aria-label="${escape(label)}"><table ${id?`id="${id}"`:''}><caption class="sr-only">${escape(label)}</caption><thead><tr>${changes.length?'<th scope="col" class="change-cell">差異</th>':''}${result.columns.map((c,i)=>`<th scope="col" class="${numeric[i]?'num':''}">${escape(c)}</th>`).join('')}</tr></thead><tbody>${visible.map(row=>{
 const k=JSON.stringify(row),changed=(counts.get(k)||0)>0;if(changed)counts.set(k,counts.get(k)-1);
 return `<tr class="${changed?changeType:''}">${changes.length?`<td class="change-cell">${changed?changeType==='added'?'+ 新增':'− 移除':'—'}</td>`:''}${row.map((v,i)=>`<td class="${numeric[i]?'num ':''}${v===null?'null-value':''}">${v===null?'<span title="SQL NULL：沒有值">NULL</span>':escape(v)}</td>`).join('')}</tr>`;
 }).join('')}${!visible.length?`<tr><td colspan="${result.columns.length}" class="empty-cell">0 筆結果。這個條件下沒有符合的資料。</td></tr>`:''}</tbody></table></div>${result.values.length>limit?`<div class="table-end">顯示前 ${limit} / ${result.values.length} 筆 <button class="text-button" data-action="show-all" data-total="${result.values.length}">顯示全部</button></div>`:''}`;
}
export function download(name,content,type='text/plain;charset=utf-8'){
 const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
