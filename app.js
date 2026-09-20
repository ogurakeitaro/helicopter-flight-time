function fmt(m){m=Math.round(m);const h=Math.floor(m/60),mm=m%60;return h?`${h}時間${String(mm).padStart(2,'0')}分`:`${mm}分`;}
const aircraft=document.getElementById('aircraft'),from=document.getElementById('from'),to=document.getElementById('to'),result=document.getElementById('result');
const allAircraft=[...new Set(ROUTE_STATS.map(x=>x.aircraft))].sort();
function setOptions(el,items,placeholder){el.innerHTML=`<option value="">${placeholder}</option>`+items.map(v=>`<option>${v}</option>`).join('');}
setOptions(aircraft,allAircraft,'機種を選択');
const routes=()=>ROUTE_STATS.filter(x=>x.aircraft===aircraft.value);
function allPlaces(){return [...new Set(routes().flatMap(x=>[x.a,x.b]))].sort();}
function refreshFrom(){const p=allPlaces();setOptions(from,p,'出発地を選択');setOptions(to,p,'目的地を選択');showEmpty();}
function showEmpty(){result.innerHTML='<div class="hint">機種・出発地・目的地を選択すると、直行実績または実績区間をつないだ推定ルートを表示します。</div>';}
function edge(a,b){return routes().find(x=>(x.a===a&&x.b===b)||(x.a===b&&x.b===a));}
function pathCandidates(start,goal,maxLegs=3){
 const adj={};for(const r of routes()){(adj[r.a]??=[]).push([r.b,r]);(adj[r.b]??=[]).push([r.a,r]);}
 const found=[];
 function dfs(node,visited,legs,total){
  if(legs.length>maxLegs)return;
  if(node===goal&&legs.length){found.push({legs:[...legs],total});return;}
  if(legs.length===maxLegs)return;
  for(const [next,r] of (adj[node]||[])){if(visited.has(next))continue;visited.add(next);legs.push({from:node,to:next,stat:r});dfs(next,visited,legs,total+r.median);legs.pop();visited.delete(next);}
 }
 dfs(start,new Set([start]),[],0);
 return found.sort((a,b)=>a.total-b.total||a.legs.length-b.legs.length);
}
function legHtml(l){return `<li><span>${l.from} ⇄ ${l.to}</span><strong>約 ${fmt(l.stat.median)}</strong><small>実績 ${l.stat.count}便</small></li>`;}
function candidateHtml(p,i){const names=[p.legs[0].from,...p.legs.map(x=>x.to)];return `<div class="candidate"><div class="candidate-head"><span>候補 ${i+1}</span><strong>約 ${fmt(p.total)}</strong></div><div class="path">${names.join(' → ')}</div><ul class="legs">${p.legs.map(legHtml).join('')}</ul><div class="sum">純飛行時間 合計 <b>約 ${fmt(p.total)}</b></div></div>`;}
function calculate(){const ac=aircraft.value,a=from.value,b=to.value;if(!ac||!a||!b){showEmpty();return;}if(a===b){result.innerHTML='<div class="no-data">出発地と目的地は別の地点を選択してください。</div>';return;}
 const direct=edge(a,b);
 let html=`<div class="route">${a} ⇄ ${b}</div><div class="badge">${ac}</div>`;
 if(direct){html+=`<div class="label">直行実績の空輸時間目安</div><div class="big">約 ${fmt(direct.median)}</div><div class="grid"><div><span>実績件数</span><strong>${direct.count}便</strong></div><div><span>平均</span><strong>${fmt(direct.mean)}</strong></div><div><span>中央値</span><strong>${fmt(direct.median)}</strong></div><div><span>実績範囲</span><strong>${fmt(direct.min)} ～ ${fmt(direct.max)}</strong></div></div>`;}
 const candidates=pathCandidates(a,b,3).filter(p=>p.legs.length>=2).slice(0,3);
 if(candidates.length){html+=`<div class="subhead">${direct?'経由ルートの参考候補':'実績区間から算出した推定ルート'}</div>${candidates.map(candidateHtml).join('')}`;}
 if(!direct&&!candidates.length)html+='<div class="no-data">この条件では、直行実績または3レグ以内でつながる実績ルートがありません。</div>';
 html+='<p class="note">表示時間は同一機種の過去実績中央値をレグごとに合計した純飛行時間です。給油・駐機等の地上時間は含みません。燃料搭載量や航続可否は判定していません。実際の運航では最新の気象、航空情報、機体性能、運航規程等を確認してください。</p>';result.innerHTML=html;
}
aircraft.addEventListener('change',refreshFrom);from.addEventListener('change',calculate);to.addEventListener('change',calculate);document.getElementById('swap').addEventListener('click',()=>{const a=from.value,b=to.value;if(!a||!b)return;from.value=b;to.value=a;calculate();});showEmpty();