(()=>{
  'use strict';

  const $ = (selector, root=document) => root.querySelector(selector);
  const MAX_HISTORY = 40;
  const exportBtn = $('#exportBtn');
  const importInput = $('#importDesignFile');
  const saveBtn = $('#saveBtn');
  const newBtn = $('#newBtn');
  const canvas = $('#labelCanvas');
  const toolbar = $('.canvas-toolbar');

  if (!exportBtn || !importInput || !canvas || !toolbar) return;

  let stack = [];
  let index = -1;
  let savedFingerprint = '';
  let restoring = false;
  let captureBusy = false;
  let timer = 0;
  let initialized = false;

  const style = document.createElement('style');
  style.textContent = `
    .etik-history-group{display:flex;align-items:center;gap:6px;flex:0 0 auto}
    .etik-history-group .btn{min-width:38px;height:38px;padding:0 10px!important;display:grid!important;place-items:center;font-size:1.05rem}
    .etik-save-state{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:0 9px;border:1px solid var(--line,#ddd);border-radius:999px;font-size:.7rem;font-weight:750;color:var(--muted,#666);white-space:nowrap;background:var(--paper,#fff)}
    .etik-save-state .dot{width:7px;height:7px;border-radius:50%;background:#2f8f46;box-shadow:0 0 0 3px rgba(47,143,70,.09)}
    .etik-save-state.dirty{color:#9a5b00;border-color:rgba(183,111,0,.28);background:rgba(255,176,0,.055)}
    .etik-save-state.dirty .dot{background:#d48806;box-shadow:0 0 0 3px rgba(212,136,6,.1)}
    .etik-save-state.busy .dot{background:#1265d6;animation:etikHistoryPulse .8s ease-in-out infinite alternate}
    @keyframes etikHistoryPulse{to{opacity:.35}}
    @media(max-width:760px){
      .etik-history-group{gap:4px}
      .etik-history-group .btn{min-width:35px;width:35px;height:35px;padding:0!important}
      .etik-save-state{width:31px;min-width:31px;height:31px;min-height:31px;padding:0;justify-content:center}
      .etik-save-state .label{display:none}
      .etik-save-state .dot{width:8px;height:8px}
    }
    @media(prefers-reduced-motion:reduce){.etik-save-state.busy .dot{animation:none}}
  `;
  document.head.appendChild(style);

  const group = document.createElement('div');
  group.className = 'group etik-history-group';
  group.innerHTML = `
    <button class="btn" id="etikUndoBtn" type="button" title="Deshacer (Ctrl+Z)" aria-label="Deshacer" disabled>↶</button>
    <button class="btn" id="etikRedoBtn" type="button" title="Rehacer (Ctrl+Y)" aria-label="Rehacer" disabled>↷</button>
    <span class="etik-save-state busy" id="etikSaveState" role="status" aria-live="polite" title="Estado del diseño"><span class="dot"></span><span class="label">Preparando…</span></span>
  `;
  toolbar.insertBefore(group, toolbar.firstChild);

  const undoBtn = $('#etikUndoBtn');
  const redoBtn = $('#etikRedoBtn');
  const saveState = $('#etikSaveState');
  const stateLabel = saveState.querySelector('.label');

  function normalizeDesign(value){
    const clone = JSON.parse(JSON.stringify(value));
    if (clone && typeof clone === 'object') {
      ['exportedAt','savedAt','updatedAt','timestamp'].forEach(key => delete clone[key]);
    }
    return clone;
  }

  function fingerprint(value){
    return JSON.stringify(normalizeDesign(value));
  }

  async function captureDesign(){
    if (captureBusy) return null;
    captureBusy = true;
    let blob = null;
    let href = '';
    const originalCreate = URL.createObjectURL?.bind(URL);
    const originalClick = HTMLAnchorElement.prototype.click;

    try {
      if (originalCreate) {
        URL.createObjectURL = object => {
          if (object instanceof Blob) blob = object;
          return originalCreate(object);
        };
      }
      HTMLAnchorElement.prototype.click = function(){ href = this.href || ''; };
      exportBtn.click();
      await new Promise(resolve => setTimeout(resolve, 70));
    } finally {
      if (originalCreate) URL.createObjectURL = originalCreate;
      HTMLAnchorElement.prototype.click = originalClick;
      captureBusy = false;
    }

    let text = '';
    if (blob) text = await blob.text();
    else if (href.startsWith('data:')) {
      const comma = href.indexOf(',');
      const meta = href.slice(0, comma);
      const body = href.slice(comma + 1);
      text = /;base64/i.test(meta) ? decodeURIComponent(escape(atob(body))) : decodeURIComponent(body);
    }
    if (!text) return null;
    try { return JSON.parse(text); } catch { return null; }
  }

  function updateUi(mode='normal'){
    undoBtn.disabled = index <= 0 || restoring;
    redoBtn.disabled = index < 0 || index >= stack.length - 1 || restoring;
    const current = stack[index]?.fp || '';
    const dirty = !!current && current !== savedFingerprint;

    saveState.classList.toggle('dirty', dirty && mode !== 'busy');
    saveState.classList.toggle('busy', mode === 'busy');
    if (mode === 'busy') {
      stateLabel.textContent = restoring ? 'Restaurando…' : 'Procesando…';
      saveState.title = stateLabel.textContent;
    } else if (dirty) {
      stateLabel.textContent = 'Cambios sin guardar';
      saveState.title = 'Hay cambios sin guardar';
    } else {
      stateLabel.textContent = 'Guardado';
      saveState.title = 'Diseño guardado';
    }
  }

  async function record({force=false, markSaved=false}={}){
    if (restoring) return;
    const design = await captureDesign();
    if (!design) return;
    const fp = fingerprint(design);
    const current = stack[index]?.fp;

    if (force || fp !== current) {
      if (index < stack.length - 1) stack = stack.slice(0, index + 1);
      stack.push({design, fp});
      if (stack.length > MAX_HISTORY) stack.shift();
      index = stack.length - 1;
    }
    if (markSaved) savedFingerprint = fp;
    initialized = true;
    updateUi();
  }

  function scheduleRecord(delay=320){
    if (!initialized || restoring || captureBusy) return;
    clearTimeout(timer);
    timer = setTimeout(() => record(), delay);
  }

  async function applySnapshot(entry){
    if (!entry || typeof DataTransfer === 'undefined') return;
    restoring = true;
    clearTimeout(timer);
    updateUi('busy');
    try {
      const file = new File([JSON.stringify(entry.design)], 'etik-history.json', {type:'application/json'});
      const dt = new DataTransfer();
      dt.items.add(file);
      importInput.files = dt.files;
      importInput.dispatchEvent(new Event('change', {bubbles:true}));
      await new Promise(resolve => setTimeout(resolve, 180));
    } finally {
      restoring = false;
      updateUi();
    }
  }

  async function undo(){
    if (restoring || index <= 0) return;
    index -= 1;
    await applySnapshot(stack[index]);
  }

  async function redo(){
    if (restoring || index >= stack.length - 1) return;
    index += 1;
    await applySnapshot(stack[index]);
  }

  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);

  document.addEventListener('keydown', event => {
    const active = document.activeElement;
    const editingText = active && (active.matches?.('input,textarea,select') || active.isContentEditable);
    if (editingText) return;
    const mod = event.ctrlKey || event.metaKey;
    if (!mod) return;
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
    } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
      event.preventDefault();
      redo();
    }
  });

  const observer = new MutationObserver(() => scheduleRecord(280));
  observer.observe(canvas, {subtree:true, childList:true, attributes:true, characterData:true});

  document.addEventListener('input', event => {
    if (event.target === importInput) return;
    scheduleRecord(380);
  }, true);
  document.addEventListener('change', event => {
    if (event.target === importInput) return;
    scheduleRecord(180);
  }, true);
  document.addEventListener('pointerup', () => scheduleRecord(180), true);

  saveBtn?.addEventListener('click', () => {
    setTimeout(() => record({markSaved:true}), 120);
  });

  importInput.addEventListener('change', () => {
    if (restoring) return;
    setTimeout(async () => {
      stack = [];
      index = -1;
      savedFingerprint = '';
      await record({force:true, markSaved:true});
    }, 220);
  });

  newBtn?.addEventListener('click', () => {
    if (restoring) return;
    setTimeout(async () => {
      stack = [];
      index = -1;
      savedFingerprint = '';
      await record({force:true, markSaved:true});
    }, 180);
  });

  setTimeout(async () => {
    updateUi('busy');
    await record({force:true, markSaved:true});
  }, 650);

  window.EtikHistory = {
    undo,
    redo,
    markSaved: () => record({markSaved:true}),
    get state(){ return {length:stack.length,index,dirty:(stack[index]?.fp||'')!==savedFingerprint}; }
  };
})();
