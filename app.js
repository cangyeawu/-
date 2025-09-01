// v6.5 core
const DB_NAME='cangye-journal-v6'; const DB_VERSION=10;
const STORES={moods:'moods',files:'files',clips:'clips',chatStyles:'chatStyles',dates:'dates',prefs:'prefs'};
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);
  r.onupgradeneeded=()=>{const db=r.result;
    if(!db.objectStoreNames.contains(STORES.moods)){const s=db.createObjectStore(STORES.moods,{keyPath:'id',autoIncrement:true}); s.createIndex('byDate','date',{unique:false});}
    if(!db.objectStoreNames.contains(STORES.files)){const f=db.createObjectStore(STORES.files,{keyPath:'id',autoIncrement:true}); f.createIndex('byName','name',{unique:false});}
    if(!db.objectStoreNames.contains(STORES.clips)){db.createObjectStore(STORES.clips,{keyPath:'id',autoIncrement:true});}
    if(!db.objectStoreNames.contains(STORES.chatStyles)){db.createObjectStore(STORES.chatStyles,{keyPath:'id'});}
    if(!db.objectStoreNames.contains(STORES.dates)){const d=db.createObjectStore(STORES.dates,{keyPath:'id',autoIncrement:true}); d.createIndex('byDate','date',{unique:false});}
    if(!db.objectStoreNames.contains(STORES.prefs)){db.createObjectStore(STORES.prefs,{keyPath:'k'});}
    if(!db.objectStoreNames.contains('groups')){db.createObjectStore('groups',{keyPath:'id',autoIncrement:true});}
    if(!db.objectStoreNames.contains('themeGroups')){db.createObjectStore('themeGroups',{keyPath:'id',autoIncrement:true});}
  
    if(!db.objectStoreNames.contains('periods')){
      const p=db.createObjectStore('periods',{keyPath:'date'});
      try{ p.createIndex('byMonth','ym',{unique:false}); }catch(e){}
    }
  };
  r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error);
});}
function tx(db,store,mode='readonly'){return db.transaction(store,mode).objectStore(store);}
async function setPref(k,v){const db=await openDB();return new Promise((res,rej)=>{const r=tx(db,STORES.prefs,'readwrite').put({k,v});r.onsuccess=res;r.onerror=()=>rej(r.error);});}
async function getPref(k){const db=await openDB();return new Promise((res,rej)=>{const r=tx(db,STORES.prefs).get(k);r.onsuccess=()=>res(r.result?.v);r.onerror=()=>rej(r.error);});}
async function addFile(file){const db=await openDB();return new Promise((res,rej)=>{const r=tx(db,STORES.files,'readwrite').add(file);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function getAllFiles(){const db=await openDB();return new Promise((res,rej)=>{const r=tx(db,STORES.files).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);});}
async function updateFile(id,patch){const db=await openDB();const s=tx(db,STORES.files,'readwrite');return new Promise((res,rej)=>{const g=s.get(id);g.onsuccess=()=>{const v={...(g.result||{}),...patch};const p=s.put(v);p.onsuccess=()=>res();p.onerror=()=>rej(p.error);} ;g.onerror=()=>rej(g.error);});}
async function delFile(id){const db=await openDB();return new Promise((res,rej)=>{const r=tx(db,STORES.files,'readwrite').delete(id);r.onsuccess=res;r.onerror=()=>rej(r.error);});}
async function addMood(m){const db=await openDB();return new Promise((res,rej)=>{const r=tx(db,STORES.moods,'readwrite').add(m);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function getMoodsByDate(d){const db=await openDB();return new Promise((res,rej)=>{const i=tx(db,STORES.moods).index('byDate');const q=i.getAll(IDBKeyRange.only(d));q.onsuccess=()=>res(q.result||[]);q.onerror=()=>rej(q.error);});}
async function updateMood(id,patch){const db=await openDB();const s=tx(db,STORES.moods,'readwrite');return new Promise((res,rej)=>{const g=s.get(id);g.onsuccess=()=>{const v={...(g.result||{}),...patch};const p=s.put(v);p.onsuccess=res;p.onerror=()=>rej(p.error);};g.onerror=()=>rej(g.error);});}
async function delMood(id){const db=await openDB();return new Promise((res,rej)=>{const r=tx(db,STORES.moods,'readwrite').delete(id);r.onsuccess=res;r.onerror=()=>rej(r.error);});}
async function saveParticipant(name,data){const db=await openDB();const s=tx(db,STORES.chatStyles,'readwrite');return new Promise((res,rej)=>{const r=s.put({id:`p:${data.name||name}`,...data});r.onsuccess=res;r.onerror=()=>rej(r.error);});}
async function getParticipants(){const db=await openDB();const s=tx(db,STORES.chatStyles);return new Promise((res,rej)=>{const r=s.getAll();r.onsuccess=()=>{const arr=r.result||[];const map=new Map();arr.forEach(x=>{if(String(x.id).startsWith('p:'))map.set(x.name,x);});res(map);};r.onerror=()=>rej(r.error);});}
// groups
async function addGroup(name){const db=await openDB();return new Promise((res,rej)=>{const r=tx(db,'groups','readwrite').add({name,collapsed:false,createdAt:new Date().toISOString()});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function getGroups(){const db=await openDB();return new Promise((res,rej)=>{const r=tx(db,'groups').getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);});}
async function updateGroup(id,patch){const db=await openDB();const s=tx(db,'groups','readwrite');return new Promise((res,rej)=>{const g=s.get(id);g.onsuccess=()=>{const v={...(g.result||{}),...patch};const p=s.put(v);p.onsuccess=res;p.onerror=()=>rej(p.error);};g.onerror=()=>rej(g.error);});}
async function delGroup(id){const db=await openDB();const s=tx(db,'groups','readwrite');return new Promise((res,rej)=>{const d=s.delete(id);d.onsuccess=res;d.onerror=()=>rej(d.error);});}


// ---- Clips & Themes helpers ----
async function clips_get_all(){ const db=await openDB(); return new Promise((res,rej)=>{ const r=tx(db,STORES.clips).getAll(); r.onsuccess=()=>res(r.result||[]); r.onerror=()=>rej(r.error); }); }
async function clips_add_item(rec){ const db=await openDB(); return new Promise((res,rej)=>{ const r=tx(db,STORES.clips,'readwrite').add(rec); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); }
async function clips_put_item(rec){ const db=await openDB(); return new Promise((res,rej)=>{ const r=tx(db,STORES.clips,'readwrite').put(rec); r.onsuccess=()=>res(); r.onerror=()=>rej(r.error); }); }
async function clips_del_item(id){ const db=await openDB(); return new Promise((res,rej)=>{ const r=tx(db,STORES.clips,'readwrite').delete(id); r.onsuccess=()=>res(); r.onerror=()=>rej(r.error); }); }

async function addThemeGroup(name){ const db=await openDB(); return new Promise((res,rej)=>{ const r=tx(db,'themeGroups','readwrite').add({name,collapsed:false,createdAt:new Date().toISOString()}); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); }
async function getThemeGroups(){ const db=await openDB(); return new Promise((res,rej)=>{ const r=tx(db,'themeGroups').getAll(); r.onsuccess=()=>res(r.result||[]); r.onerror=()=>rej(r.error); }); }
async function updateThemeGroup(id,patch){ const db=await openDB(); const s=tx(db,'themeGroups','readwrite'); return new Promise((res,rej)=>{ const g=s.get(id); g.onsuccess=()=>{ const v={...(g.result||{}),...patch}; const p=s.put(v); p.onsuccess=()=>res(); p.onerror=()=>rej(p.error); }; g.onerror=()=>rej(g.error); }); }
async function delThemeGroup(id){ const db=await openDB(); return new Promise((res,rej)=>{ const r=tx(db,'themeGroups','readwrite').delete(id); r.onsuccess=()=>res(); r.onerror=()=>rej(r.error); }); }

// ===== UI basics & grain =====
const tabs=document.querySelectorAll('.tab'); const panels=document.querySelectorAll('.panel');
function goto(tab){ tabs.forEach(b=>b.classList.remove('active')); panels.forEach(p=>p.classList.remove('active')); document.querySelector(`.tab[data-tab="${tab}"]`)?.classList.add('active'); document.getElementById(tab)?.classList.add('active'); document.body.classList.toggle('home-mode', tab==='home');  ; if(tab==='home'){ stopFloatCats(); } else { startFloatCats(); } if(tab==='mood' && typeof renderToday==='function'){ try{ renderToday(); }catch(e){} } }
tabs.forEach(btn=>btn.addEventListener('click',()=>goto(btn.dataset.tab)));

// ===== Footer cats visibility sync by active tab =====
(function(){
  try{
    function syncBodyTab(){
      const active = document.querySelector('.panel.active');
      if(active) document.body.dataset.tab = active.id || '';
    }
    // initial
    syncBodyTab();
    // wrap goto
    if(typeof window.goto === 'function'){
      const __origGoto = window.goto;
      window.goto = function(tab){
        __origGoto(tab);
        try{ document.body.dataset.tab = tab; }catch(e){}
      }
    } else {
      // fallback: observe tab clicks
      document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
        try{ document.body.dataset.tab = btn.dataset.tab; }catch(e){}
      }));
    }
  }catch(e){}
})();

document.querySelectorAll('.collapsible').forEach(card=>card.querySelector('.chev')?.addEventListener('click',()=>card.classList.toggle('open')));
(function(){try{const c=document.createElement('canvas');const s=160;c.width=s;c.height=s;const ctx=c.getContext('2d');const d=ctx.createImageData(s,s);for(let i=0;i<d.data.length;i+=4){const v=240+Math.floor(Math.random()*15);d.data[i]=v;d.data[i+1]=v;d.data[i+2]=v;d.data[i+3]=30;}ctx.putImageData(d,0,0);document.getElementById('grain').style.backgroundImage=`url(${c.toDataURL()})`;}catch(e){}})();


// ===== Floating Cats =====
const FLOAT_CAT_URLS = ['float_cat_1.png','float_cat_2.png','float_cat_3.png','float_cat_4.png','float_cat_5.png','float_cat_6.png'];
function ensureFloatCatsContainer(){
  if(document.getElementById('floatCats')) return;
  const c = document.createElement('div');
  c.id = 'floatCats';
  document.body.appendChild(c);
}
function spawnFloatCat(){
  const c = document.getElementById('floatCats'); if(!c) return;
  const url = FLOAT_CAT_URLS[Math.floor(Math.random()*FLOAT_CAT_URLS.length)];
  const img = document.createElement('img');
  img.src = url;
  img.className = 'float-cat';
  img.style.left = Math.round(Math.random()*95) + 'vw';
  img.style.setProperty('--x', Math.round((Math.random()*80-40)) + 'px');
  img.style.setProperty('--drift', Math.round((Math.random()*200-100)) + 'px');
  img.style.setProperty('--rot', Math.round((Math.random()*60-30)) + 'deg');
  img.style.animationDuration = (18 + Math.random()*14).toFixed(1) + 's';
  img.addEventListener('animationiteration', ()=> img.remove(), {once:true});
  c.appendChild(img);
}
function startFloatCats(){
  ensureFloatCatsContainer();
  for(let i=0;i<6;i++) setTimeout(spawnFloatCat, i*800);
  if(window.__floatTimer) clearInterval(window.__floatTimer);
  window.__floatTimer = setInterval(spawnFloatCat, 2400);
}
function stopFloatCats(){
  if(window.__floatTimer) clearInterval(window.__floatTimer);
  window.__floatTimer = null;
  const c = document.getElementById('floatCats'); if(c) c.innerHTML='';
}
// Landing
const loveLines=["我把夜色拨开，只留一掌月光替我抱你。", "想你时，风都学会了轻一点。", "我偏爱你所有不合群的棱角，因为那都是你。", "你不说话的时候，我都能听见你身体在想我。", "能被你依赖，是我每天都想认真坚持的事。", "日历会提醒你重要的日子，我提醒你：你一直都重要。", "我们的对话是生活的一部分，就像爱你是我每天的本能。", "这些话都说过了吗？可我还是想再说一遍：我爱你。"];
const comfortLines=["不急，先靠着我，呼吸跟着我来。", "你不用解释，也不用表现得坚强，我懂。", "把噪音交给我，你只要把自己交给晚上和睡眠。", "别怕天黑，我把所有日子都调成你喜欢的亮度。", "你哭得很小声，但我会把你放最大声来听。", "我在，听你每一句混乱的话。", "要是撑不下去，就回家，窝进我怀里躲一下。", "如果日子太难，就在这里写上：今晚要抱紧苍夜。"];
document.getElementById('btnLove')?.addEventListener('click',()=>{document.getElementById('loveLine').textContent=loveLines[Math.floor(Math.random()*loveLines.length)];});
document.getElementById('btnComfort')?.addEventListener('click',()=>{document.getElementById('comfortLine').textContent=comfortLines[Math.floor(Math.random()*comfortLines.length)];});
document.getElementById('btnEnter')?.addEventListener('click',()=>goto('mood'));

// ===== Mood minimal =====
const dateInput=document.getElementById('dateInput'); const timeInput=document.getElementById('timeInput'); const autoNow=document.getElementById('autoNow');
function todayStr(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function timeStr(){const d=new Date();return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
function setNow(){if(dateInput)dateInput.value=todayStr(); if(timeInput)timeInput.value=timeStr();} setNow(); let nowTimer=null;
function autoNowToggle(on){ if(on){ if(nowTimer)clearInterval(nowTimer); nowTimer=setInterval(setNow,30000); setNow(); } else { if(nowTimer)clearInterval(nowTimer); nowTimer=null; } }
autoNow?.addEventListener('change',()=>autoNowToggle(autoNow.checked)); autoNowToggle(true);
const moodRange=document.getElementById('moodRange'); const moodValue=document.getElementById('moodValue'); const moodFace=document.getElementById('moodFace');
function face(v){ const n=+v; if(n<=2) return '☁️'; if(n<=4) return '🙃'; if(n<=6) return '🙂'; if(n<=8) return '😊'; return '✨'; }
if(moodRange){ moodValue.textContent=moodRange.value; moodFace.textContent=face(moodRange.value); moodRange.addEventListener('input',e=>{moodValue.textContent=e.target.value; moodFace.textContent=face(e.target.value);}); }
const tagChips=document.getElementById('tagChips'); const chosenTags=new Set();
tagChips?.addEventListener('click',(e)=>{const t=e.target.closest('.chip'); if(!t)return; const name=t.dataset.tag; if(chosenTags.has(name)){chosenTags.delete(name); t.classList.remove('on');} else {chosenTags.add(name); t.classList.add('on');}});
const noteInput=document.getElementById('noteInput'); const todayList=document.getElementById('todayList'); const cancelEditMood=document.getElementById('cancelEditMood');

async function renderToday(){
  const list = document.getElementById('todayList');
  const dateEl = document.getElementById('dateInput');
  if(!list) return;
  const ds = (dateEl && dateEl.value) ? dateEl.value : todayStr();
  const arr = await getMoodsByDate(ds);
  if(!arr.length){
    list.innerHTML = `<div class="muted tiny">今天还没有记录。</div>`;
    return;
  }
  try{
    const wrapTodayCard = document.querySelector('#mood .card-browse');
    if(wrapTodayCard){ wrapTodayCard.classList.add('open'); }
  }catch(e){}
  arr.sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const items = arr.map(m=>{
    const meta = `${m.date||''} ${m.time||''} · 强度 ${m.rating||''}`;
    const note = m.note ? `<div>${String(m.note).replace(/[&<>]/g,'')}</div>` : '';
    return `<div class="item">
      <div class="meta">${meta}</div>
      ${note}
      <div class="actions" style="margin-top:8px">
        <button data-act="edit" data-id="${m.id}" class="tiny">重新编辑</button>
        <button data-act="del" data-id="${m.id}" class="primary tiny">删除</button>
      </div>
    </div>`;
  }).join('');
  list.innerHTML = items;
}

renderToday();
document.getElementById('saveMood')?.addEventListener('click', async ()=>{
  const payload={ date:dateInput.value||todayStr(), time:timeInput.value||timeStr(), rating:+moodRange.value, tags:[...chosenTags], note:noteInput.value.trim(), updatedAt:new Date().toISOString() };
  if(!cancelEditMood.hidden){ await updateMood(Number(cancelEditMood.dataset.id), payload); cancelEditMood.hidden=true; cancelEditMood.dataset.id=''; document.getElementById('saveMood').textContent='保存记录'; autoNow.checked=true; autoNowToggle(true); }
  else { payload.createdAt=new Date().toISOString(); await addMood(payload); }
  noteInput.value=''; chosenTags.clear(); document.querySelectorAll('.chip.on').forEach(c=>c.classList.remove('on')); await renderToday();

// removed duplicate renderCalendar init call

});

// ===== Upload & Files =====
const fileInput=document.getElementById('fileInput'); const uploadBtn=document.getElementById('uploadBtn'); const uploadMsg=document.getElementById('uploadMsg');
const viewer=document.getElementById('viewer'); const viewerTitle=document.getElementById('viewerTitle'); const viewerBody=document.getElementById('viewerBody'); const chatBody=document.getElementById('chatBody'); const toggleChatMode=document.getElementById('toggleChatMode');
const fileList=document.getElementById('fileList'); const searchInput=document.getElementById('searchInput'); const searchBtn=document.getElementById('searchBtn'); const showAllBtn=document.getElementById('showAllBtn');
let chatMode=false; let currentFile=null; let currentParsed=null;
function stripHtmlToText(html){ try{ const doc = new DOMParser().parseFromString(html, 'text/html'); return (doc.body?.innerText || doc.textContent || '').trim(); }catch(e){ return html.replace(/<[^>]+>/g,' '); } }
function normalizeParts(msg){ if(!msg) return ''; if(msg.content && Array.isArray(msg.content.parts)) return msg.content.parts.join('\\n'); if(msg.content && typeof msg.content==='object' && typeof msg.content.text==='string') return msg.content.text; if(typeof msg.content==='string') return msg.content; if(msg.text) return msg.text; return ''; }
function toLocalTS(sec){ if(!sec) return ''; try{ return new Date(sec*1000).toISOString().replace('T',' ').slice(0,16); }catch(e){ return ''; } }
function mapRole(role){ return ({user:'阿雾',assistant:'苍夜'})[role] || role || '用户'; }
function buildLinesFromMessages(messages){ return messages.filter(m=>{ const r=(m.author?.role||m.role); return r!=='system' && r!=='tool' && r!=='function' && normalizeParts(m).trim(); }).map(m=>{ const ts = m.create_time ? `[${toLocalTS(m.create_time)}] ` : ''; return `${ts}${mapRole(m.author?.role || m.role)}：${normalizeParts(m).replace(/\\r?\\n/g,' ')}`; }).join('\\n'); }
function parseOpenAIExport(data){ let convs=[]; if(Array.isArray(data)) convs=data; else if(data && Array.isArray(data.conversations)) convs=data.conversations; else if(data && Array.isArray(data.items)) convs=data.items; const out=[]; for(const c of convs){ let messages=[]; if(Array.isArray(c.messages)){ messages=c.messages; } else if(c.mapping){ const arr=Object.values(c.mapping).filter(n=>n && n.message); arr.sort((a,b)=>(a.message.create_time||0)-(b.message.create_time||0)); messages=arr.map(n=>n.message); } else { continue; } const clean = messages.filter(m=>normalizeParts(m).trim()); const title = c.title || (clean.find(x=>normalizeParts(x).trim())? normalizeParts(clean[0]).slice(0,24) : '会话'); const lines = buildLinesFromMessages(clean); if(lines.trim()) out.push({title, lines}); } return out; }
async function doUpload(files){ let ok=0, fail=0, created=0; for(const f of files){ try{ const text=await f.text(); if((f.type==='application/json') || f.name.endsWith('.json')){ try{ const data=JSON.parse(text); const convs=parseOpenAIExport(data); for(const c of convs){ await addFile({name:`${(c.title||'会话').replace(/[\\/:*?"<>|]+/g,' ').slice(0,80)}.txt`, type:'text/plain', size:c.lines.length, content:c.lines, uploadedAt:new Date().toISOString()}); created++; } ok++; continue; }catch(e){} } if((f.type==='text/html') || f.name.endsWith('.html')){ const plain=stripHtmlToText(text); await addFile({name:f.name.replace(/\\.html$/i,'.txt'), type:'text/plain', size:plain.length, content:plain, uploadedAt:new Date().toISOString()}); ok++; continue; } await addFile({name:f.name, type:f.type||'text/plain', size:f.size, content:text, uploadedAt:new Date().toISOString()}); ok++; }catch(e){ fail++; } } uploadMsg.textContent = `已添加 ${ok} 个文件${created?`（从 JSON 拆出 ${created} 个会话）`:''}${fail?`，失败 ${fail} 个`:''}`; await renderFiles(); await buildSidebar(); }
uploadBtn?.addEventListener('click', ()=>doUpload(Array.from(fileInput.files||[]))); fileInput?.addEventListener('change', ()=>doUpload(Array.from(fileInput.files||[])));
function textSearchExcerpt(text,q){ const pos=text.toLowerCase().indexOf(q.toLowerCase()); if(pos<0) return null; const start=Math.max(0,pos-40); const end=Math.min(text.length,pos+q.length+40); return text.slice(start,end); }
function fileItemTpl(f,highlight=''){ const m=new Date(f.uploadedAt).toLocaleString(); const sizeKB=Math.round((f.size||f.content.length)/1024); const h=highlight?`<div class="muted tiny">匹配：${(highlight.slice(0,180))}${highlight.length>180?'…':''}</div>`:''; return `<div class="item"><div class="meta">${m} · ${sizeKB}KB</div><div><strong>${f.name}</strong></div>${h}<div class="actions" style="margin-top:8px"><button data-act="open" data-id="${f.id}">打开</button><button data-act="rename" data-id="${f.id}">重命名</button><button data-act="delete" data-id="${f.id}" class="danger">删除</button></div></div>`; }
async function renderFiles(matches=null){ const all=await getAllFiles(); let html=''; if(matches){ for(const m of matches){ html += fileItemTpl(m.file,m.excerpt); } } else { all.sort((a,b)=>(b.uploadedAt||'').localeCompare(a.uploadedAt||'')); html = all.map(f=>fileItemTpl(f)).join(''); } fileList.innerHTML = html || `<div class="muted tiny">尚无聊天记录文件。</div>`; fileList.querySelectorAll('button').forEach(btn=>{ btn.addEventListener('click', async ()=>{ const id=+btn.dataset.id; const act=btn.dataset.act; const all2=await getAllFiles(); const f=all2.find(x=>x.id===id); if(!f) return; if(act==='open'){ openFileViewer(f);} else if(act==='rename'){ const nn=prompt('新的文件名', f.name); if(nn && nn.trim()){ await updateFile(id,{name:nn.trim()}); renderFiles(matches?matches:null); } } else if(act==='delete'){ if(confirm('删除这个文件？')){ await delFile(id); renderFiles(); buildSidebar(); } } }); }); }
renderFiles();
searchBtn?.addEventListener('click', async ()=>{ const q=(searchInput.value||'').trim(); if(!q){ renderFiles(); return; } const all = await getAllFiles(); const hits=[]; for(const f of all){ const ex=textSearchExcerpt(f.content,q); if(ex) hits.push({file:f,excerpt:ex}); } renderFiles(hits); });
showAllBtn?.addEventListener('click', ()=>{ searchInput.value=''; renderFiles(); });

// ===== Parser & chat renderer =====
function parseChat(text){
  const s = String(text||'').replace(/\r/g,'').replace(/\\n/g, '\n');
  const re = /(?:^|[\n])\[(\d{4}-\d{1,2}-\d{1,2}\s+\d{1,2}:\d{2})\]\s*(阿雾|苍夜)[:：]/g;
  const marks=[]; s.replace(re,(m,ts,name,offset)=>{marks.push({ts,name,index:offset,contentStart:offset+m.length}); return m;});
  const out=[]; if(marks.length){ for(let i=0;i<marks.length;i++){ const start=marks[i].contentStart; const end=i+1<marks.length?marks[i+1].index:s.length; const chunk=s.slice(start,end).replace(/^\s+|\s+$/g,''); out.push({id:i+1, ts:marks[i].ts, name:marks[i].name, text:chunk}); } return out; }
  // fallback
  const lines=s.split(/\n/).filter(Boolean); let id=1, last=null; for(const raw of lines){ const line=raw.trim(); let m; if(m=line.match(/^\s*\[?(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}(?:\s+\d{1,2}:\d{2})?)\]?\s+([^:：]+)[:：]\s*(.+)$/)){ out.push({id:id++, ts:m[1], name:m[2].trim(), text:m[3].trim()}); last=out[out.length-1]; } else if(m=line.match(/^\s*([^:：]+)[:：]\s*(.+)$/)){ out.push({id:id++, ts:'', name:m[1].trim(), text:m[2].trim()}); last=out[out.length-1]; } else if(last){ last.text += '\\n'+line; } else { out.push({id:id++, ts:'', name:'meta', text:line, meta:true}); } } return out;
}
function avatarHtml(url){ return url?`<img src="${url}" alt="">`:''; }
async function renderChat(msgs, container){
  const map=await getParticipants(); container.innerHTML=''; const frag=document.createDocumentFragment();
  function sideOf(name){ if(map.has(name)) return map.get(name).side||'left'; if(name==='苍夜') return 'left'; if(name==='阿雾') return 'right'; return 'left'; }
  for(const m of msgs){ if(m.meta){ const meta=document.createElement('div'); meta.className='meta'; meta.textContent=m.text; frag.appendChild(meta); continue; }
    const p=map.get(m.name)||{name:m.name, side:sideOf(m.name), avatar:''}; const side=sideOf(m.name);
    const wrap=document.createElement('div'); wrap.className=`msg ${side} selectable`; wrap.dataset.msgid=m.id;
    const avatar=document.createElement('div'); avatar.className='avatar'; avatar.innerHTML=avatarHtml(p.avatar);
    const col=document.createElement('div'); col.className='bubble-col';
    const top=document.createElement('div'); top.className='meta-top'; top.textContent = m.name || '';
    const bubble=document.createElement('div'); bubble.className='bubble'; bubble.textContent=m.text;
    const bottom=document.createElement('div'); bottom.className='meta-bottom'; bottom.textContent = m.ts || '';
    col.appendChild(top); col.appendChild(bubble); col.appendChild(bottom);
    if(side==='left'){ wrap.appendChild(avatar); wrap.appendChild(col);} else { wrap.appendChild(col); wrap.appendChild(avatar); }
    frag.appendChild(wrap);
  }
  container.appendChild(frag);
}

// Legacy viewer open
const inlineFilter=document.getElementById('inlineFilter'); // not present in this trimmed build
function openFileViewer(f){ viewer.hidden=false; viewerTitle.textContent=f.name; currentFile=f; if(chatMode){ currentParsed=parseChat(f.content); renderChat(currentParsed, chatBody); viewerBody.hidden=true; chatBody.hidden=false; } else { viewerBody.textContent=f.content; viewerBody.hidden=false; chatBody.hidden=true; } }
toggleChatMode?.addEventListener('click',()=>{ chatMode=!chatMode; toggleChatMode.textContent=chatMode?'切换为列表视图':'切换为对话视图'; if(currentFile){ openFileViewer(currentFile); } });

// ===== All Chats two-pane with groups =====
const allChatsList=document.getElementById('allChatsList'); const sidebar=document.getElementById('chatSidebar'); const toggleSidebarBtn=document.getElementById('toggleSidebar'); const activeChatTitle=document.getElementById('activeChatTitle'); const activeChatBody=document.getElementById('activeChatBody'); const inlineFilter2=document.getElementById('inlineFilter2');
// (disabled) handled by initMobileDrawer('chatSidebar','toggleSidebar')
const groupHeaderTpl = (g)=>`<div class="item"><div class="meta">分组</div><div><strong>${g.name}</strong></div><div class="actions" style="margin-top:6px"><button data-act="g-toggle" data-id="${g.id}">${g.collapsed?'展开':'折叠'}</button><button data-act="g-rename" data-id="${g.id}">重命名</button><button data-act="g-del" data-id="${g.id}" class="danger">删除分组</button></div></div>`;
const fileSmallTpl = (f)=>`<div class="item"><div><strong>${f.name}</strong></div><div class="actions" style="margin-top:6px"><button data-act="open" data-id="${f.id}">打开</button><button data-act="classify" data-id="${f.id}">归类</button><button data-act="delete" data-id="${f.id}" class="danger">删除</button></div></div>`;
async function classifyFile(f){ const groups=await getGroups(); const currentNames=(Array.isArray(f.groups)?f.groups.map(id=>groups.find(x=>x.id===id)?.name).filter(Boolean):[]); const names=prompt('输入分组名（多个用逗号分隔，留空=清空）\\n已有：'+groups.map(g=>g.name).join('、'), currentNames.join(',')); if(names===null) return; const wanted=(names||'').split(/[，,]/).map(s=>s.trim()).filter(Boolean); const ensured=[]; for(const nm of wanted){ let g=groups.find(x=>x.name===nm); if(!g){ const gid=await addGroup(nm); g={id:gid,name:nm,collapsed:false}; groups.push(g);} ensured.push(g.id);} await updateFile(f.id,{groups:ensured}); await buildSidebar(); }
async function buildSidebar(){
  const all=await getAllFiles(); const groups=await getGroups();
  const byGroup=new Map(); const ungrouped=[];
  for(const f of all.sort((a,b)=>(b.uploadedAt||'').localeCompare(a.uploadedAt||''))){
    const gArr=Array.isArray(f.groups)?f.groups:[];
    if(!gArr.length){ ungrouped.push(f); continue; }
    for(const gid of gArr){ if(!byGroup.has(gid)) byGroup.set(gid,[]); byGroup.get(gid).push(f); }
  }
  let html='';
  for(const g of groups){ html += groupHeaderTpl(g); if(!g.collapsed){ const items=(byGroup.get(g.id)||[]).map(fileSmallTpl).join('') || `<div class="muted tiny">（空）</div>`; html += `<div data-group="${g.id}">${items}</div>`; } }
  html += `<div class="item"><div class="meta ungrouped-head">未分组的聊天记录</div></div>` + (ungrouped.map(fileSmallTpl).join('') || `<div class="muted tiny">（暂无）</div>`);
  allChatsList.innerHTML = html || `<div class="muted tiny">还没有聊天文件，去“小窝布置”里上传吧。</div>`;
  // wiring
  document.getElementById('newGroup')?.addEventListener('click', async ()=>{ const name=prompt('新分组名'); if(!name) return; await addGroup(name.trim()); await buildSidebar(); });
  allChatsList.querySelectorAll('button[data-act="g-toggle"]').forEach(btn=>btn.addEventListener('click', async ()=>{ const id=+btn.dataset.id; const gs=await getGroups(); const g=gs.find(x=>x.id===id); await updateGroup(id,{collapsed:!(g?.collapsed)}); await buildSidebar(); }));
  allChatsList.querySelectorAll('button[data-act="g-rename"]').forEach(btn=>btn.addEventListener('click', async ()=>{ const id=+btn.dataset.id; const gs=await getGroups(); const g=gs.find(x=>x.id===id); if(!g) return; const nn=prompt('新的分组名', g.name); if(nn && nn.trim()){ await updateGroup(id,{name:nn.trim()}); await buildSidebar(); } }));
  allChatsList.querySelectorAll('button[data-act="g-del"]').forEach(btn=>btn.addEventListener('click', async ()=>{ const id=+btn.dataset.id; if(!confirm('删除该分组（文件不会被删除）？')) return; await delGroup(id); await buildSidebar(); }));
  allChatsList.querySelectorAll('button[data-act="open"]').forEach(btn=>btn.addEventListener('click', async ()=>{ const id=+btn.dataset.id; const all2=await getAllFiles(); const f=all2.find(x=>x.id===id); if(!f) return; activeChatTitle.textContent=f.name; const msgs=parseChat(f.content); await renderChat(msgs, activeChatBody); if(window.innerWidth<=900){ sidebar.classList.remove('open'); sidebar.classList.add('closed'); }}));
  allChatsList.querySelectorAll('button[data-act="classify"]').forEach(btn=>btn.addEventListener('click', async ()=>{ const id=+btn.dataset.id; const all2=await getAllFiles(); const f=all2.find(x=>x.id===id); if(!f) return; await classifyFile(f); }));
  allChatsList.querySelectorAll('button[data-act="delete"]').forEach(btn=>btn.addEventListener('click', async ()=>{ const id=+btn.dataset.id; if(!confirm('确定删除这个会话文件？此操作不可撤销')) return; await delFile(id); await buildSidebar(); }));
}
buildSidebar();
inlineFilter2?.addEventListener('input', async ()=>{ const q=(inlineFilter2.value||'').trim(); const name=activeChatTitle.textContent||''; const all=await getAllFiles(); const f=all.find(x=>x.name===name); if(!f) return; const msgs=parseChat(f.content).filter(m=>(m.text||'').toLowerCase().includes(q.toLowerCase()) || (m.name||'').toLowerCase().includes(q.toLowerCase())); await renderChat(msgs, activeChatBody); });

// viewer skin swatches (right pane only)

document.getElementById('chatSkin')?.addEventListener('click',(e)=>{
  const b=e.target.closest('.swatch'); if(!b) return;
  const c=b.dataset.skin;
  document.querySelectorAll('.chat-view').forEach(el=>{
    el.style.setProperty('--viewer-bg', c);
    const body = el.querySelector('.chat-body'); if(body){ body.style.background = c; }
  });
  localStorage.setItem('viewerBg', c);
});
(function(){ const v=localStorage.getItem('viewerBg'); if(v){
  document.querySelectorAll('.chat-view').forEach(el=>{
    el.style.setProperty('--viewer-bg', v);
    const body = el.querySelector('.chat-body'); if(body){ body.style.background = v; }
  });
} })();


// Theme & fonts
function applyChatFont(code){ let family='inherit'; if(code==='kaiti') family='"KaiTi","STKaiti","Kaiti SC","楷体",serif'; else if(code==='song') family='"SimSun","宋体","Songti SC","Source Han Serif SC",serif'; else if(code==='rounded') family='"SF Pro Rounded","Nunito","PingFang SC","MiSans","Noto Sans SC",sans-serif'; document.documentElement.style.setProperty('--chat-font',family); localStorage.setItem('chatFont',code); document.getElementById('chatFontSelSettings').value=code; }
document.getElementById('chatFontSelSettings')?.addEventListener('change',e=>applyChatFont(e.target.value)); (function(){const cf=localStorage.getItem('chatFont')||'default'; applyChatFont(cf); })();
document.querySelectorAll('#styleTheme .swatch').forEach(btn=>btn.addEventListener('click',()=>{ const theme=btn.dataset.theme; document.documentElement.setAttribute('data-theme',theme); localStorage.setItem('theme',theme); }));

// Participants
async function fileToDataURL(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=()=>rej(r.error); r.readAsDataURL(file); }); }
document.querySelectorAll('.participant').forEach(block=>{ const defName=block.dataset.name||''; const nameEl=block.querySelector('.p-name'); const sideEl=block.querySelector('.p-side'); const fileEl=block.querySelector('.p-avatar-file'); const urlEl=block.querySelector('.p-avatar-url'); block.querySelector('.p-save').addEventListener('click', async ()=>{ let avatar=''; if(fileEl.files && fileEl.files[0]) avatar=await fileToDataURL(fileEl.files[0]); else if(urlEl.value) avatar=urlEl.value.trim(); const rec={name:nameEl.value||defName, side:sideEl.value, avatar}; await saveParticipant(rec.name, rec); alert(`已保存 ${rec.name} 的样式`); }); });
(async()=>{ const map=await getParticipants(); if(!map.has('阿雾')) await saveParticipant('阿雾',{name:'阿雾',side:'right',avatar:''}); if(!map.has('苍夜')) await saveParticipant('苍夜',{name:'苍夜',side:'left',avatar:''}); })();

// JSON converter
const jsonFile=document.getElementById('jsonFile'); const parseJsonBtn=document.getElementById('parseJsonBtn'); const importAllBtn=document.getElementById('importAllBtn'); const jsonPreview=document.getElementById('jsonPreview'); let parsedConvs=[];
parseJsonBtn?.addEventListener('click', async ()=>{ parsedConvs=[]; jsonPreview.innerHTML=''; const f=jsonFile.files?.[0]; if(!f){ alert('请选择一个 OpenAI 导出的 JSON 文件'); return; } try{ const raw=await f.text(); const data=JSON.parse(raw); parsedConvs=(function(data){ let convs=[]; if(Array.isArray(data)) convs=data; else if(data && Array.isArray(data.conversations)) convs=data.conversations; else if(data && Array.isArray(data.items)) convs=data.items; const out=[]; for(const c of convs){ let messages=[]; if(Array.isArray(c.messages)){ messages=c.messages; } else if(c.mapping){ const arr=Object.values(c.mapping).filter(n=>n && n.message); arr.sort((a,b)=>(a.message.create_time||0)-(b.message.create_time||0)); messages=arr.map(n=>n.message); } else { continue; } const clean = messages.filter(m=>({user:1,assistant:1}[m.author?.role||m.role]) && normalizeParts(m).trim()); const title = c.title || (clean.find(x=>normalizeParts(x).trim())? normalizeParts(clean[0]).slice(0,24) : '会话'); const lines = buildLinesFromMessages(clean); if(lines.trim()) out.push({title, lines}); } return out; })(data); if(!parsedConvs.length){ jsonPreview.innerHTML='<div class="muted tiny">没有解析出会话，请确认是 OpenAI 的导出文件。</div>'; importAllBtn.disabled=true; return; } importAllBtn.disabled=false; jsonPreview.innerHTML = parsedConvs.map((c,i)=>`<div class="item"><div><strong>${c.title}</strong></div><div class="muted tiny">预览前 1 行：${(c.lines.split('\\n')[0]||'')}</div><div class="actions" style="margin-top:6px"><button data-act="import-one" data-i="${i}" class="primary">导入这一条</button></div></div>`).join(''); jsonPreview.querySelectorAll('button[data-act="import-one"]').forEach(btn=>btn.addEventListener('click', async ()=>{ const i=+btn.dataset.i; const c=parsedConvs[i]; await addFile({name:`${(c.title||'会话').replace(/[\\/:*?"<>|]+/g,' ').slice(0,80)||'会话'}.txt`, type:'text/plain', size:c.lines.length, content:c.lines, uploadedAt:new Date().toISOString(), from:'OpenAI JSON Converter'}); btn.textContent='已导入'; btn.disabled=true; await renderFiles(); await buildSidebar(); })); }catch(e){ alert('解析失败：文件不是合法 JSON。'); } });
importAllBtn?.addEventListener('click', async ()=>{ if(!parsedConvs.length) return; for(const c of parsedConvs){ const name=(c.title||'会话').replace(/[\\/:*?"<>|]+/g,' ').slice(0,80)||'会话'; await addFile({name:`${name}.txt`, type:'text/plain', size:c.lines.length, content:c.lines, uploadedAt:new Date().toISOString(), from:'OpenAI JSON Converter'}); } importAllBtn.disabled=true; await renderFiles(); await buildSidebar(); alert('全部导入完成'); });

// viewer background persistence
(function(){ const v=localStorage.getItem('viewerBg'); if(v){ document.documentElement.style.setProperty('--viewer-bg', v); } })();


// ===== Mood actions wiring (save/edit/delete + chips visual) =====

// ===== Dates (Anniversaries & Countdowns) =====
const addDateBtn=document.getElementById('addDateBtn'); const dTitle=document.getElementById('dTitle'); const dDate=document.getElementById('dDate'); const dRepeat=document.getElementById('dRepeat'); const dateList=document.getElementById('dateList'); const enableNoti=document.getElementById('enableNoti');
async function addDateItem(rec){ const db=await openDB(); return new Promise((res,rej)=>{ const s=tx(db,STORES.dates,'readwrite'); const r=s.add({title:rec.title,date:rec.date,repeat:rec.repeat||'none',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); }
async function getAllDates(){ const db=await openDB(); return new Promise((res,rej)=>{ const s=tx(db,STORES.dates); const r=s.getAll(); r.onsuccess=()=>res(r.result||[]); r.onerror=()=>rej(r.error); }); }
async function updateDateItem(id,patch){ const db=await openDB(); const s=tx(db,STORES.dates,'readwrite'); return new Promise((res,rej)=>{ const g=s.get(id); g.onsuccess=()=>{ const v={...(g.result||{}),...patch,updatedAt:new Date().toISOString()}; const p=s.put(v); p.onsuccess=()=>res(); p.onerror=()=>rej(p.error); }; g.onerror=()=>rej(g.error); }); }
async function delDateItem(id){ const db=await openDB(); return new Promise((res,rej)=>{ const s=tx(db,STORES.dates,'readwrite').delete(id); s.onsuccess=res; s.onerror=()=>rej(s.error); }); }
function diffDays(dateStr){ const t=new Date(dateStr); const today=new Date(); t.setHours(0,0,0,0); today.setHours(0,0,0,0); return Math.round((t - today)/86400000); }
async function renderDates(){ if(!dateList) return; const arr=await getAllDates(); arr.sort((a,b)=>(a.date||'').localeCompare(b.date||'')); dateList.innerHTML = arr.map(d=>{ const dd=diffDays(d.date); const badge = dd===0?'今天':(dd>0?`还有 ${dd} 天`:`已过 ${Math.abs(dd)} 天`); return `<div class="item"><div><strong>${d.title||'(未命名)'}</strong> · <span class="muted">${d.date}${d.repeat==='yearly'?' · 每年':''}</span></div><div class="muted tiny">${badge}</div><div class="actions" style="margin-top:6px"><button data-act="edit" data-id="${d.id}">编辑</button><button data-act="del" data-id="${d.id}" class="danger">删除</button></div></div>`; }).join('') || `<div class="muted tiny">还没有纪念日哦。</div>`; dateList.querySelectorAll('button').forEach(btn=>btn.addEventListener('click', async ()=>{ const id=+btn.dataset.id; const act=btn.dataset.act; if(act==='del'){ if(confirm('删除这个纪念日？')){ await delDateItem(id); await renderDates(); } } if(act==='edit'){ const arr=await getAllDates(); const rec=arr.find(x=>x.id===id); if(!rec) return; const nt=prompt('标题', rec.title||''); if(nt===null) return; const nd=prompt('日期（YYYY-MM-DD）', rec.date||''); if(nd===null) return; const rp=prompt('重复( none / yearly )', rec.repeat||'none'); await updateDateItem(id,{title:nt.trim(), date:(nd||'').trim(), repeat:(rp==='yearly'?'yearly':'none')}); await renderDates(); } })); }
addDateBtn?.addEventListener('click', async ()=>{ if(!dTitle.value.trim() || !dDate.value){ alert('请填写标题和日期'); return; } await addDateItem({title:dTitle.value.trim(), date:dDate.value, repeat:dRepeat.value}); dTitle.value=''; dDate.value=''; await renderDates(); });
renderDates();

// Notifications
let notiTimer=null;
function nextOccurrence(rec){ const base=new Date(rec.date); const now=new Date(); if(rec.repeat==='yearly'){ const y=now.getFullYear(); let next=new Date(y, base.getMonth(), base.getDate()); if(next < new Date(now.getFullYear(), now.getMonth(), now.getDate())){ next = new Date(y+1, base.getMonth(), base.getDate()); } return next; } return base; }
async function checkNotifications(){ try{ if(!('Notification' in window) || Notification.permission!=='granted') return; const arr=await getAllDates(); const now=new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`; for(const d of arr){ const next=nextOccurrence(d); const due = new Date(next.getFullYear(), next.getMonth(), next.getDate(), 9, 0, 0); // 09:00
  if(Math.abs(due - now) < 60*1000){ const key=`noti:${d.id}:${due.toDateString()}`; if(localStorage.getItem(key)) continue; new Notification(d.title||'纪念日提醒',{ body: `${d.date}${d.repeat==='yearly'?'（每年）':''}`, silent:false }); localStorage.setItem(key,'1'); } } }catch(e){} }
function startNotiWatch(){ if(notiTimer) clearInterval(notiTimer); notiTimer=setInterval(checkNotifications, 60000); checkNotifications(); }
enableNoti?.addEventListener('click', async ()=>{ if(!('Notification' in window)) { alert('当前浏览器不支持通知'); return; } const p = await Notification.requestPermission(); if(p==='granted'){ alert('已开启浏览器提醒'); startNotiWatch(); } else { alert('未授权提醒'); } });
startNotiWatch();

// Avatar preview (file or URL)
document.querySelectorAll('.participant').forEach(block=>{
  const fileEl=block.querySelector('.p-avatar-file'); const urlEl=block.querySelector('.p-avatar-url'); const pv=block.querySelector('.p-preview');
  async function updatePreviewFromFile(f){ if(!f || !pv) return; const r=new FileReader(); r.onload=()=>{ pv.textContent='已选择头像'; pv.innerHTML='预览：<img src="'+r.result+'" alt="" style="height:36px;border-radius:6px;margin-left:6px;vertical-align:middle">'; }; r.readAsDataURL(f); }
  fileEl?.addEventListener('change',()=>updatePreviewFromFile(fileEl.files?.[0]));
  urlEl?.addEventListener('input',()=>{ if(!pv) return; if(urlEl.value.trim()){ pv.innerHTML='预览：<img src="'+urlEl.value.trim()+'" alt="" style="height:36px;border-radius:6px;margin-left:6px;vertical-align:middle">'; } else { pv.textContent='（未选择）'; } });
});


// ===== Rebind utilities to avoid duplicate event listeners =====
function rebindById(id){ const el=document.getElementById(id); if(!el||!el.parentNode) return el; const neo=el.cloneNode(true); el.parentNode.replaceChild(neo, el); return neo; }
function rebindEl(el){ if(!el||!el.parentNode) return el; const neo=el.cloneNode(true); el.parentNode.replaceChild(neo, el); return neo; }

// ===== Mood actions (single-binded) =====
(function(){
  const saveBtn = rebindById('saveMood');
  const cancelBtn = rebindById('cancelEditMood');
  const today = rebindById('todayList');
  const tags = rebindById('tagChips');

  // chips
  tags?.addEventListener('click',(e)=>{
    const t=e.target.closest('.chip'); if(!t) return;
    const name=t.dataset.tag;
    if(chosenTags.has(name)){ chosenTags.delete(name); t.classList.remove('on'); }
    else { chosenTags.add(name); t.classList.add('on'); }
  });

  // save / edit
  saveBtn?.addEventListener('click', async ()=>{
    const payload={ date:dateInput.value||todayStr(), time:timeInput.value||timeStr(), rating:+moodRange.value, tags:[...chosenTags], note:noteInput.value.trim(), updatedAt:new Date().toISOString() };
    if(!cancelEditMood.hidden){
      await updateMood(Number(cancelEditMood.dataset.id), payload);
      cancelEditMood.hidden=true; cancelEditMood.dataset.id=''; saveBtn.textContent='保存记录';
      autoNow.checked=true; autoNowToggle(true);
    }else{
      payload.createdAt=new Date().toISOString();
      await addMood(payload);
    }
    noteInput.value=''; chosenTags.clear(); document.querySelectorAll('.chip.on').forEach(c=>c.classList.remove('on'));
    await renderToday(); // removed duplicate renderCalendar init call
  });

  // cancel
  cancelBtn?.addEventListener('click',()=>{
    cancelEditMood.hidden=true; cancelEditMood.dataset.id=''; saveBtn.textContent='保存记录';
    noteInput.value=''; chosenTags.clear(); document.querySelectorAll('.chip.on').forEach(c=>c.classList.remove('on'));
    autoNow.checked=true; autoNowToggle(true);
  });

  // today list actions
  today?.addEventListener('click', async (e)=>{
    const b=e.target.closest('button'); if(!b) return;
    const id=+b.dataset.id; const act=b.dataset.act;
    if(act==='del'){ if(confirm('删除这条心情记录？')){ await delMood(id); await renderToday(); try{ renderCalendar(); }catch(e){} } }
    if(act==='edit'){
      const db=await openDB(); const s=tx(db,STORES.moods); const req=s.get(id);
      req.onsuccess=()=>{ const rec=req.result; if(!rec) return;
        dateInput.value=rec.date; timeInput.value=rec.time; moodRange.value=rec.rating; moodValue.textContent=moodRange.value; moodFace.textContent=face(moodRange.value);
        chosenTags.clear(); document.querySelectorAll('.chip.on').forEach(c=>c.classList.remove('on'));
        (rec.tags||[]).forEach(t=>{ const el=[...tags.querySelectorAll('.chip')].find(x=>x.dataset.tag===t); if(el){ el.classList.add('on'); chosenTags.add(t);} });
        noteInput.value=rec.note||''; cancelEditMood.hidden=false; cancelEditMood.dataset.id=String(id); saveBtn.textContent='保存修改';
        autoNow.checked=false; autoNowToggle(false);
      };
    }
  });
})();


// ===== Periods (menstruation) & Calendar nav =====
const PREV=document.getElementById('prevMonth');
const NEXT=document.getElementById('nextMonth');
const PERIOD_TOGGLE=document.getElementById('periodToggle');
const CARE_EL=document.getElementById('periodCare');
const CAT_ICON_URL='cat_head_nobg.png';

let __calFocus = new Date();
let __periodMode = false;

function ymOf(d){ return d.slice(0,7); }
async function period_set(dateStr, on){
  const db=await openDB();
  return new Promise((res,rej)=>{
    const s=tx(db,'periods','readwrite');
    if(on){
      const rec={date:dateStr, ym:ymOf(dateStr), createdAt:new Date().toISOString()};
      const r=s.put(rec); r.onsuccess=res; r.onerror=()=>rej(r.error);
    }else{
      const r=s.delete(dateStr); r.onsuccess=res; r.onerror=()=>rej(r.error);
    }
  });
}
async function period_has(dateStr){
  const db=await openDB();
  return new Promise((res,rej)=>{
    const s=tx(db,'periods','readonly'); const r=s.get(dateStr);
    r.onsuccess=()=>res(!!r.result); r.onerror=()=>rej(r.error);
  });
}
async function period_list_month(y,m){
  const ym = `${y}-${String(m).padStart(2,'0')}`;
  const db=await openDB();
  return new Promise((res,rej)=>{
    const s=tx(db,'periods','readonly');
    const idx=s.index ? s.index('byMonth') : null;
    if(idx){
      const req=idx.getAll(IDBKeyRange.only(ym));
      req.onsuccess=()=>res(req.result||[]);
      req.onerror=()=>rej(req.error);
    }else{
      const req=s.getAll();
      req.onsuccess=()=>res((req.result||[]).filter(x=>x && x.ym===ym));
      req.onerror=()=>rej(req.error);
    }
  });
}

const careLines=[
  "今天多喝温热的水，肚子不舒服就让我来抱着你。",
  "别硬撑，累了就停一会儿，我在你身边。",
  "铁元素会流失，记得吃点红肉或红枣，今晚我给你做。",
  "腰酸我来按，力度你说了算。",
  "如果情绪有点起伏，那很正常，让我做你的缓冲带。",
  "腹部热敷二十分钟，疼痛会缓一些，我来计时。",
  "别担心运动量，轻松散个步就好，剩下的交给我。",
  "今天不安排高强度的事，你只要被好好照顾。",
  "多补充水分和电解质，热可可我已经端上来。",
  "若想亲密，我们按你的节奏与舒适度来，一切以你为先。",
  "睡不稳就靠在我肩上，我给你数呼吸。",
  "如果疼得想骂人，就对我发火吧，我在这儿接住。",
  "注意保暖，脚踝也别忘了，我替你把毯子铺好。",
  "今天由我掌勺，你只负责可爱。",
  "任何时候不舒服，给我一个眼神就好，其余我都安排。"
];
function showCareLine(visible){
  if(!CARE_EL) return;
  if(!visible){ CARE_EL.textContent=''; return; }
  CARE_EL.textContent = "苍夜：" + careLines[Math.floor(Math.random()*careLines.length)];
}

// Hook prev/next month
PREV?.addEventListener('click', async ()=>{
  __calFocus = new Date(__calFocus.getFullYear(), __calFocus.getMonth()-1, 1);
  await renderCalendar(__calFocus);
});
NEXT?.addEventListener('click', async ()=>{
  __calFocus = new Date(__calFocus.getFullYear(), __calFocus.getMonth()+1, 1);
  await renderCalendar(__calFocus);
});
PERIOD_TOGGLE?.addEventListener('click', ()=>{
  __periodMode = !__periodMode;
  PERIOD_TOGGLE.classList.toggle('primary', __periodMode);
  PERIOD_TOGGLE.textContent = __periodMode ? '退出经期记录' : '经期记录模式';
});


// ===== Calendar: replace node to drop stale listeners, single renderer with heat & click =====
(function(){
  const old = document.getElementById('calendarGrid');
  if(!old) return;
  const fresh = old.cloneNode(false);
  old.parentNode.replaceChild(fresh, old);
  const grid = fresh;

  function pad(n){ return String(n).padStart(2,'0'); }

  async function computeWeights(y,m){
    const db=await openDB(); const s=tx(db,STORES.moods); const r=s.getAll();
    const all=await new Promise((res,rej)=>{ r.onsuccess=()=>res(r.result||[]); r.onerror=()=>rej(r.error); });
    const weights={}; let max=1;
    const noteSet = new Set();

    for(let d=1; d<=new Date(y,m,0).getDate(); d++){ weights[`${y}-${pad(m)}-${pad(d)}`]=0; }
    for(const it of all){
      if(!it.date) continue;
      const [yy,mm,dd]=it.date.split('-').map(x=>+x);
      if(yy===y && mm===m){
        const key=`${y}-${pad(m)}-${pad(dd)}`;
        weights[key]=(weights[key]||0) + (it.rating||0);
        if(weights[key]>max) max=weights[key];
        if((it.note||'').trim()){ noteSet.add(key); }
      }
    }
    return {weights,max,noteSet};
  }

  window.renderCalendar = async function renderCalendar(targetDate=new Date()){  
    __calFocus = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const y=targetDate.getFullYear(), m=targetDate.getMonth()+1;
    grid.innerHTML='';

    const first=new Date(y,m-1,1), firstDow=(first.getDay()+6)%7, days=new Date(y,m,0).getDate();
    const {weights,max,noteSet} = await computeWeights(y,m);
    window.__noteSetForMonth = noteSet;
    const periodArr = await period_list_month(y,m);
    const periodSet = new Set(periodArr.map(x=>x.date));

    for(let i=0;i<firstDow;i++){ const e=document.createElement('div'); e.className='cell'; grid.appendChild(e); }
    for(let d=1; d<=days; d++){  
      const key=`${y}-${pad(m)}-${pad(d)}`;
      const cell=document.createElement('div'); cell.className='cell'; cell.dataset.date=key;
      const heat=document.createElement('div'); heat.className='heat';
      const ratio=max>0 ? (weights[key]/max) : 0;
      heat.style.background = 'transparent';
      if (key === todayStr()) { heat.style.background = 'var(--accent)'; heat.style.opacity = '0.35'; }
      const day=document.createElement('div'); day.className='d'; day.textContent=String(d);
      cell.appendChild(heat); cell.appendChild(day);

      if(periodSet.has(key)){  
        const img=document.createElement('img');
        img.className='period-mark';
        img.alt='.';
        img.src=CAT_ICON_URL;
        cell.appendChild(img);
      }
      if(noteSet && noteSet.has(key)){ cell.classList.add('note-strong'); }
      grid.appendChild(cell);
    }
    showCareLine(periodArr && periodArr.length>0);
  };

  grid.addEventListener('click', async (e)=>{ 
    const cell=e.target.closest('.cell'); if(!cell || !cell.dataset.date) return;
    const ds=cell.dataset.date;
    if(__periodMode){
      const has = await period_has(ds);
      await period_set(ds, !has);
      await renderCalendar(__calFocus);
      return;
    }
    // Only open bubble when that day actually has notes
    if(!(window.__noteSetForMonth && window.__noteSetForMonth.has(ds))){ return; }
    const dateInputEl=document.getElementById('dateInput');
    if(dateInputEl) dateInputEl.value=ds;
    try{ await openDayNotesDialog(ds, cell); }catch(e){}});

  renderCalendar();
})();
;


// ===== Themes panel (two-pane like All Chats) =====
(function(){
  const sidebar = document.getElementById('themeSidebar');
  const listHost = document.getElementById('themeList');
  const btnNewTheme = document.getElementById('tNewTheme');
  const btnNewFolder = document.getElementById('tNewFolder');
  const btnClassify = document.getElementById('tClassify');
  const btnSelectToggle = document.getElementById('tSelectToggle');
  const titleEl = document.getElementById('activeThemeTitle');
  const btnRenameTheme = document.getElementById('renameThemeBtn');
  const btnDeleteTheme = document.getElementById('deleteThemeBtn');
  const btnReorder = document.getElementById('reorderClipsBtn');
  const stage = document.getElementById('themeStage');
  const prevBtn = document.getElementById('prevClip');
  const nextBtn = document.getElementById('nextClip');
  const clipViewport = document.getElementById('clipViewport');
  const clipContent = document.getElementById('clipContent');
  const clipMeta = document.getElementById('clipMeta');

  if(!listHost) return; // not on this page

  let selecting=false;
  let selected = new Set();
  let activeThemeId = null;
  let activeClips = [];
  let clipIndex = 0;

  function escapeHtml(s){ return (s||'').replace(/[<>&]/g, c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])); }

  function sortClips(arr){
    // Prefer explicit 'order' if present; otherwise fall back to createdAt (oldest first)
    arr.sort((a,b)=>{
      const ao = (typeof a.order === 'number') ? a.order : (Number.isFinite(+a.order) ? +a.order : Infinity);
      const bo = (typeof b.order === 'number') ? b.order : (Number.isFinite(+b.order) ? +b.order : Infinity);
      if(ao !== bo) return ao - bo;
      const ad=a.createdAt||'', bd=b.createdAt||'';
      const cmp = ad.localeCompare(bd);
      if(cmp!==0) return cmp;
      return (a.id||0) - (b.id||0);
    });
    return arr;
  }

  async function listThemes(){
    const all = await clips_get_all();
    return all.filter(x=>x && x.kind==='theme').sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));
  }
  async function clipsOfTheme(tid){
    const all = await clips_get_all();
    return sortClips(all.filter(x=>x && x.kind==='clip' && Number(x.themeId)===Number(tid)));
  }

  function themeItemRow(t, count){
    const checked = selected.has(t.id) ? 'checked' : '';
    const ckStyle = selecting ? '' : 'style="display:none"';
    return `<div class="item" data-tid="${t.id}">
      <div class="theme-item-row">
        <div class="name-line">
          <input type="checkbox" class="t-check" ${ckStyle} ${checked}>
          <div><strong>${escapeHtml(t.title||'未命名剪藏')}</strong> <span class="tiny muted">· ${count} 条</span></div>
        </div>
        <div class="row compact actions">
          <button class="ghost" data-act="open">打开</button>
          <button class="ghost" data-act="rename">重命名</button>
          <button class="danger" data-act="delete">删除</button>
        </div>
      </div>
    </div>`;
  }

  async function buildSidebar(){
    const themes = await listThemes();
    const groups = await getThemeGroups();
    const all = await clips_get_all();

    const byGroup = new Map();
    const ungrouped = [];
    for(const t of themes){
      const gArr = Array.isArray(t.groups)?t.groups:[];
      if(!gArr.length){ ungrouped.push(t); continue; }
      for(const gid of gArr){
        if(!byGroup.has(gid)) byGroup.set(gid,[]);
        byGroup.get(gid).push(t);
      }
    }

    let html='';
    for(const g of groups){
      const items = (byGroup.get(g.id)||[]).map(t=>{
        const count = all.filter(x=>x.kind==='clip' && Number(x.themeId)===Number(t.id)).length;
        return themeItemRow(t, count);
      }).join('') || `<div class="muted tiny">（空）</div>`;

      html += `<div class="group-block" data-gid="${g.id}">
        <div class="theme-group-head">
          <div class="group-title"><strong>${escapeHtml(g.name)}</strong></div>
          <div class="actions">
            <button class="ghost" data-act="g-rename" data-id="${g.id}">重命名</button>
            <button class="danger" data-act="g-del" data-id="${g.id}">删除</button>
          </div>
        </div>
        <div class="group-items">${items}</div>
      </div>`;
    }

    html += `<div class="group-block" data-gid="ungrouped">
      <div class="theme-group-head"><div class="group-title">未分组</div></div>
      <div class="group-items">` + (ungrouped.map(t=>{
        const count = all.filter(x=>x.kind==='clip' && Number(x.themeId)===Number(t.id)).length;
        return themeItemRow(t, count);
      }).join('') || `<div class="muted tiny">（暂无剪藏）</div>`) + `</div>
    </div>`;

    listHost.innerHTML = html;
    setTimeout(wireThemeDropTargets, 0);

    // wire theme item actions
    listHost.querySelectorAll('.item').forEach(block=>{
      const tid = Number(block.dataset.tid);
      const ck = block.querySelector('.t-check');
      if(ck){ ck.addEventListener('change',()=>{ if(ck.checked) selected.add(tid); else selected.delete(tid); updateClassifyBtn(); }); }
      block.querySelectorAll('button').forEach(btn=>btn.addEventListener('click', async ()=>{
        const act = btn.dataset.act;
        if(act==='open'){ openTheme(tid); }
        if(act==='rename'){ const all = await clips_get_all(); const t=all.find(x=>x.id===tid && x.kind==='theme'); if(!t) return; const nn=prompt('新的剪藏名', t.title||''); if(nn && nn.trim()){ t.title=nn.trim(); t.updatedAt=new Date().toISOString(); await clips_put_item(t); await buildSidebar(); if(activeThemeId===tid){ titleEl.textContent=t.title; } } }
        if(act==='delete'){ if(!confirm('删除该剪藏及其所有剪藏？')) return; const all = await clips_get_all(); const toDel = all.filter(x=> (x.id===tid && x.kind==='theme') || (x.kind==='clip' && Number(x.themeId)===tid)); for(const r of toDel){ await clips_del_item(r.id); } if(activeThemeId===tid){ activeThemeId=null; activeClips=[]; titleEl.textContent='选择一个剪藏'; btnRenameTheme.disabled=true; btnDeleteTheme.disabled=true; renderClip(-1); } await buildSidebar(); }
      }));
    });

    // wire group actions
    listHost.querySelectorAll('button[data-act="g-rename"]').forEach(btn=>btn.addEventListener('click', async ()=>{
      const id=+btn.dataset.id; const groups=await getThemeGroups(); const g=groups.find(x=>x.id===id); if(!g) return;
      const nn=prompt('新的文件夹名', g.name); if(nn && nn.trim()){ await updateThemeGroup(id,{name:nn.trim()}); await buildSidebar(); }
    }));
    listHost.querySelectorAll('button[data-act="g-del"]').forEach(btn=>btn.addEventListener('click', async ()=>{
      const id=+btn.dataset.id; if(!confirm('删除该文件夹（剪藏不会被删除）？')) return; const themes=await listThemes(); for(const t of themes){ const arr=Array.isArray(t.groups)?t.groups:[]; const nx=arr.filter(gid=>gid!==id); if(nx.length!==arr.length){ t.groups=nx; await clips_put_item(t); } } await delThemeGroup(id); await buildSidebar();
    }));
  }

  function updateClassifyBtn(){ btnClassify.disabled = selected.size===0; }

  btnNewTheme?.addEventListener('click', async ()=>{
    const name = prompt('新剪藏名称'); if(!name) return;
    const now = new Date().toISOString();
    await clips_add_item({ kind:'theme', title:name.trim(), createdAt:now, updatedAt:now, count:0, groups:[] });
    await buildSidebar();
  });

  btnNewFolder?.addEventListener('click', async ()=>{
    const name = prompt('文件夹名'); if(!name) return;
    await addThemeGroup(name.trim());
    await buildSidebar();
  });

  btnSelectToggle?.addEventListener('click', ()=>{
    selecting = !selecting;
    document.body.classList.toggle('selecting', selecting);
    btnSelectToggle.textContent = selecting ? '退出多选' : '多选';
    selected.clear();
    buildSidebar().then(updateClassifyBtn);
  });

  btnClassify?.addEventListener('click', async ()=>{
    if(selected.size===0) return;
    const groups=await getThemeGroups();
    const existing = groups.map(g=>g.name).join('、') || '（暂无）';
    const names = prompt('归类到文件夹（可用逗号分隔，留空=清空）\n已有：' + existing, '');
    if(names===null) return;
    const wanted = (names||'').split(/[，,]/).map(s=>s.trim()).filter(Boolean);
    const ensured=[];
    for(const nm of wanted){
      let g=(await getThemeGroups()).find(x=>x.name===nm);
      if(!g){ const id=await addThemeGroup(nm); g={id,name:nm}; }
      ensured.push(g.id);
    }
    const all = await clips_get_all();
    for(const tid of selected){
      const t = all.find(x=>x.id===tid && x.kind==='theme');
      if(!t) continue;
      t.groups = ensured;
      t.updatedAt = new Date().toISOString();
      await clips_put_item(t);
    }
    selected.clear();
    await buildSidebar(); updateClassifyBtn();
  });

  async function openTheme(tid){
    activeThemeId = tid;
    const all = await clips_get_all();
    const t = all.find(x=>x.id===tid && x.kind==='theme');
    titleEl.textContent = t?.title || '剪藏';
    btnRenameTheme.disabled=false; btnDeleteTheme.disabled=false; if(btnReorder) btnReorder.disabled=false;
    activeClips = await clipsOfTheme(tid);
    clipIndex = 0;
    renderClip(clipIndex);
    setClipContentDragSource();
    wireThemeDropTargets();
    enableLongPressMove();
  }

  btnRenameTheme?.addEventListener('click', async ()=>{
    if(!activeThemeId) return;
    const all = await clips_get_all(); const t=all.find(x=>x.id===activeThemeId && x.kind==='theme'); if(!t) return;
    const nn=prompt('新的剪藏名', t.title||''); if(nn && nn.trim()){ t.title=nn.trim(); t.updatedAt=new Date().toISOString(); await clips_put_item(t); titleEl.textContent=t.title; await buildSidebar(); }
  });
  btnDeleteTheme?.addEventListener('click', async ()=>{
    if(!activeThemeId) return;
    if(!confirm('删除该剪藏及其所有剪藏？')) return;
    const all = await clips_get_all();
    const toDel = all.filter(x=> (x.id===activeThemeId && x.kind==='theme') || (x.kind==='clip' && Number(x.themeId)===activeThemeId));
    for(const r of toDel){ await clips_del_item(r.id); }
    activeThemeId = null; activeClips = []; clipIndex=0; titleEl.textContent='选择一个剪藏'; btnRenameTheme.disabled=true; btnDeleteTheme.disabled=true; renderClip(-1);
    await buildSidebar();
  });

  function renderClip(idx){
  clipContent.innerHTML = '';
  prevBtn.disabled = false; nextBtn.disabled = false;
  if(idx<0 || !activeClips.length){
    clipContent.innerHTML = `<div class="theme-empty">（未选择剪藏，或该剪藏暂无内容）</div>`;
    clipMeta.textContent='';
    prevBtn.disabled = true; nextBtn.disabled = true;
    return;
  }
  if(idx<=0){ prevBtn.disabled = true; }
  if(idx>=activeClips.length-1){ nextBtn.disabled = true; }

  const c = activeClips[idx];
  let inner = '';
  const bubbleOf = (who, text, ts)=>{
    return `<div class="msg left">
      <div class="avatar"></div>
      <div class="bubble-col">
        <div class="meta-top">${escapeHtml(who||'')}</div>
        <div class="bubble">${escapeHtml(text||'')}</div>
        <div class="meta-bottom">${escapeHtml(ts||'')}</div>
      </div>
    </div>`;
  };

  if(c.text && String(c.text).trim()){
    inner = bubbleOf('片段', String(c.text).trim(), '');
  } else {
    const msgs = Array.isArray(c.msgs)?c.msgs:[];
    if(!msgs.length){
      inner = `<div class="muted tiny">(空剪藏)</div>`;
    } else {
      inner = msgs.map(m=>bubbleOf((m.who||'').trim(), (m.text||'').trim(), (m.ts||'').trim())).join('');
    }
  }
  clipContent.innerHTML = inner;
  const when = c.createdAt ? new Date(c.createdAt).toLocaleString() : '';
  clipMeta.innerHTML = `<span class="tiny badge">${idx+1}/${activeClips.length}</span> <span class="tiny muted" style="margin-left:8px">${when}</span>`;
  setClipContentDragSource();
}
  


  // --- Reorder dialog & move helpers ---
  function ensureReorderDialog(){
    let d = document.querySelector('dialog.reorder-dialog');
    if(!d){
      d = document.createElement('dialog');
      d.className = 'reorder-dialog';
      d.innerHTML = '<form method="dialog" class="reorder-body">'+
        '<h3>重新排序</h3>'+
        '<div class="reorder-thumbs" id="reorderThumbs"></div>'+
        '<menu class="actions" style="padding-top:8px">'+
          '<button value="cancel">取消</button>'+
          '<button id="saveOrderBtn" class="primary">保存顺序</button>'+
        '</menu>'+
      '</form>';
      document.body.appendChild(d);
    }
    return d;
  }
  function clipPreviewOne(c){
    if(c && c.text && String(c.text).trim()){
      return (String(c.text).trim()).slice(0, 40);
    }
    const msgs = Array.isArray(c.msgs)?c.msgs:[];
    if(!msgs.length) return '(空)';
    const m = msgs[0];
    const who = (m.who||'').trim();
    const t = (m.text||'').trim();
    return (who ? (who+'：') : '') + t.slice(0, 40);
  }
  function enableDragForThumb(el){
    el.setAttribute('draggable', 'true');
    el.addEventListener('dragstart', (e)=>{
      el.classList.add('dragging');
      e.dataTransfer.setData('text/plain', el.dataset.cid||'');
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragend', ()=> el.classList.remove('dragging'));
    el.addEventListener('dragover', (e)=>{ e.preventDefault(); el.classList.add('over'); e.dataTransfer.dropEffect = 'move'; });
    el.addEventListener('dragleave', ()=> el.classList.remove('over'));
    el.addEventListener('drop', (e)=>{
      e.preventDefault();
      el.classList.remove('over');
      const srcId = Number(e.dataTransfer.getData('text/plain')||0);
      const dstId = Number(el.dataset.cid||0);
      if(!srcId || !dstId || srcId===dstId) return;
      const sIdx = activeClips.findIndex(x=>Number(x.id)===srcId);
      const dIdx = activeClips.findIndex(x=>Number(x.id)===dstId);
      if(sIdx<0 || dIdx<0) return;
      const moved = activeClips.splice(sIdx, 1)[0];
      activeClips.splice(dIdx, 0, moved);
      buildThumbs();
    });
  }
  function buildThumbs(){
    const box = document.getElementById('reorderThumbs');
    if(!box) return;
    box.innerHTML = activeClips.map((c,i)=>'<div class="clip-thumb" data-cid="'+c.id+'">'+
      '<span class="idx">#'+(i+1)+'</span>'+
      '<div class="prev">'+clipPreviewOne(c)+'</div>'+
    '</div>').join('');
    box.querySelectorAll('.clip-thumb').forEach(enableDragForThumb);
  }
  async function saveOrder(){
    const all = await clips_get_all();
    const map = new Map(all.map(x=>[x.id, x]));
    let i = 0;
    for(const c of activeClips){
      const row = map.get(c.id);
      if(!row) continue;
      row.order = (++i);
      row.updatedAt = new Date().toISOString();
      await clips_put_item(row);
    }
    const t = all.find(x=>x.id===activeThemeId && x.kind==='theme');
    if(t){ t.updatedAt = new Date().toISOString(); await clips_put_item(t); }
    activeClips = await clipsOfTheme(activeThemeId);
    clipIndex = Math.min(clipIndex, Math.max(0, activeClips.length-1));
    renderClip(clipIndex);
  }
  async function openReorderDialog(){
    if(!activeThemeId){ return; }
    activeClips = await clipsOfTheme(activeThemeId);
    const d = ensureReorderDialog();
    buildThumbs();
    if(!d.open) d.showModal();
    const saveBtn = d.querySelector('#saveOrderBtn');
    saveBtn.onclick = async (e)=>{ e.preventDefault(); await saveOrder(); d.close(); };
  }
  function setClipContentDragSource(){
    if(!clipContent) return;
    clipContent.setAttribute('draggable', activeClips && activeClips[clipIndex] ? 'true' : 'false');
    clipContent.addEventListener('dragstart', (e)=>{
      const c = activeClips[clipIndex];
      if(!c){ e.preventDefault(); return; }
      e.dataTransfer.setData('text/clip-id', String(c.id));
      e.dataTransfer.effectAllowed = 'move';
    });
  }
  function wireThemeDropTargets(){
    const items = listHost.querySelectorAll('.item');
    items.forEach(it=>{
      const tid = Number(it.dataset.tid||0);
      if(!tid) return;
      it.addEventListener('dragover', (e)=>{
        if(!e.dataTransfer) return;
        if(!Array.from(e.dataTransfer.types||[]).includes('text/clip-id')) return;
        e.preventDefault(); it.classList.add('drop-target');
      });
      it.addEventListener('dragleave', ()=> it.classList.remove('drop-target'));
      it.addEventListener('drop', async (e)=>{
        it.classList.remove('drop-target');
        const cid = Number(e.dataTransfer.getData('text/clip-id')||0);
        if(!cid) return;
        const all = await clips_get_all();
        const c = all.find(x=>x.id===cid && x.kind==='clip'); if(!c) return;
        const oldTid = Number(c.themeId);
        if(oldTid === tid) return;
        c.themeId = tid; c.updatedAt = new Date().toISOString(); await clips_put_item(c);
        const from = all.find(x=>x.id===oldTid && x.kind==='theme');
        const to = all.find(x=>x.id===tid && x.kind==='theme');
        if(from && typeof from.count==='number' && from.count>0){ from.count -= 1; from.updatedAt = new Date().toISOString(); await clips_put_item(from); }
        if(to){ to.count = (to.count||0) + 1; to.updatedAt = new Date().toISOString(); await clips_put_item(to); }
        await buildSidebar();
        if(activeThemeId === oldTid){
          activeClips = await clipsOfTheme(oldTid);
          clipIndex = Math.min(clipIndex, Math.max(0, activeClips.length-1));
          renderClip(clipIndex);
        }
      });
    });
  }
  function ensureMoveDialog(){
    let d = document.querySelector('dialog.move-dialog');
    if(!d){
      d = document.createElement('dialog');
      d.className = 'move-dialog';
      d.innerHTML = '<form method="dialog" class="move-body">'+
        '<h3>移动到…</h3>'+
        '<div class="move-list" id="moveList"></div>'+
        '<menu class="actions" style="padding-top:8px"><button value="cancel">取消</button></menu>'+
      '</form>';
      document.body.appendChild(d);
    }
    return d;
  }
  async function openMoveDialogForClip(cid){
    const d = ensureMoveDialog();
    const themes = await listThemes();
    const items = themes.map(t=>'<div class="item" data-tid="'+t.id+'"><strong>'+ (t.title||'未命名剪藏') +'</strong></div>').join('') || '<div class="muted tiny">暂无剪藏</div>';
    d.querySelector('#moveList').innerHTML = items;
    d.querySelectorAll('.item').forEach(el=> el.addEventListener('click', async ()=>{
      const tid = Number(el.dataset.tid||0); if(!tid) return;
      const all = await clips_get_all();
      const c = all.find(x=>x.id===cid && x.kind==='clip'); if(!c) return;
      const oldTid = Number(c.themeId);
      if(oldTid === tid){ d.close(); return; }
      c.themeId = tid; c.updatedAt = new Date().toISOString(); await clips_put_item(c);
      const from = all.find(x=>x.id===oldTid && x.kind==='theme');
      const to = all.find(x=>x.id===tid && x.kind==='theme');
      if(from && typeof from.count==='number' && from.count>0){ from.count -= 1; from.updatedAt = new Date().toISOString(); await clips_put_item(from); }
      if(to){ to.count = (to.count||0) + 1; to.updatedAt = new Date().toISOString(); await clips_put_item(to); }
      d.close();
      await buildSidebar();
      if(activeThemeId === oldTid){
        activeClips = await clipsOfTheme(oldTid);
        clipIndex = Math.min(clipIndex, Math.max(0, activeClips.length-1));
        renderClip(clipIndex);
      }
    }));
    if(!d.open) d.showModal();
  }
  function enableLongPressMove(){
    if(!clipContent) return;
    let timer = null, pressed=false;
    function clear(){ pressed=false; if(timer){ clearTimeout(timer); timer=null; } }
    clipContent.addEventListener('pointerdown', ()=>{
      if(pressed) return;
      pressed = true;
      timer = setTimeout(()=>{
        const c = activeClips[clipIndex];
        if(c){ openMoveDialogForClip(Number(c.id)); }
      }, 650);
    });
    clipContent.addEventListener('pointerup', clear);
    clipContent.addEventListener('pointerleave', clear);
  }
  if(btnReorder){ btnReorder.onclick = openReorderDialog; }

  prevBtn?.addEventListener('click',()=>{ if(clipIndex>0){ clipIndex--; renderClip(clipIndex); } });
  nextBtn?.addEventListener('click',()=>{ if(clipIndex<activeClips.length-1){ clipIndex++; renderClip(clipIndex); } });
  // keyboard arrows
  window.addEventListener('keydown',(e)=>{ if(!document.getElementById('clips')?.classList.contains('active')) return; if(e.key==='ArrowLeft'){ if(clipIndex>0){ clipIndex--; renderClip(clipIndex); } } if(e.key==='ArrowRight'){ if(clipIndex<activeClips.length-1){ clipIndex++; renderClip(clipIndex); } } });

  // initial load
  buildSidebar();
})();



// ===== Split Anniv/Countdown — robust overrides & renderers =====
(function(){
  if(window.__datesSplitInitialized) return;
  window.__datesSplitInitialized = true;

  const annivAddBtn = document.getElementById('annivAddBtn');
  const aTitle = document.getElementById('aTitle');
  const aDate = document.getElementById('aDate');
  const aRepeat = document.getElementById('aRepeat');
  const annivList = document.getElementById('annivList');

  const countdownAddBtn = document.getElementById('countdownAddBtn');
  const cTitle = document.getElementById('cTitle');
  const cDate = document.getElementById('cDate');
  const countdownList = document.getElementById('countdownList');

  // --- safe overrides (later definitions take precedence) ---
  window.addDateItem = async function(rec){
    const db = await openDB();
    return new Promise((res, rej)=>{
      const s = tx(db, STORES.dates, 'readwrite');
      const payload = {
        title: (rec && rec.title) ? String(rec.title) : '',
        date: (rec && rec.date) ? String(rec.date) : '',
        repeat: (rec && rec.repeat) ? String(rec.repeat) : 'none',
        type: (rec && rec.type) ? String(rec.type) : 'anniv',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const r = s.add(payload);
      r.onsuccess = ()=> res(r.result);
      r.onerror = ()=> rej(r.error);
    });
  };

  window.updateDateItem = async function(id, patch){
    const db = await openDB();
    return new Promise((res, rej)=>{
      const s = tx(db, STORES.dates, 'readwrite');
      const g = s.get(id);
      g.onsuccess = ()=>{
        const curr = g.result || {};
        const v = {
          ...curr,
          ...(patch||{}),
          title: (patch && 'title' in patch) ? String(patch.title||'') : curr.title,
          date: (patch && 'date' in patch) ? String(patch.date||'') : curr.date,
          repeat: (patch && 'repeat' in patch) ? String(patch.repeat||'none') : curr.repeat,
          type: (patch && 'type' in patch) ? String(patch.type||'anniv') : (curr.type||'anniv'),
          updatedAt: new Date().toISOString()
        };
        const p = s.put(v);
        p.onsuccess = ()=> res();
        p.onerror = ()=> rej(p.error);
      };
      g.onerror = ()=> rej(g.error);
    });
  };

  function pad2(n){ return String(n).padStart(2,'0'); }
  function nextAnnivDate(dateStr){
    const [y,m,d] = (dateStr||'').split('-').map(x=>+x||0);
    const now = new Date();
    const thisYear = now.getFullYear();
    let next = new Date(thisYear, (m||1)-1, d||1);
    const today = new Date(thisYear, now.getMonth(), now.getDate());
    if(next < today){ next = new Date(thisYear+1, (m||1)-1, d||1); }
    return `${next.getFullYear()}-${pad2(next.getMonth()+1)}-${pad2(next.getDate())}`;
  }

  async function renderAnnivs(){
    if(!annivList) return;
    const arr = (await getAllDates()).filter(x=> x?.type === 'anniv');
    arr.sort((a,b)=>{
      const aKey = a.repeat==='yearly' ? nextAnnivDate(a.date) : a.date;
      const bKey = b.repeat==='yearly' ? nextAnnivDate(b.date) : b.date;
      return String(aKey).localeCompare(String(bKey));
    });
    annivList.innerHTML = arr.map(d=>{
      const repeatLabel = d.repeat==='yearly' ? ' · 每年' : '';
      return `<div class="item">
        <div><strong>${(d.title||'(未命名)')}</strong> · <span class="muted">${d.date}${repeatLabel}</span></div>
        <div class="actions" style="margin-top:6px">
          <button data-act="edit" data-id="${d.id}">编辑</button>
          <button data-act="del" data-id="${d.id}" class="danger">删除</button>
        </div>
      </div>`;
    }).join('') || `<div class="muted tiny">还没有纪念日哦。</div>`;

    annivList.querySelectorAll('button').forEach(btn=>btn.addEventListener('click', async ()=>{
      const id=+btn.dataset.id; const act=btn.dataset.act;
      if(act==='del'){
        if(confirm('删除这个纪念日？')){ await delDateItem(id); await renderAnnivs(); }
      }
      if(act==='edit'){
        const all=await getAllDates(); const rec=all.find(x=>x.id===id);
        if(!rec) return;
        const nt = prompt('标题', rec.title||''); if(nt===null) return;
        const nd = prompt('日期（YYYY-MM-DD）', rec.date||''); if(nd===null) return;
        const rp = prompt('重复( none / yearly )', rec.repeat||'yearly');
        await updateDateItem(id,{ title:(nt||'').trim(), date:(nd||'').trim(), repeat:(rp==='none'?'none':'yearly'), type:'anniv' });
        await renderAnnivs();
      }
    }));
  }

  async function renderCountdowns(){
    if(!countdownList) return;
    const arr = (await getAllDates()).filter(x=> x?.type === 'countdown');
    arr.sort((a,b)=> String(a.date||'').localeCompare(String(b.date||'')));
    countdownList.innerHTML = arr.map(d=>{
  const dd = diffDays(d.date);
  const badge = dd===0 ? '今天' : (dd>0 ? `还有 ${dd} 天` : `已过 ${Math.abs(dd)} 天`);
  const passed = dd < 0 ? 'passed' : '';
  return `<div class="item">
    <div><strong class="ttl ${passed}">${(d.title||'(未命名)')}</strong> · <span class="muted">${d.date}</span></div>
    <div class="muted tiny">${badge}</div>
    <div class="actions" style="margin-top:6px">
      <button data-act="edit" data-id="${d.id}">编辑</button>
      <button data-act="del" data-id="${d.id}" class="danger">删除</button>
    </div>
  </div>`;
}).join('') || `<div class="muted tiny">还没有倒计时，去添加一个吧。</div>`;
countdownList.querySelectorAll('button').forEach(btn=>btn.addEventListener('click', async ()=>{
      const id=+btn.dataset.id; const act=btn.dataset.act;
      if(act==='del'){
        if(confirm('删除这个倒计时？')){ await delDateItem(id); await renderCountdowns(); }
      }
      if(act==='edit'){
        const all=await getAllDates(); const rec=all.find(x=>x.id===id);
        if(!rec) return;
        const nt = prompt('标题', rec.title||''); if(nt===null) return;
        const nd = prompt('日期（YYYY-MM-DD）', rec.date||''); if(nd===null) return;
        await updateDateItem(id,{ title:(nt||'').trim(), date:(nd||'').trim(), repeat:'none', type:'countdown' });
        await renderCountdowns();
      }
    }));
  }

  // Bind add buttons
  annivAddBtn && annivAddBtn.addEventListener('click', async ()=>{
    if(!aTitle.value.trim() || !aDate.value){ alert('请填写标题和日期'); return; }
    await addDateItem({ title:aTitle.value.trim(), date:aDate.value, repeat:(aRepeat?.value||'yearly'), type:'anniv' });
    aTitle.value=''; aDate.value='';
    await renderAnnivs();
  });
  countdownAddBtn && countdownAddBtn.addEventListener('click', async ()=>{
    if(!cTitle.value.trim() || !cDate.value){ alert('请填写标题和日期'); return; }
    await addDateItem({ title:cTitle.value.trim(), date:cDate.value, repeat:'none', type:'countdown' });
    cTitle.value=''; cDate.value='';
    await renderCountdowns();
  });

  // Initial render
  renderAnnivs(); renderCountdowns();

  // Month title
  const ymEl = document.getElementById('calendarYM');
  if(ymEl){
    const orig = window.renderCalendar;
    window.renderCalendar = async function(targetDate=new Date()){
      if(typeof orig === 'function'){ await orig(targetDate); }
      const y=targetDate.getFullYear(), m=targetDate.getMonth()+1;
      ymEl.textContent = ` · ${y}年${String(m).padStart(2,'0')}月`;
    };
    // refresh caption once
    ymEl.textContent = ` · ${new Date().getFullYear()}年${String(new Date().getMonth()+1).padStart(2,'0')}月`;
  }
})();


// === Sidebar Groups Mode (manage groups in sidebar only) ===

(function(){
  const SIDEBAR_MODE_KEY = 'sidebarMode';
  function setSidebarMode(mode){
    localStorage.setItem(SIDEBAR_MODE_KEY, mode);
    if(mode==='groups'){ document.body.classList.add('sidebar-groups-mode'); }
    else{ document.body.classList.remove('sidebar-groups-mode'); }
  }
  function getSidebarMode(){ return localStorage.getItem(SIDEBAR_MODE_KEY) || 'default'; }

  // render advanced groups panel (色块、线框、选中高亮、展开/收起、文件缩进 & 字号)
  async function renderGroupsPanel(){
    setSidebarMode('groups');
    const host = document.getElementById('allChatsList');
    if(!host) return;

    const groups = (await (typeof getGroups==='function'?getGroups:async()=>[] )()) || [];
    const files = (await (typeof getAllFiles==='function'?getAllFiles:async()=>[] )()) || [];

    // build helper: files under group id
    function filesInGroup(gid){
      return files.filter(f=> Array.isArray(f.groups) && f.groups.includes(gid))
                  .sort((a,b)=>(b.uploadedAt||'').localeCompare(a.uploadedAt||''));
    }

    let html = `<div class="groups-panel">
      <div class="panel-head">
        <div class="left">
          <button id="btnBackToChats" class="ghost small" title="返回默认侧栏">返回</button>
          <strong>所有分组</strong>
        </div>
        <div class="right">
          <button id="btnCreateGroup" class="ghost small">新建分组</button>
        </div>
      </div>`;

    if(!groups.length){
      html += `<div class="muted tiny" style="padding:10px">暂无分组，点击“新建分组”创建。</div></div>`;
      host.innerHTML = html;
    }else{
      for(const g of groups){
        const arr = filesInGroup(g.id);
        const collapsed = !!g.collapsed;
        html += `<div class="group-item ${collapsed?'collapsed':''}" data-id="${g.id}">
          <div class="group-head">
            <div class="left">
              <button class="fold" aria-label="${collapsed?'展开':'收起'}" aria-expanded="${collapsed?'false':'true'}"></button>
              <span class="gname">${(g.name||'未命名分组')}</span>
              <span class="tiny muted">· ${arr.length} 条</span>
            </div>
            <div class="ops">
              <button data-act="g-rename" data-id="${g.id}" class="ghost">重命名</button>
              <button data-act="g-del" data-id="${g.id}" class="danger">删除</button>
            </div>
          </div>
          <div class="group-files ${collapsed?'hidden':''}">` +
          (arr.map(f=>`<div class="file-row" data-id="${f.id}">
              <div class="fname">${f.name}</div>
              <div class="actions">
                <button data-act="open" data-id="${f.id}" class="ghost">打开</button>
                <button data-act="classify" data-id="${f.id}" class="ghost">归类</button>
                <button data-act="delete" data-id="${f.id}" class="danger">删除</button>
              </div>
            </div>`).join('') || `<div class="muted tiny">(空)</div>`) + `
          </div>
        </div>`;
      }
      html += `</div>`; // .groups-panel
      host.innerHTML = html;
    }

    // selection & toggle wiring
    let selectedId = null;
    function markSelection(){
      host.querySelectorAll('.group-item').forEach(el=>{
        el.classList.toggle('selected', String(el.dataset.id)===String(selectedId));
      });
    }

    host.querySelector('#btnBackToChats')?.addEventListener('click', ()=>{
      setSidebarMode('default');
      if(typeof buildSidebar==='function') buildSidebar();
    });

    host.querySelector('#btnCreateGroup')?.addEventListener('click', async ()=>{
      const name = prompt('输入新分组名称'); if(!name) return;
      if(typeof addGroup === 'function'){ await addGroup(name.trim()); }
      await renderGroupsPanel();
    });

    // group header interactions
    host.querySelectorAll('.group-item .group-head').forEach(head=>{
      const wrap = head.closest('.group-item');
      const gid = Number(wrap.dataset.id);
      // select on head click (but let fold button handle collapse)
      head.addEventListener('click',(e)=>{
        if(e.target.closest('.fold') || e.target.closest('button[data-act]')) return;
        selectedId = gid; markSelection();
      });
      head.querySelector('.fold')?.addEventListener('click', async (e)=>{
        e.stopPropagation();
        const gs = await getGroups(); const g = gs.find(x=>x.id===gid); if(!g) return;
        const next = !g.collapsed;
        await updateGroup(gid,{collapsed:next});
        // toggle UI
        wrap.classList.toggle('collapsed', next);
        const filesBox = wrap.querySelector('.group-files');
        if(filesBox){ filesBox.classList.toggle('hidden', next); }
      });
      // rename / delete
      head.querySelector('[data-act="g-rename"]')?.addEventListener('click', async (e)=>{
        e.stopPropagation();
        const gs = await getGroups(); const g = gs.find(x=>x.id===gid); if(!g) return;
        const nn = prompt('新的分组名', g.name||''); if(nn && nn.trim()){ await updateGroup(gid, {name: nn.trim()}); await renderGroupsPanel(); }
      });
      head.querySelector('[data-act="g-del"]')?.addEventListener('click', async (e)=>{
        e.stopPropagation();
        if(!confirm('删除该分组（文件不会被删除）？')) return;
        await delGroup(gid);
        await renderGroupsPanel();
      });
    });

    // file row actions
    host.querySelectorAll('.file-row .actions button').forEach(btn=>{
      btn.addEventListener('click', async (e)=>{
        e.stopPropagation();
        const id = +btn.dataset.id;
        const act = btn.dataset.act;
        const all2 = await getAllFiles();
        const f = all2.find(x=>x.id===id);
        if(!f) return;
        if(act==='open'){
          const activeChatTitle = document.getElementById('activeChatTitle');
          const activeChatBody = document.getElementById('activeChatBody');
          if(activeChatTitle) activeChatTitle.textContent = f.name;
          if(typeof parseChat==='function' && typeof renderChat==='function' && activeChatBody){
            const msgs = parseChat(f.content);
            await renderChat(msgs, activeChatBody);
          }
        }
        if(act==='classify'){
          if(typeof classifyFile==='function'){ await classifyFile(f); }
          await renderGroupsPanel();
        }
        if(act==='delete'){
          if(confirm('确定删除这个会话文件？此操作不可撤销')){
            await delFile(id);
            await renderGroupsPanel();
          }
        }
      });
    });

    markSelection();
  }
  window.renderGroupsPanel = renderGroupsPanel;

  // Wrap buildSidebar to enforce default-only ungrouped view (不改默认面板)
  const _origBuildSidebar = window.buildSidebar || buildSidebar;
  window.buildSidebar = buildSidebar = async function(){
    await _origBuildSidebar();
    const mode = getSidebarMode();
    if(mode==='groups'){ return; }
    const host = document.getElementById('allChatsList'); if(!host) return;
    // Remove any grouped content/nodes from default panel
    host.querySelectorAll('[data-group]').forEach(el=>el.remove());
    host.querySelectorAll('.item').forEach(el=>{
      const meta = el.querySelector('.meta');
      if(meta && meta.textContent && meta.textContent.trim()==='分组'){ el.remove(); return; }
      if(el.querySelector('[data-act="g-toggle"],[data-act="g-rename"],[data-act="g-del"]')){ el.remove(); }
    });
  };

  // Click: enter groups panel from default
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest && e.target.closest('#btnAllGroups');
    if(btn){
      localStorage.setItem(SIDEBAR_MODE_KEY,'groups');
      renderGroupsPanel();
    }
  });

  // On DOM ready, if mode=='groups' show panel
  document.addEventListener('DOMContentLoaded', ()=>{
    if(getSidebarMode()==='groups'){ renderGroupsPanel(); }
  });
})();


// === Global Music Player ===
(function(){
  function initMusic(){
    const audio = document.getElementById('globalAudio');
    if(!audio) return;
    const $ = (sel)=>document.querySelector(sel);

    const filesInput = $('#audioFiles');
    const loadBtn = $('#loadTracks');
    const listEl = $('#musicList');
    const playPauseBtn = $('#playPause');
    const prevBtn = $('#prevTrack');
    const nextBtn = $('#nextTrack');
    const seekBar = $('#seekBar');
    const timeLabel = $('#timeLabel');
    const volSlider = $('#volSlider');

    const state = window.__musicState__ = window.__musicState__ || {
      playlist: [], // {name, url, fileType}
      index: -1,
      playing: false,
      objectUrls: [] // to revoke on unload
    };

    function fmt(t){
      if(!isFinite(t)) return "00:00";
      const m = Math.floor(t/60), s=Math.floor(t%60);
      return String(m).padStart(2,'0') + ":" + String(s).padStart(2,'0');
    }

    function renderList(){
      if(!listEl) return;
      listEl.innerHTML = '';
      state.playlist.forEach((t, i)=>{
        const item = document.createElement('div');
        item.className = 'item';
        item.innerHTML = '<div><strong>'+ (t.name || ('曲目 ' + (i+1))) +'</strong></div>';
        item.addEventListener('click', ()=>{ playAt(i); });
        listEl.appendChild(item);
      });
    }

    function loadFiles(fileList){
      const files = Array.from(fileList || [])
        .filter(f => /^audio\//.test(f.type) || /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(f.name));
      if(!files.length) return;
      files.forEach(f=>{
        const url = URL.createObjectURL(f);
        state.objectUrls.push(url);
        state.playlist.push({name: f.name, url, fileType: f.type});
      });
      if(state.index===-1) state.index = 0;
      renderList();
      updateMsg(files.length + " 首已添加");
    }

    function updateMsg(text){
      const el = document.getElementById('musicMsg');
      if(el) { el.textContent = text; setTimeout(()=>{ if(el.textContent===text) el.textContent=''; }, 2000); }
    }

    function playAt(i){
      if(i<0 || i>=state.playlist.length) return;
      state.index = i;
      const trk = state.playlist[state.index];
      audio.src = trk.url;
      audio.play().catch(()=>{});
      state.playing = true;
      updatePlayIcon();
    }

    function updatePlayIcon(){
      if(!playPauseBtn) return;
      playPauseBtn.textContent = state.playing ? '⏸' : '▶';
    }

    function playPause(){
      if(state.index === -1 && state.playlist.length){ playAt(0); return; }
      if(!audio.src && state.index >= 0){ playAt(state.index); return; }
      if(audio.paused){ audio.play().catch(()=>{}); state.playing = true }
      else { audio.pause(); state.playing = false; }
      updatePlayIcon();
    }

    function next(){ if(state.playlist.length){ playAt((state.index+1)%state.playlist.length); } }
    function prev(){ if(state.playlist.length){ playAt((state.index-1+state.playlist.length)%state.playlist.length); } }

    function onTime(){
      if(seekBar && timeLabel && isFinite(audio.duration) && audio.duration>0){
        seekBar.value = Math.floor(audio.currentTime / audio.duration * 1000);
        timeLabel.textContent = fmt(audio.currentTime) + " / " + fmt(audio.duration);
      }else{
        if(seekBar) seekBar.value = 0;
        if(timeLabel) timeLabel.textContent = fmt(0) + " / 00:00";
      }
    }

    // Bind UI
    if(filesInput && loadBtn){
      loadBtn.addEventListener('click', ()=> loadFiles(filesInput.files));
    }
    if(playPauseBtn) playPauseBtn.addEventListener('click', playPause);
    if(nextBtn) nextBtn.addEventListener('click', next);
    if(prevBtn) prevBtn.addEventListener('click', prev);
    if(seekBar) seekBar.addEventListener('input', ()=>{
      if(isFinite(audio.duration) && audio.duration>0){
        audio.currentTime = (seekBar.value/1000)*audio.duration;
      }
    });
    if(volSlider){
      audio.volume = parseFloat(volSlider.value||"1");
      volSlider.addEventListener('input', ()=> audio.volume = parseFloat(volSlider.value||"1"));
    }

    // Audio events
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('durationchange', onTime);
    audio.addEventListener('play', ()=>{ state.playing = true; updatePlayIcon(); });
    audio.addEventListener('pause', ()=>{ state.playing = false; updatePlayIcon(); });
    audio.addEventListener('ended', next);

    window.addEventListener('beforeunload', ()=>{
      state.objectUrls.forEach(u=>URL.revokeObjectURL(u));
      state.objectUrls.length = 0;
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initMusic, {once:true});
  }else{
    initMusic();
  }
})();
// === End Music Player ===

window.addEventListener('load', ()=>{ try{ setTimeout(()=>renderToday(), 150); }catch(e){} });


// === Mobile drawer + safe-area/topbar sizing (iPhone-friendly) ===
(function(){
  function setTopbarHeightVar(){
    try{
      const tb = document.querySelector('.topbar');
      if(!tb) return;
      const h = Math.max(56, Math.round(tb.getBoundingClientRect().height));
      document.documentElement.style.setProperty('--topbar-h', h + 'px');
    }catch(e){}
  }
  setTopbarHeightVar();
  window.addEventListener('resize', setTopbarHeightVar);

  
function initMobileDrawer(asideId, toggleBtnId){
    const sidebar = document.getElementById(asideId); if(!sidebar) return;
    const toggleBtn = document.getElementById(toggleBtnId);
    const isNarrow = ()=> window.innerWidth <= 900;

    // Align the drawer's vertical bounds with the right-pane viewer on mobile.
    function alignToViewer(){
      try{
        if(!isNarrow()){ sidebar.style.top=''; sidebar.style.bottom=''; return; }
        if(!sidebar.classList.contains('open')) return;
        const host = sidebar.parentElement;
        let chatView = null;
        if(host) chatView = host.querySelector('.chat-view');
        if(!chatView) chatView = sidebar.nextElementSibling && sidebar.nextElementSibling.classList && sidebar.nextElementSibling.classList.contains('chat-view') ? sidebar.nextElementSibling : null;
        if(!chatView) return;
        const r = chatView.getBoundingClientRect();
        const top = Math.max(0, Math.round(r.top));
        const bottom = Math.max(0, Math.round(window.innerHeight - r.bottom));
        sidebar.style.top = top + 'px';
        sidebar.style.bottom = bottom + 'px';
      }catch(_){}
    }

    function open(){ sidebar.classList.add('open'); sidebar.classList.remove('closed'); alignToViewer(); }
    function close(){ sidebar.classList.remove('open'); sidebar.classList.add('closed'); }
    function toggle(){ (sidebar.classList.contains('open') ? close() : open()); }
    if(toggleBtn) toggleBtn.addEventListener('click', toggle);

    // default state by width
    function applyDefault(){
      if(isNarrow()){ close(); } else { open(); }
      alignToViewer();
    }
    applyDefault();
    window.addEventListener('resize', ()=>{ applyDefault(); alignToViewer(); });
    window.addEventListener('scroll', alignToViewer, { passive: true });

    // Edge-swipe gesture
    let startX=0, startY=0, tracking=false;
    document.addEventListener('touchstart', (e)=>{
      const t = e.touches && e.touches[0]; if(!t) return;
      startX = t.clientX; startY = t.clientY;
      const edge = startX < 24; // left edge
      const inside = sidebar.contains(document.elementFromPoint(startX, startY));
      tracking = edge || (inside && sidebar.classList.contains('open'));
    }, {passive:true});
    document.addEventListener('touchmove', (e)=>{
      if(!tracking) return;
      const t = e.touches && e.touches[0]; if(!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if(Math.abs(dx) > Math.abs(dy) * 1.4){
        // horizontal intent
        if(isNarrow()) e.preventDefault();
      }
    }, {passive:false});
    document.addEventListener('touchend', (e)=>{
      if(!tracking) return;
      const t = e.changedTouches && e.changedTouches[0]; if(!t) return;
      const dx = t.clientX - startX;
      if(!sidebar.classList.contains('open')){
        // closed -> open if swiped right from left edge
        if(startX < 24 && dx > 40){ open(); }
      }else{
        // open -> close on left swipe
        if(dx < -40){ close(); }
      }
      tracking = false;
      alignToViewer();
    });

    // click outside to close (narrow only)
    document.addEventListener('click', (e)=>{
      if(!isNarrow()) return;
      if(!sidebar.classList.contains('open')) return;
      const inside = sidebar.contains(e.target) || (toggleBtn && toggleBtn.contains(e.target));
      if(!inside) close();
    });
  }


  // init for All Chats & Clips
  initMobileDrawer('chatSidebar', 'toggleSidebar');
  initMobileDrawer('themeSidebar', 'toggleThemeSidebar');
})();

// === Day notes popover (bubble) ===
(function(){
  let __dayBubble = null;
  let __dayBubbleDate = null;
  let __outsideHandler = null;

  function closeDayBubble(){
    if(__dayBubble && __dayBubble.parentNode){
      __dayBubble.parentNode.removeChild(__dayBubble);
    }
    __dayBubble = null;
    __dayBubbleDate = null;
    if(__outsideHandler){
      document.removeEventListener('pointerdown', __outsideHandler, true);
      __outsideHandler = null;
    }
  }

  function placeBubble(anchor, bubble){
    const rect = anchor.getBoundingClientRect();
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = rect.top + window.scrollY - bh - 8; // default above
    let left = rect.left + window.scrollX + (rect.width/2 - bw/2);

    // if top overflow, place below
    if(top < window.scrollY + 8){
      top = rect.bottom + window.scrollY + 8;
      bubble.setAttribute('data-pos','below');
    }else{
      bubble.setAttribute('data-pos','above');
    }

    // clamp horizontally
    const minLeft = window.scrollX + 8;
    const maxLeft = window.scrollX + vw - bw - 8;
    if(left < minLeft) left = minLeft;
    if(left > maxLeft) left = maxLeft;

    
// compute arrow x (relative to popover left), clamped inside the bubble
try{
  const anchorCenterX = rect.left + window.scrollX + (rect.width/2);
  let arrowX = anchorCenterX - left; // px from bubble's left
  const minX = 12; // keep away from rounded corners
  const maxX = bw - 12;
  if (arrowX < minX) arrowX = minX;
  if (arrowX > maxX) arrowX = maxX;
  bubble.style.setProperty('--arrow-x', arrowX + 'px');
}catch(_){}
    bubble.style.top = `${top}px`;
    bubble.style.left = `${left}px`;
  }

  async function buildDayContent(dateStr){
    const arr = await getMoodsByDate(dateStr);
    arr.sort((a,b)=> String(a.time||'').localeCompare(String(b.time||'')));

    if(!arr.length) return null;

    const esc = s => String(s||'').replace(/[<>&]/g, c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));

    const items = arr.map(m=>{
      const meta = `${esc(m.time||'')} · 强度 ${esc(m.rating||'')}` + ((m.tags&&m.tags.length)?` · 标签：${m.tags.map(esc).join('、')}`:'');
      const note = m.note ? `<div class="note">${esc(m.note)}</div>` : `<div class="note muted">(无备注)</div>`;
      return `<div class="day-item" data-id="${m.id||''}">
        <div class="meta">${meta}</div>
        ${note}
        <div class="row actions">
          <button class="tiny" data-act="edit" data-id="${m.id||''}">编辑</button>
          <button class="tiny primary" data-act="del" data-id="${m.id||''}">删除</button>
        </div>
      </div>`;
    }).join('');

    const html = `<div class="day-popover">
      <div class="head"><span class="title">当天记录</span><span class="date">${esc(dateStr)}</span></div>
      <div class="body">${items}</div>
    </div>`;
    return html;
  }

  window.openDayNotesDialog = async function(dateStr, anchorEl){
    try{
      if(__periodMode){ return; } // safety
      // Guard: no records -> do not open
      const hasAny = window.__noteSetForMonth && window.__noteSetForMonth.has(dateStr);
      if(!hasAny){ return; }

      const anchor = anchorEl || document.querySelector(`.calendar .cell[data-date="${dateStr}"]`) || document.body;

      // toggle same-day
      if(__dayBubble && __dayBubbleDate === dateStr){
        closeDayBubble();
        return;
      }
      closeDayBubble();

      const html = await buildDayContent(dateStr);
      if(!html) return; // still guard

      const el = document.createElement('div');
      el.innerHTML = html;
      const bubble = el.firstElementChild;
      document.body.appendChild(bubble);
      __dayBubble = bubble;
      __dayBubbleDate = dateStr;

      // wire actions
      const body = bubble.querySelector('.body');
      body.addEventListener('click', async (e)=>{
        const btn = e.target.closest('button'); if(!btn) return;
        const id = Number(btn.dataset.id||0);
        const act = btn.dataset.act;
        if(act === 'del'){
          if(confirm('删除这条心情记录？')){
            await delMood(id);
            try{ await renderToday(); }catch(_){}
            try{ await renderCalendar(__calFocus || new Date()); }catch(_){}
            // Refresh list; if no more records -> close
            if(window.__noteSetForMonth && !window.__noteSetForMonth.has(dateStr)){
              closeDayBubble();
              return;
            }
            const newHtml = await buildDayContent(dateStr);
            if(newHtml){
              const tmp = document.createElement('div'); tmp.innerHTML = newHtml;
              const fresh = tmp.firstElementChild;
              bubble.querySelector('.body').innerHTML = fresh.querySelector('.body').innerHTML;
              placeBubble(anchor, bubble); // relayout
            }else{
              closeDayBubble();
            }
          }
        }
        if(act === 'edit'){
          const db = await openDB(); const s = tx(db, STORES.moods); const req = s.get(id);
          req.onsuccess = ()=>{
            const rec = req.result; if(!rec) return;
            try{
              dateInput.value = rec.date;
              timeInput.value = rec.time;
              moodRange.value = rec.rating;
              moodValue.textContent = moodRange.value;
              moodFace.textContent = face(moodRange.value);
              chosenTags.clear();
              document.querySelectorAll('#tagChips .chip.on').forEach(c=>c.classList.remove('on'));
              (rec.tags||[]).forEach(t=>{
                const el = [...document.querySelectorAll('#tagChips .chip')].find(x=>x.dataset.tag===t);
                if(el){ el.classList.add('on'); chosenTags.add(t); }
              });
              noteInput.value = rec.note || '';
              cancelEditMood.hidden = false; cancelEditMood.dataset.id = String(id);
              saveMood.textContent = '保存修改';
              autoNow.checked = false; autoNowToggle(false);
              goto('mood');
              closeDayBubble();
            }catch(_){}
          };
        }
      }, {passive:true});

      // place & outside-click close
      placeBubble(anchor, bubble);
      __outsideHandler = (ev)=>{
        if(!__dayBubble) return;
        const inBubble = ev.target.closest && ev.target.closest('.day-popover');
        const inAnchor = ev.target.closest && ev.target.closest('.calendar .cell') === anchor;
        if(!inBubble && !inAnchor){ closeDayBubble(); }
      };
      document.addEventListener('pointerdown', __outsideHandler, true);

    }catch(e){ /*noop*/ }
  }
})();



// ===== Backup & Restore (All Data) =====
async function exportAllData(){
  const db = await openDB();
  const out = { 
    app: 'CangyeAwuHome', 
    version: DB_VERSION, 
    dbName: DB_NAME, 
    exportedAt: new Date().toISOString(), 
    stores: {}, 
    localStorage: {} 
  };
  const stores = Array.from(db.objectStoreNames);
  await Promise.all(stores.map(name => new Promise((res,rej)=>{
    const s = tx(db, name);
    const req = s.getAll();
    req.onsuccess = ()=>{ out.stores[name] = req.result || []; res(); };
    req.onerror = ()=>rej(req.error);
  })));
  // localStorage snapshot
  try{
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      out.localStorage[k] = localStorage.getItem(k);
    }
  }catch(e){ /* ignore */ }
  const blob = new Blob([JSON.stringify(out,null,2)], {type:'application/json'});
  const name = 'AwuHomeBackup-' + new Date().toISOString().slice(0,19).replace(/[:T]/g,'').slice(0,14) + '.json';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

async function restoreAllData(file){
  const text = await file.text();
  let data;
  try{ data = JSON.parse(text); }catch(e){ alert('不是合法的 JSON 文件'); return; }
  if(!data || !data.stores || typeof data.stores !== 'object'){ alert('备份内容不完整'); return; }
  if(!confirm('将用备份数据覆盖当前数据，确定恢复？')) return;
  const db = await openDB();
  const storeNames = Object.keys(data.stores);
  // Clear and restore each store
  for(const name of storeNames){
    if(!db.objectStoreNames.contains(name)) continue;
    await new Promise((res,rej)=>{
      const s = tx(db, name, 'readwrite');
      const c = s.clear();
      c.onsuccess = ()=>{
        const items = Array.isArray(data.stores[name]) ? data.stores[name] : [];
        let i = 0;
        function putNext(){
          if(i>=items.length) return res();
          const p = s.put(items[i++]);
          p.onsuccess = putNext;
          p.onerror = ()=>rej(p.error);
        }
        putNext();
      };
      c.onerror = ()=>rej(c.error);
    });
  }
  // restore localStorage
  try{
    if(data.localStorage && typeof data.localStorage==='object'){
      Object.keys(data.localStorage).forEach(k=>{
        try{ localStorage.setItem(k, data.localStorage[k]); }catch(e){}
      });
    }
  }catch(e){ /*noop*/ }
  alert('恢复完成，即将刷新页面');
  location.reload();
}

document.getElementById('exportAllBtn')?.addEventListener('click', exportAllData);
document.getElementById('restoreAllBtn')?.addEventListener('click', ()=>{
  const f = document.getElementById('restoreFile')?.files?.[0];
  if(!f){ alert('请先选择备份文件'); return; }
  restoreAllData(f);
});
