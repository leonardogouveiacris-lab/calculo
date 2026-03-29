(function(){
  if (window.CPDevTools) return;

  var style = document.createElement('style');
  style.textContent = [
    '#cp-log-panel{position:fixed;right:16px;bottom:16px;width:min(480px,calc(100vw - 32px));max-height:min(52vh,420px);background:rgba(11,18,32,.96);color:#e5eefb;border:1px solid rgba(148,163,184,.35);border-radius:14px;box-shadow:0 24px 48px rgba(0,0,0,.28);z-index:99998;display:none;overflow:hidden;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}',
    '#cp-log-panel.cp-open{display:flex;flex-direction:column}',
    '#cp-log-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:rgba(15,23,42,.96);border-bottom:1px solid rgba(148,163,184,.22)}',
    '#cp-log-title{font-weight:700;letter-spacing:.2px}',
    '#cp-log-actions{display:flex;gap:8px}',
    '#cp-log-actions button{appearance:none;border:1px solid rgba(148,163,184,.25);background:#111827;color:#e5eefb;border-radius:10px;padding:6px 10px;cursor:pointer;font:inherit}',
    '#cp-log-body{padding:10px 12px;overflow:auto;max-height:340px;display:flex;flex-direction:column;gap:6px}',
    '.cp-log-entry{padding:6px 8px;border-radius:10px;background:rgba(30,41,59,.88);word-break:break-word}',
    '.cp-log-entry[data-kind="error"]{background:rgba(127,29,29,.92);color:#fee2e2}',
    '.cp-log-entry[data-kind="warn"]{background:rgba(120,53,15,.92);color:#ffedd5}',
    '.cp-log-entry[data-kind="debug"]{background:rgba(30,64,175,.92);color:#dbeafe}',
    '#cp-debug-tooltip{position:fixed;left:0;top:0;transform:translate(12px,12px);pointer-events:none;z-index:99999;background:#0f172a;color:#fff;padding:6px 8px;border-radius:8px;border:1px solid rgba(148,163,184,.3);font:12px/1.25 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;display:none;max-width:min(70vw,480px);box-shadow:0 12px 28px rgba(0,0,0,.25)}',
    '.cp-debug-highlight{outline:2px solid #2563eb !important;outline-offset:2px !important}'
  ].join('');
  document.head.appendChild(style);

  var panel = document.createElement('div');
  panel.id = 'cp-log-panel';
  panel.innerHTML = '<div id="cp-log-head"><div id="cp-log-title">Debug do sistema</div><div id="cp-log-actions"><button type="button" id="cp-log-clear">Limpar</button><button type="button" id="cp-log-close">Fechar</button></div></div><div id="cp-log-body"></div>';
  document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(panel); document.body.appendChild(tooltip); });

  var tooltip = document.createElement('div');
  tooltip.id = 'cp-debug-tooltip';

  var bodyEl;
  var debugOn = false;
  var currentEl = null;
  var generatedIds = 0;

  function logBody(){
    if (!bodyEl) bodyEl = panel.querySelector('#cp-log-body');
    return bodyEl;
  }

  function safeText(value){
    if (value === null || value === undefined) return '';
    return String(value);
  }

  function pushLog(kind, message){
    var body = logBody();
    if (!body) return;
    var entry = document.createElement('div');
    entry.className = 'cp-log-entry';
    entry.dataset.kind = kind || 'info';
    var stamp = new Date().toLocaleTimeString('pt-BR');
    entry.textContent = '[' + stamp + '] ' + safeText(message);
    body.appendChild(entry);
    while (body.children.length > 250) body.removeChild(body.firstChild);
    body.scrollTop = body.scrollHeight;
  }

  function ensureId(el){
    if (!el || el.nodeType !== 1) return '';
    if (!el.id) {
      generatedIds += 1;
      el.id = 'cp-auto-id-' + generatedIds;
    }
    return el.id;
  }

  function clearDebug(){
    if (currentEl) currentEl.classList.remove('cp-debug-highlight');
    currentEl = null;
    tooltip.style.display = 'none';
  }

  function selectorOf(el){
    if (!el || el.nodeType !== 1) return '(sem alvo)';
    var id = ensureId(el);
    return id ? ('#' + id) : el.tagName.toLowerCase();
  }

  function setTooltip(x, y, text){
    tooltip.textContent = text;
    tooltip.style.display = 'block';
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  function togglePanel(){
    panel.classList.toggle('cp-open');
  }

  function toggleDebug(){
    debugOn = !debugOn;
    if (!debugOn) clearDebug();
    pushLog('debug', 'Visualizador de ID ' + (debugOn ? 'ativado' : 'desativado') + ' (Ctrl + D).');
  }

  async function copyText(text){
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }

  document.addEventListener('click', function(e){
    var clearBtn = e.target.closest && e.target.closest('#cp-log-clear');
    var closeBtn = e.target.closest && e.target.closest('#cp-log-close');
    if (clearBtn) {
      var body = logBody();
      if (body) body.innerHTML = '';
      pushLog('info', 'Logs limpos.');
    }
    if (closeBtn) {
      panel.classList.remove('cp-open');
    }
  }, true);

  document.addEventListener('mousemove', function(e){
    if(!debugOn) return;
    var el = e.target;
    if(currentEl && currentEl !== el) currentEl.classList.remove('cp-debug-highlight');
    if(el && el.nodeType === 1){
      ensureId(el);
      currentEl = el;
      el.classList.add('cp-debug-highlight');
      setTooltip(e.clientX, e.clientY, 'ID: ' + el.id);
    } else {
      clearDebug();
    }
  }, {passive:true});

  document.addEventListener('click', function(e){
    if(!debugOn || !e.ctrlKey) return;
    var el = e.target;
    if(!el || el.nodeType !== 1) return;
    ensureId(el);
    e.preventDefault();
    e.stopPropagation();
    copyText(el.id).then(function(){
      setTooltip(e.clientX, e.clientY, 'Copiado: ' + el.id);
      pushLog('debug', 'ID copiado com Ctrl+Clique: ' + el.id);
    }).catch(function(err){
      pushLog('error', 'Falha ao copiar ID: ' + safeText(err));
    });
  }, true);

  document.addEventListener('keydown', function(e){
    var isD = e.code === 'KeyD' || e.key === 'd' || e.key === 'D';
    if(e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey && isD){
      e.preventDefault();
      togglePanel();
      pushLog('debug', 'Console de logs ' + (panel.classList.contains('cp-open') ? 'aberto' : 'fechado') + ' (Ctrl + Shift + D).');
      return;
    }
    if(e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey && isD){
      e.preventDefault();
      toggleDebug();
      return;
    }
  }, true);

  function previewValue(target){
    if (!target) return '';
    if (target.type === 'file') return (target.files && target.files[0] && target.files[0].name) || '';
    if (target.type === 'checkbox' || target.type === 'radio') return String(!!target.checked);
    return safeText(target.value || '').slice(0, 80);
  }

  function logAction(type, e, extra){
    var target = e && e.target ? selectorOf(e.target) : '(sem alvo)';
    var msg = type + ' em ' + target;
    if(extra) msg += ' · ' + extra;
    pushLog('info', msg);
  }

  document.addEventListener('click', function(e){ logAction('click', e); }, true);
  document.addEventListener('change', function(e){
    var info = previewValue(e.target);
    logAction('change', e, info ? ('valor="' + info + '"') : '');
  }, true);
  document.addEventListener('input', function(e){
    var info = previewValue(e.target);
    logAction('input', e, info ? ('valor="' + info + '"') : '');
  }, true);
  window.addEventListener('error', function(e){
    pushLog('error', (e.message || 'Erro não identificado') + (e.filename ? (' · ' + e.filename + ':' + e.lineno) : ''));
  });
  window.addEventListener('unhandledrejection', function(e){
    pushLog('error', 'Promise rejeitada sem tratamento: ' + safeText(e.reason));
  });

  window.CPDevTools = { pushLog: pushLog, togglePanel: togglePanel, toggleDebug: toggleDebug };
  pushLog('debug', 'DevTools carregados. Ctrl + D: IDs · Ctrl + Shift + D: logs.');
})();
