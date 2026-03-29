(function(){
  function ready(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true });
    else fn();
  }

  function debounce(fn, wait){
    var timer = null;
    return function(){
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function(){ fn.apply(null, args); }, wait);
    };
  }

  ready(function(){
    document.body.classList.add('redesign-ui');
    buildDashboardLayout();
    enhanceLaunchSection();
    setupSummaryKpis();
    observeDynamicAreas();
    enhanceLaunchCards();
  });

  function findCardByHeading(text){
    var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
    return cards.find(function(card){
      var h2 = card.querySelector('h2');
      return h2 && h2.textContent.trim() === text;
    }) || null;
  }

  function buildDashboardLayout(){
    var tabDados = document.getElementById('tab-dados');
    if (!tabDados || tabDados.querySelector('.civeis-dashboard')) return;

    var grids = Array.prototype.slice.call(tabDados.querySelectorAll(':scope > section.grid'));
    if (grids.length < 3) return;

    var dataCard = grids[0].querySelector('.card');
    var summaryCard = grids[1].querySelector('.card');
    var launchesCard = grids[2].querySelector('.card');
    if (!dataCard || !summaryCard || !launchesCard) return;

    var shell = document.createElement('section');
    shell.className = 'civeis-dashboard';

    var main = document.createElement('div');
    main.className = 'civeis-dashboard-main';

    var side = document.createElement('aside');
    side.className = 'civeis-dashboard-summary';

    main.appendChild(dataCard);
    main.appendChild(launchesCard);
    side.appendChild(summaryCard);
    shell.appendChild(main);
    shell.appendChild(side);

    tabDados.insertBefore(shell, grids[0]);
    grids.forEach(function(grid){ grid.remove(); });
  }

  function enhanceLaunchSection(){
    var launchesCard = findCardByHeading('Lançamentos do cálculo');
    if (!launchesCard || launchesCard.dataset.redesignReady === '1') return;
    launchesCard.dataset.redesignReady = '1';

    var helpCopy = launchesCard.querySelector('.card-sub');
    if (helpCopy) {
      var details = document.createElement('details');
      details.className = 'redesign-help';
      details.innerHTML = '<summary>Como funciona a memória mensal e as fórmulas</summary>' +
        '<div class="redesign-help-body"></div>';
      helpCopy.replaceWith(details);
      details.querySelector('.redesign-help-body').appendChild(helpCopy);
    }

    var inputRow = launchesCard.querySelector('.row');
    var btnRow = launchesCard.querySelector('.btn-row');
    var selectorBar = launchesCard.querySelector('.launch-selector');
    var launchesHost = document.getElementById('launchesHost');
    if (!inputRow || !btnRow || !selectorBar || !launchesHost) return;

    var createSection = document.createElement('section');
    createSection.className = 'redesign-launch-create';
    createSection.innerHTML = '' +
      '<div class="redesign-launch-create-head">' +
        '<div>' +
          '<div class="redesign-launch-create-title">Nova verba</div>' +
          '<div class="redesign-launch-create-sub">Cadastre a verba e o período. A configuração de índices, fórmulas e colunas adicionais permanece no editor da verba selecionada.</div>' +
        '</div>' +
      '</div>';
    createSection.appendChild(inputRow);
    createSection.appendChild(btnRow);

    var content = document.createElement('div');
    content.className = 'redesign-launch-content';

    var nav = document.createElement('aside');
    nav.className = 'redesign-launch-nav';
    nav.innerHTML = '' +
      '<div class="redesign-launch-nav-head">' +
        '<div>' +
          '<div class="redesign-launch-nav-title">Verbas cadastradas</div>' +
          '<div class="redesign-launch-nav-meta" id="redesignLaunchNavMeta">Navegação rápida por verba</div>' +
        '</div>' +
      '</div>' +
      '<label for="redesignLaunchSearch">Localizar verba</label>' +
      '<input id="redesignLaunchSearch" class="redesign-launch-search" type="text" placeholder="Pesquisar por nome ou período">' +
      '<div class="redesign-launch-list" id="redesignLaunchList"></div>';

    var editor = document.createElement('div');
    editor.className = 'redesign-launch-editor';
    editor.appendChild(selectorBar);
    editor.appendChild(launchesHost);

    content.appendChild(nav);
    content.appendChild(editor);
    launchesCard.appendChild(createSection);
    launchesCard.appendChild(content);

    setupLaunchNav();
  }

  function setupLaunchNav(){
    var selector = document.getElementById('launchSelector');
    var list = document.getElementById('redesignLaunchList');
    var search = document.getElementById('redesignLaunchSearch');
    var meta = document.getElementById('redesignLaunchNavMeta');
    if (!selector || !list || !search) return;

    function parseOptionText(text){
      var cleaned = String(text || '').replace(/^\s*\d+\.\s*/, '').trim();
      var parts = cleaned.split('—');
      return {
        title: (parts[0] || cleaned || 'Verba').trim(),
        meta: (parts.slice(1).join('—') || '').trim()
      };
    }

    function render(){
      var term = (search.value || '').trim().toLowerCase();
      var options = Array.prototype.slice.call(selector.options || []).filter(function(opt){ return !!opt.value; });
      if (meta) {
        meta.textContent = options.length
          ? options.length + ' verba(s) cadastrada(s)'
          : 'Nenhuma verba cadastrada';
      }

      var filtered = options.filter(function(opt){
        return !term || opt.textContent.toLowerCase().indexOf(term) >= 0;
      });

      if (!filtered.length) {
        CPCommon.clear(list);
        var empty = document.createElement('div');
        empty.className = 'redesign-launch-empty';
        empty.textContent = 'Nenhuma verba encontrada com esse filtro.';
        list.appendChild(empty);
        return;
      }

      var existing = new Map();
      Array.prototype.slice.call(list.querySelectorAll('button.redesign-launch-item')).forEach(function(btn){
        existing.set(btn.getAttribute('data-value') || '', btn);
      });
      var fragment = document.createDocumentFragment();
      filtered.forEach(function(opt){
        var key = String(opt.value || '');
        var parsed = parseOptionText(opt.textContent);
        var active = key === String(selector.value);
        var btn = existing.get(key) || document.createElement('button');
        btn.type = 'button';
        btn.className = 'redesign-launch-item' + (active ? ' is-active' : '');
        btn.setAttribute('data-value', key);

        var title = btn.querySelector('.redesign-launch-item-title');
        if (!title) { title = document.createElement('span'); title.className = 'redesign-launch-item-title'; btn.appendChild(title); }
        title.textContent = parsed.title;

        var metaText = btn.querySelector('.redesign-launch-item-meta');
        if (!metaText) { metaText = document.createElement('span'); metaText.className = 'redesign-launch-item-meta'; btn.appendChild(metaText); }
        metaText.textContent = parsed.meta || 'Clique para abrir o editor da verba.';

        fragment.appendChild(btn);
      });
      CPCommon.clear(list);
      list.appendChild(fragment);
    }

    if (!selector.dataset.redesignNavBound) {
      selector.dataset.redesignNavBound = '1';
      selector.addEventListener('change', render);
      search.addEventListener('input', render);
      list.addEventListener('click', function(event){
        var btn = event.target.closest('.redesign-launch-item');
        if (!btn) return;
        selector.value = btn.getAttribute('data-value') || '';
        selector.dispatchEvent(new Event('change', { bubbles:true }));
      });

      var rerender = debounce(render, 80);
      if (!selector._redesignNavObserver) {
        selector._redesignNavObserver = new MutationObserver(rerender);
        selector._redesignNavObserver.observe(selector, { childList:true, subtree:true, characterData:true, attributes:true });
      }
    }

    render();
  }

  function setupSummaryKpis(){
    var summaryCard = document.getElementById('cardResumoCalculoCivil');
    if (!summaryCard) return;

    var kpis = summaryCard.querySelector('.redesign-summary-kpis');
    if (!kpis) {
      kpis = document.createElement('div');
      kpis.className = 'redesign-summary-kpis';
      kpis.innerHTML = '' +
        '<div class="redesign-summary-kpi" data-kpi="verbas"><span class="redesign-summary-kpi-label">Verbas</span><span class="redesign-summary-kpi-value">0</span><span class="redesign-summary-kpi-meta">itens em memória</span></div>' +
        '<div class="redesign-summary-kpi" data-kpi="total"><span class="redesign-summary-kpi-label">Total geral</span><span class="redesign-summary-kpi-value">0,00</span><span class="redesign-summary-kpi-meta">valor devido</span></div>' +
        '<div class="redesign-summary-kpi" data-kpi="honorarios"><span class="redesign-summary-kpi-label">Honorários</span><span class="redesign-summary-kpi-value">Desativados</span><span class="redesign-summary-kpi-meta">status atual</span></div>' +
        '<div class="redesign-summary-kpi" data-kpi="custas"><span class="redesign-summary-kpi-label">Custas</span><span class="redesign-summary-kpi-value">0,00</span><span class="redesign-summary-kpi-meta">total lançado</span></div>';
      var anchor = summaryCard.querySelector('.summary-panels') || summaryCard.querySelector('.table-wrap') || summaryCard.lastElementChild;
      summaryCard.insertBefore(kpis, anchor);
    }

    function readText(selector, fallback){
      var node = document.querySelector(selector);
      return (node && node.textContent ? node.textContent.trim() : '') || fallback;
    }

    function update(){
      var selector = document.getElementById('launchSelector');
      var footLast = document.querySelector('#summaryTableFoot td:last-child');
      var honorariosEnabled = document.getElementById('honorariosEnabled');
      var honorariosValor = readText('#honorariosResumo .summary-stat:last-child .summary-stat-value', 'Ativos');
      var custasValor = readText('#custasResumo .summary-stat:last-child .summary-stat-value', '0,00');
      var verbaCount = selector ? Array.prototype.slice.call(selector.options || []).filter(function(opt){ return !!opt.value; }).length : 0;

      setKpi('verbas', String(verbaCount), verbaCount === 1 ? '1 verba cadastrada' : verbaCount + ' verbas cadastradas');
      setKpi('total', footLast ? footLast.textContent.trim() : '0,00', 'valor devido consolidado');
      if (honorariosEnabled && honorariosEnabled.checked) setKpi('honorarios', honorariosValor, 'base configurada');
      else setKpi('honorarios', 'Desativados', 'sem incidência no resumo');
      setKpi('custas', custasValor, 'custas lançadas');
    }

    function setKpi(name, value, meta){
      var item = summaryCard.querySelector('.redesign-summary-kpi[data-kpi="' + name + '"]');
      if (!item) return;
      var valueNode = item.querySelector('.redesign-summary-kpi-value');
      var metaNode = item.querySelector('.redesign-summary-kpi-meta');
      if (valueNode) valueNode.textContent = value;
      if (metaNode) metaNode.textContent = meta;
    }

    if (!summaryCard.dataset.redesignKpiBound) {
      summaryCard.dataset.redesignKpiBound = '1';
      var debouncedUpdate = debounce(update, 100);
      ['summaryTableFoot','summaryTableBody','honorariosResumo','custasResumo','launchSelector'].forEach(function(id){
        var node = document.getElementById(id);
        if (!node || node._redesignKpiObserver) return;
        node._redesignKpiObserver = new MutationObserver(debouncedUpdate);
        node._redesignKpiObserver.observe(node, { childList:true, subtree:true, characterData:true });
      });
      var honorariosEnabled = document.getElementById('honorariosEnabled');
      if (honorariosEnabled) honorariosEnabled.addEventListener('change', update);
    }

    update();
  }

  function observeDynamicAreas(){
    var launchesHost = document.getElementById('launchesHost');
    if (!launchesHost || launchesHost.dataset.redesignObserverBound) return;
    launchesHost.dataset.redesignObserverBound = '1';
    var debouncedEnhance = debounce(enhanceLaunchCards, 100);
    launchesHost._redesignObserver = new MutationObserver(debouncedEnhance);
    launchesHost._redesignObserver.observe(launchesHost, { childList:true, subtree:true });
  }

  function enhanceLaunchCards(){
    var cards = Array.prototype.slice.call(document.querySelectorAll('#launchesHost .launch-card'));
    cards.forEach(function(card){
      if (card.dataset.redesignCardReady === '1') return;
      card.dataset.redesignCardReady = '1';

      var notes = Array.prototype.slice.call(card.querySelectorAll('.formula-note, .readonly-note'));
      if (notes.length) {
        var details = document.createElement('details');
        details.className = 'redesign-inline-help';
        details.innerHTML = '<summary>Ajuda técnica e fórmulas desta verba</summary><div class="redesign-inline-help-body"></div>';
        var body = details.querySelector('.redesign-inline-help-body');
        notes.forEach(function(note){ body.appendChild(note); });
        var tableWrap = card.querySelector('.table-wrap');
        if (tableWrap) card.insertBefore(details, tableWrap);
        else card.appendChild(details);
      }
    });
  }

  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
