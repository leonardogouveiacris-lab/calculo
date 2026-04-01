(function(){
  if (window.CPCommon) return;

  function safeText(value){
    if (value === null || value === undefined) return '';
    return String(value);
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
    clear: clear,
    cell: cell,
    appendCells: appendCells,
    fetchJson: fetchJson,
    storage: storage
  };
})();
