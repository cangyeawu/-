// clipper.js v1.3.1 — Selection mode, multi-select, partial-text, fixed toolbar, multi-line previews
(function(){
  if (window.__clipperBootingV131) return; window.__clipperBootingV131 = true;

  // ---------- DB helpers ----------
  const DB_NAME = (typeof window !== 'undefined' && window.indexedDB) ? (window.cangyeDbName || 'cangye-journal-v6') : 'cangye-journal-v6';
  const STORE = 'clips';
  async function _openDB(){
    if (typeof window.openDB === 'function') return await window.openDB();
    return new Promise((res, rej)=>{
      const r = indexedDB.open(DB_NAME);
      r.onsuccess = ()=>res(r.result);
      r.onerror = ()=>rej(r.error);
    });
  }
  function _tx(db, store, mode='readonly'){ return db.transaction(store, mode).objectStore(store); }
  async function clips_add(rec){ const db=await _openDB(); return new Promise((res,rej)=>{ const req=_tx(db, STORE, 'readwrite').add(rec); req.onsuccess=()=>res(req.result); req.onerror=()=>rej(req.error); }); }
  async function clips_put(rec){ const db=await _openDB(); return new Promise((res,rej)=>{ const req=_tx(db, STORE, 'readwrite').put(rec); req.onsuccess=()=>res(req.result); req.onerror=()=>rej(req.error); }); }
  async function clips_get_all(){ const db=await _openDB(); return new Promise((res,rej)=>{ const req=_tx(db, STORE, 'readonly').getAll(); req.onsuccess=()=>res(req.result||[]); req.onerror=()=>rej(req.error); }); }
  async function clips_del(id){ const db=await _openDB(); return new Promise((res,rej)=>{ const req=_tx(db, STORE, 'readwrite').delete(id); req.onsuccess=()=>res(); req.onerror=()=>rej(req.error); }); }
  async function files_all(){ if (typeof window.getAllFiles === 'function') return await window.getAllFiles(); return []; }

  // ---------- State ----------
  let chatBody, chatHeader, chatContainer, selToolbar, themePicker;
  let selectMode = false;
  let selectionTextCache = '';
  let pendingSelectionText = '';
  let currentFileId = null;
  let selectedSegments = []; // collect multiple partial selections
  let selectionSequence = []; // unified order (segments + messages) in click order
  function ensureSeqItem(it){ if(!it||!it.k) return; if(!selectionSequence.find(x=>x.k===it.k)){ selectionSequence.push(it); } }
  function removeSeqKey(k){ selectionSequence = selectionSequence.filter(x=>x.k!==k); }


  function findChatBody(){ return document.getElementById('activeChatBody'); }
  function findChatHeader(){
    const body = findChatBody(); if(!body) return null;
    const prev = body.previousElementSibling;
    if (prev && prev.classList && prev.classList.contains('viewer-head')) return prev;
    const wrap = body.closest('section.chat-view') || body.closest('.chat-view');
    return wrap ? wrap.querySelector('.viewer-head') : document.querySelector('.viewer-head');
  }
  function findChatContainer(){
    const body = findChatBody(); if(!body) return null;
    return body.closest('section.chat-view') || body.closest('.chat-view') || body.parentElement;
  }
  async function inferCurrentFileId(){
    const h3 = document.getElementById('activeChatTitle'); const name = (h3?.textContent||'').trim();
    if(!name) return null; const all = await files_all(); const hit = all.find(f=>f.name===name); currentFileId = hit ? hit.id : null; return currentFileId;
  }

  // ---------- UI mount ----------
  function ensureUI(){
    chatBody = findChatBody(); chatHeader = findChatHeader() || document.querySelector('.viewer-head') || document.body; chatContainer = findChatContainer() || document.querySelector('.chat-view') || document.body;
    if(!chatBody || !chatHeader || !chatContainer) return false;

    // Toggle button
    let btn = chatHeader.querySelector('#clipToggleBtn');
    if(!btn){
      btn = document.createElement('button');
      btn.id = 'clipToggleBtn';
      btn.className = 'ghost';
      btn.textContent = '剪藏模式';
      btn.title = '选择多条消息或划选气泡内文本保存到剪藏';
      chatHeader.appendChild(btn);
      btn.addEventListener('click', ()=>setMode(!selectMode));
    }

    // Bottom toolbar fixed within chat card
    if(!selToolbar){
      selToolbar = document.createElement('div');
      selToolbar.className = 'clip-toolbar';
      selToolbar.innerHTML = `
        <div class="clip-toolbar-inner">
          <span class="clip-count" id="clipCount">0</span>
          <button class="ghost" id="addSegment" title="把当前划选的文字加入片段清单">收集片段</button>
          <button class="ghost" id="saveToTheme">保存到剪藏</button>
          <button class="ghost" id="cancelClip">取消</button>
          <span class="muted tiny">（可多选气泡，或划选文字）</span>
        </div>`;
      chatContainer.appendChild(selToolbar);
      selToolbar.style.display = 'none';
      selToolbar.querySelector('#saveToTheme').addEventListener('click', onSaveClicked);
      selToolbar.querySelector('#addSegment').addEventListener('click', ()=>{
        try{
          const sNow = getSelectionWithin(chatBody) || selectionTextCache;
          if(sNow && sNow.trim()){
            const seg = sNow.trim();
            if(!selectedSegments.includes(seg)) selectedSegments.push(seg);
            ensureSeqItem({k:`seg:${seg}`, type:'seg', text:seg});
            const sel = window.getSelection(); if(sel){ try{ sel.removeAllRanges(); }catch(_){} }
            selectionTextCache=''; updateCount();
          }
        }catch(_){ }
      });
      selToolbar.querySelector('#cancelClip').addEventListener('click', ()=>setMode(false));
    }

    // Observe chat mutations
    if(!chatBody.__clipperMo){
      const mo = new MutationObserver(()=>{ if(selectMode){ refreshIndices(); } });
      mo.observe(chatBody, { childList:true, subtree:true });
      chatBody.__clipperMo = mo;
    }

    // Selection tracking
    if(!document.__clipperSelBound){
      document.addEventListener('selectionchange', onSelectionChange);
      document.__clipperSelBound = true;
    }

    setTimeout(refreshIndices, 50);
    return true;
  }
  function waitForUI(){
    if (ensureUI()) return;
    const obs = new MutationObserver(()=>{ if(ensureUI()){ obs.disconnect(); } });
    obs.observe(document.documentElement, { childList:true, subtree:true });
    if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', ()=>ensureUI(), { once:true }); }
  }

  function setMode(on){
    selectMode = !!on;
    const btn = chatHeader?.querySelector('#clipToggleBtn');
    if(btn) btn.classList.toggle('primary', selectMode);
    if(selToolbar) selToolbar.style.display = selectMode ? '' : 'none';
    if(btn){ if(selectMode){ btn.classList.remove('ghost'); } else { btn.classList.add('ghost'); } }
    chatBody?.classList.toggle('select-mode', selectMode);
    refreshIndices();
    inferCurrentFileId();
    if(!selectMode){ selectedSegments = []; selectionSequence = []; selectionTextCache=''; pendingSelectionText=''; updateCount(); }
  }

  // ---------- Selection logic ----------
  function onSelectionChange(){
    if(!selectMode) return;
    selectionTextCache = getSelectionWithin(chatBody);
    updateCount();
  }
  function getSelectionWithin(container){
    const sel = window.getSelection();
    if(!sel || sel.isCollapsed) return '';
    if(!container || !container.contains(sel.anchorNode) || !container.contains(sel.focusNode)) return '';
    return sel.toString().trim();
  }

  function refreshIndices(){
    if(!chatBody) return;
    let idx = 0;
    chatBody.querySelectorAll('.msg').forEach(msg=>{
      msg.dataset.mid = String(++idx);
      const bubble = msg.querySelector('.bubble');

      // hidden checkbox to store selection state
      let inp = msg.querySelector('input.__clipperCheck');
      if(!inp){
        inp = document.createElement('input'); inp.type='checkbox'; inp.className='__clipperCheck'; inp.style.display='none';
        inp.addEventListener('change', ()=>{ msg.classList.toggle('clip-checked', inp.checked); updateCount(); });
        msg.prepend(inp);
      }

      // click/dblclick toggles only current item
      if(bubble && !bubble.__clipperBound){
        const toggle = ()=>{
          if(!selectMode) return;
          const sel = window.getSelection();
          const textSelected = sel && !sel.isCollapsed && bubble.contains(sel.anchorNode);
          if(textSelected) return; // respect partial selection
          inp.checked = !inp.checked; msg.classList.toggle('clip-checked', inp.checked);
          try{
            const rid = msg.dataset.msgid || msg.dataset.mid || '';
            const k = `msg:${rid}`;
            if(inp.checked){ ensureSeqItem({k, type:'msg', rid}); } else { removeSeqKey(k); }
          }catch(_){ }
          updateCount();
        };
        bubble.addEventListener('click', toggle);
        
        bubble.__clipperBound = true;
      }
    });
    updateCount();
  }

  function getSelectedMessages(){
    const out = [];
    chatBody?.querySelectorAll('.msg').forEach(msg=>{
      const inp = msg.querySelector('input.__clipperCheck');
      if(inp && inp.checked){
        const b = msg.querySelector('.bubble');
        const metaTop = msg.querySelector('.meta-top');
        const metaBottom = msg.querySelector('.meta-bottom');
        out.push({
          mid: Number(msg.dataset.mid||0),
          who: (metaTop?.textContent||'').trim(),
          ts: (metaBottom?.textContent||'').trim(),
          text: (b?.textContent||'').trim()
        });
      }
    });
    return out;
  }
  function updateCount(){
    const nMsgs = getSelectedMessages().length;
    const c = selToolbar?.querySelector('#clipCount');
    selectionTextCache = getSelectionWithin(chatBody);
    const nSegs = Array.isArray(selectedSegments) ? selectedSegments.length : 0;
    const extra = selectionTextCache ? 1 : 0;
    if(c){ c.textContent = String(nMsgs + nSegs + extra); }
  }

  // ---------- Helpers for preview rendering ----------
  function escapeHtml(s){ return (s||'').replace(/[<>&]/g, c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])); }
  function truncate(s, n){ s = String(s||''); return s.length>n ? s.slice(0,n)+'…' : s; }
  function buildClipPreviewHTML(c){
    if(c.text && String(c.text).trim()){
      return `<div class="clip-selected-text">${escapeHtml(c.text)}</div>`;
    }
    const msgs = Array.isArray(c.msgs) ? c.msgs : [];
    if(!msgs.length) return `<div class="muted tiny">(空剪藏)</div>`;
    const maxLines = 3;
    const lines = msgs.slice(0, maxLines).map(m=>{
      const who = escapeHtml((m.who||'').trim());
      const text = escapeHtml((m.text||'').trim());
      return `<div class="line"><span class="who">${who}：</span><span class="txt">${truncate(text, 120)}</span></div>`;
    }).join('');
    const more = msgs.length > maxLines ? `<div class="more tiny muted">… 等 ${msgs.length} 条，点击查看全部</div>` : '';
    return `<div class="clip-lines">${lines}${more}</div>`;
  }

  // ---------- Theme picker & save ----------
  function buildThemePicker(){
    const d = document.createElement('dialog');
    d.className = 'clip-dialog';
    d.innerHTML = `
      <form method="dialog" class="clip-dialog-body">
        <h3>保存到剪藏</h3>
        <div class="theme-list" id="themeList"></div>
        <div class="row">
          <input type="text" id="newThemeName" placeholder="新剪藏名称" />
          <button class="primary" id="createThemeBtn">新建剪藏</button>
        </div>
        <menu class="actions"><button value="cancel">取消</button></menu>
      </form>`;
    document.body.appendChild(d);
    return d;
  }
  async function refreshPickerThemes(){
    if(!themePicker) themePicker = buildThemePicker();
    const host = themePicker.querySelector('#themeList');
    const all = await clips_get_all();
    const themes = all.filter(x=>x && x.kind==='theme').sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));
    host.innerHTML = themes.map(t=>`
      <div class="item theme-pick" data-id="${t.id}">
        <div><strong>${t.title||'未命名剪藏'}</strong></div>
        <div class="meta tiny">共 ${(all.filter(x=>x && x.kind==='clip' && Number(x.themeId)===Number(t.id)).length)} 条剪藏</div>
      </div>`).join('') || `<div class="muted tiny">（暂无剪藏）</div>`;
    host.querySelectorAll('.theme-pick').forEach(el=>{
      el.addEventListener('click', async ()=>{
        await doSaveToTheme(Number(el.dataset.id), pendingSelectionText);
        themePicker.close();
        setMode(false);
      });
    });
    themePicker.querySelector('#createThemeBtn').onclick = async (e)=>{
      e.preventDefault();
      const name = themePicker.querySelector('#newThemeName').value.trim();
      if(!name) return;
      const now = new Date().toISOString();
      const id = await clips_add({ kind:'theme', title:name, createdAt:now, updatedAt:now, count:0 });
      await refreshClipList();
      await doSaveToTheme(Number(id), pendingSelectionText);
      themePicker.close();
      setMode(false);
    };
  }
  async function onSaveClicked(){
    // capture selection before dialog steals focus
    const sNow = getSelectionWithin(chatBody) || selectionTextCache || '';
    if(sNow && sNow.trim()){
      const seg = sNow.trim();
      if(!selectedSegments.includes(seg)) selectedSegments.push(seg);
      ensureSeqItem({k:`seg:${seg}`, type:'seg', text:seg});
    }
    selectionTextCache=''; pendingSelectionText='';
    await refreshPickerThemes();
    if(!themePicker.open) themePicker.showModal();
  }

  async function doSaveToTheme(themeId, capturedText){
    // Ensure any capturedText gets into the sequence (safety)
    const sRaw = (capturedText && capturedText.trim()) ? capturedText.trim() : (selectionTextCache||'').trim();
    if(sRaw){ ensureSeqItem({k:`seg:${sRaw}`, type:'seg', text:sRaw}); if(!selectedSegments.includes(sRaw)) selectedSegments.push(sRaw); }

    // Build ordered items based on current checks & cached segments
    const ordered = [];
    for(const it of selectionSequence){
      if(it.type==='seg'){
        if(it.text && it.text.trim()) ordered.push({type:'seg', text:it.text.trim()});
      } else if(it.type==='msg'){
        const el = chatBody?.querySelector(`.msg[data-msgid="${it.rid}"]`);
        if(!el) continue;
        const chk = el.querySelector('input.__clipperCheck');
        if(!chk || !chk.checked) continue;
        const b = el.querySelector('.bubble');
        const metaTop = el.querySelector('.meta-top');
        const metaBottom = el.querySelector('.meta-bottom');
        ordered.push({type:'msg', data:{
          mid: Number(el.dataset.mid||0),
          who: (metaTop?.textContent||'').trim(),
          ts: (metaBottom?.textContent||'').trim(),
          text: (b?.textContent||'').trim()
        }});
      }
    }
    if(!ordered.length){ alert('请选择至少一条消息或划选一段文本'); return; }

    const now = new Date().toISOString();
    let newClips = 0;
    for(const it of ordered){
      if(it.type==='seg'){
        const payloadSel = { kind:'clip', themeId:Number(themeId), sourceFileId: currentFileId || null,
          createdAt:now, updatedAt:now, msgs:[], text:it.text, preview: it.text.slice(0,120) };
        await clips_add(payloadSel); newClips += 1;
      } else if(it.type==='msg'){
        const m = it.data || {};
        const payloadMsg = { kind:'clip', themeId:Number(themeId), sourceFileId: currentFileId || null,
          createdAt:now, updatedAt:now, msgs:[m], text:'', preview: (m.text||'').slice(0,120) };
        await clips_add(payloadMsg); newClips += 1;
      }
    }

    // Update theme count & UI
    const all = await clips_get_all();
    const t = all.find(x=>x.id===Number(themeId) && x.kind==='theme');
    if(t && newClips>0){ t.count = (t.count||0) + newClips; t.updatedAt = now; await clips_put(t); }

    // Cleanup
    chatBody?.querySelectorAll('input.__clipperCheck:checked').forEach(inp=>{ inp.checked=false; const m=inp.closest('.msg'); if(m) m.classList.remove('clip-checked'); });
    selectedSegments = []; selectionSequence = []; selectionTextCache='';
    updateCount(); await refreshClipList();
  }

  // ---------- Theme page rendering ----------
  function ensureClipViewDialog(){
    let d = document.querySelector('dialog.clip-viewer');
    if(!d){
      d = document.createElement('dialog');
      d.className = 'clip-viewer';
      d.innerHTML = `
        <form method="dialog" class="clip-viewer-body">
          <h3>剪藏详情</h3>
          <div class="clip-viewer-content"></div>
          <menu class="actions"><button value="close">关闭</button></menu>
        </form>`;
      document.body.appendChild(d);
    }
    return d;
  }
  function buildFullContent(c){
    if(c.text && String(c.text).trim()){
      return `<pre class="full-text">${escapeHtml(c.text)}</pre>`;
    }
    const msgs = Array.isArray(c.msgs)?c.msgs:[];
    if(!msgs.length) return `<div class="muted tiny">(空剪藏)</div>`;
    return `<div class="full-lines">` + msgs.map(m=>{
      const who = escapeHtml((m.who||'').trim());
      const text = escapeHtml((m.text||'').trim());
      const ts = escapeHtml((m.ts||'').trim());
      return `<div class="line"><div class="who">${who} <span class="ts tiny muted">${ts}</span></div><div class="txt">${text}</div></div>`;
    }).join('') + `</div>`;
  }

  async function refreshClipList(){
    const themeList = document.getElementById('clipList');
    if(!themeList) return;
    const all = await clips_get_all();
    const themes = all.filter(x=>x.kind==='theme').sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));
    function clipsOf(tid){
      const arr = all.filter(x=>x.kind==='clip' && Number(x.themeId)===Number(tid));
      arr.sort((a,b)=>{
        const ad=a.createdAt||'', bd=b.createdAt||'';
        const cmp = ad.localeCompare(bd); // oldest first (first-clicked first)
        if(cmp!==0) return cmp;
        return (a.id||0) - (b.id||0);
      });
      return arr;
    }

    themeList.innerHTML = `
      <div class="actions" style="margin-bottom:8px">
        <button class="primary" id="newTheme">新建剪藏</button>
        <button class="ghost" id="exportAllThemes">导出备份</button>
        <span class="tiny muted">（数据仅存本地 IndexedDB）</span>
      </div>
      ${ themes.map(t=>{
        const arr = clipsOf(t.id);
        return `
        <div class="item clip-theme" data-id="${t.id}">
          <div class="row" style="justify-content:space-between;align-items:center">
            <div><strong>${t.title||'未命名剪藏'}</strong><span class="tiny muted"> · ${arr.length} 条</span></div>
            <div class="row compact">
              <button class="ghost" data-act="rename">重命名</button>
              <button class="ghost" data-act="export">导出</button>
              <button class="danger" data-act="delete">删除</button>
            </div>
          </div>
          <div class="clip-grid">
            ${ arr.map(c=>`
              <div class="clip-card" data-cid="${c.id}">
                <div class="clip-prev">${buildClipPreviewHTML(c)}</div>
                <div class="meta tiny">源文件ID: ${c.sourceFileId??'未知'} · ${new Date(c.createdAt||'').toLocaleString()}</div>
                <div class="row compact">
                  <button class="ghost" data-act="view">查看</button>
                  <button class="danger" data-act="del-clip">删除</button>
                </div>
              </div>
            `).join('') || `<div class="muted tiny" style="padding:6px 0">（暂无剪藏）</div>`}
          </div>
        </div>`;
      }).join('') || `<div class="muted tiny">（还没有剪藏，去聊天区开启剪藏模式吧）</div>` }
    `;

    themeList.querySelector('#newTheme')?.addEventListener('click', async ()=>{
      const name = prompt('新剪藏名称'); if(!name) return;
      const now = new Date().toISOString();
      await clips_add({ kind:'theme', title:name.trim(), createdAt:now, updatedAt:now, count:0 });
      await refreshClipList();
    });
    themeList.querySelector('#exportAllThemes')?.addEventListener('click', async ()=>{
      const payload = { exportedAt:new Date().toISOString(), data: all };
      const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'themes_backup.json'; a.click(); URL.revokeObjectURL(a.href);
    });

    themeList.querySelectorAll('.clip-theme').forEach(block=>{
      const tid = Number(block.dataset.id);
      block.querySelector('[data-act="rename"]')?.addEventListener('click', async ()=>{
        const name = prompt('重命名剪藏'); if(!name) return;
        const now = new Date().toISOString();
        const all2 = await clips_get_all(); const t = all2.find(x=>x.id===tid && x.kind==='theme');
        if(t){ t.title=name.trim(); t.updatedAt=now; await clips_put(t); await refreshClipList(); }
      });
      block.querySelector('[data-act="export"]')?.addEventListener('click', async ()=>{
        const arr = (await clips_get_all()).filter(x=>x.kind==='clip' && Number(x.themeId)===tid);
        const t = (await clips_get_all()).find(x=>x.id===tid && x.kind==='theme');
        const payload = { theme:t, clips:arr };
        const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `theme_${t?.title||tid}.json`.replace(/[^\w.-]/g,'_'); a.click(); URL.revokeObjectURL(a.href);
      });
      block.querySelector('[data-act="delete"]')?.addEventListener('click', async ()=>{
        if(!confirm('删除该剪藏及其所有剪藏？')) return;
        const all2 = await clips_get_all();
        const toDel = all2.filter(x=> (x.id===tid && x.kind==='theme') || (x.kind==='clip' && Number(x.themeId)===tid));
        for(const r of toDel){ await clips_del(r.id); }
        await refreshClipList();
      });
      block.querySelectorAll('[data-act="view"]').forEach(btn=>btn.addEventListener('click', async ()=>{
        const cid = Number(btn.closest('.clip-card').dataset.cid);
        const all2 = await clips_get_all();
        const c = all2.find(x=>x.id===cid);
        if(!c) return;
        const d = ensureClipViewDialog();
        d.querySelector('.clip-viewer-content').innerHTML = buildFullContent(c);
        if(!d.open) d.showModal();
      }));
      block.querySelectorAll('[data-act="del-clip"]').forEach(btn=>btn.addEventListener('click', async ()=>{
        const cid = Number(btn.closest('.clip-card').dataset.cid);
        if(!confirm('删除这条剪藏？')) return;
        await clips_del(cid);
        const t = (await clips_get_all()).find(x=>x.id===tid && x.kind==='theme');
        if(t && t.count>0){ t.count -= 1; await clips_put(t); }
        await refreshClipList();
      }));
    });
  }

  window.addEventListener('focus', refreshClipList);
  // Fallback hotkey: Alt+S toggles clip mode (helps when header button is not clickable)
  window.addEventListener('keydown', (e)=>{
    if(e.altKey && e.code === 'KeyS'){ try{ setMode(!selectMode); }catch(_){} }
  });
  waitForUI();
})();
