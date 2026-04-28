(function(){
  if (window.CPCommon) return;

  function safeText(value){
    if (value === null || value === undefined) return '';
    return String(value);
  }

  function escapeHtml(value){
    return safeText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function clear(node){
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function cell(tag, text, className){
    var el = document.createElement(tag || 'td');
    el.textContent = safeText(text);
    if (className) el.className = className;
    return el;
  }

  function appendCells(tr, values, tag){
    (values || []).forEach(function(value){
      tr.appendChild(cell(tag || 'td', value));
    });
    return tr;
  }

  async function fetchJson(url, options){
    var settings = options || {};
    var timeoutMs = Number(settings.timeoutMs || 15000);
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = null;
    if (controller) {
      timer = setTimeout(function(){ controller.abort(); }, timeoutMs);
      settings.signal = controller.signal;
    }
    try {
      var response = await fetch(url, settings);
      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ' ao consultar serviço externo.');
      }
      return await response.json();
    } catch (error) {
      if (error && error.name === 'AbortError') {
        throw new Error('Tempo excedido ao consultar serviço externo.');
      }
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function applyUiRefinements(){
    if (!document || !document.head || document.getElementById('cp-ui-refinements')) return;
    var style = document.createElement('style');
    style.id = 'cp-ui-refinements';
    style.textContent = [
      ':root{--cp-ease:cubic-bezier(.2,.8,.2,1);--cp-fast:.18s}',
      '.card,.dash-card,.tab,.btn,button,input[type="text"],input[type="number"],input[type="date"],input[type="email"],input[type="search"],select,textarea{transition:box-shadow var(--cp-fast) var(--cp-ease),border-color var(--cp-fast) var(--cp-ease),background-color var(--cp-fast) var(--cp-ease),transform var(--cp-fast) var(--cp-ease)}',
      '.card:hover,.dash-card:hover{box-shadow:0 12px 30px rgba(16,24,40,.08)}',
      '.tab{font-weight:600}',
      '.btn:disabled,button:disabled{opacity:.58;cursor:not-allowed;filter:grayscale(.08)}',
      'input::placeholder,textarea::placeholder{color:#98a2b3}',
      'input[type="text"]:focus,input[type="number"]:focus,input[type="date"]:focus,input[type="email"]:focus,input[type="search"]:focus,select:focus,textarea:focus{background:#fcfdff}',
      '@media (prefers-reduced-motion: reduce){*,*::before,*::after{scroll-behavior:auto !important;animation:none !important;transition:none !important}}'
    ].join('');
    document.head.appendChild(style);
    if (document.body) document.body.classList.add('cp-ui-refined');
  }

  function setupTabsA11y(){
    var tablists = document.querySelectorAll('.tabs[role="tablist"]');
    if (!tablists.length) return;

    tablists.forEach(function(tablist){
      var tabs = Array.prototype.slice.call(tablist.querySelectorAll('.tab,button[data-tab],[data-tab].tab'));
      if (!tabs.length) return;

      tabs.forEach(function(tab, index){
        tab.setAttribute('role', 'tab');
        if (!tab.id) tab.id = 'cp-tab-' + (tab.dataset.tab || ('item-' + index));
        var targetId = tab.dataset.tab;
        var pane = targetId ? document.getElementById('tab-' + targetId) : null;
        if (pane) {
          pane.setAttribute('role', 'tabpanel');
          pane.setAttribute('aria-labelledby', tab.id);
        }
      });

      function sync(){
        tabs.forEach(function(tab){
          var active = tab.classList.contains('active');
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
          tab.setAttribute('tabindex', active ? '0' : '-1');
        });
      }

      sync();

      tablist.addEventListener('click', function(){
        setTimeout(sync, 0);
      });

      tablist.addEventListener('keydown', function(event){
        var key = event.key;
        if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].indexOf(key) === -1) return;

        var activeIndex = tabs.findIndex(function(tab){
          return tab.getAttribute('aria-selected') === 'true' || tab.classList.contains('active');
        });
        if (activeIndex < 0) activeIndex = 0;

        var nextIndex = activeIndex;
        if (key === 'ArrowRight') nextIndex = (activeIndex + 1) % tabs.length;
        if (key === 'ArrowLeft') nextIndex = (activeIndex - 1 + tabs.length) % tabs.length;
        if (key === 'Home') nextIndex = 0;
        if (key === 'End') nextIndex = tabs.length - 1;

        event.preventDefault();
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
        sync();
      });
    });
  }

  function initEnhancements(){
    applyUiRefinements();
    setupTabsA11y();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancements);
  } else {
    initEnhancements();
  }

  var storage = {
    load: function(key, fallback, parser){
      try {
        var raw = localStorage.getItem(key);
        if (!raw) return fallback;
        var parsed = JSON.parse(raw);
        return typeof parser === 'function' ? parser(parsed) : parsed;
      } catch (error) {
        console.warn('Falha ao carregar armazenamento local:', error);
        return fallback;
      }
    },
    save: function(key, value){
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn('Falha ao salvar armazenamento local:', error);
        return false;
      }
    }
  };

  window.CPCommon = {
    safeText: safeText,
    escapeHtml: escapeHtml,
    clear: clear,
    cell: cell,
    appendCells: appendCells,
    fetchJson: fetchJson,
    storage: storage
  };
})();
