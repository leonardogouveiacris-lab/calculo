(function(){
  function ready(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true });
    else fn();
  }

  ready(function(){
    document.body.classList.add('redesign-ui');
    buildDashboardLayout();
    buildProgressTrail();
    enhanceDataCard();
    enhanceLaunchSection();
    setupSummaryKpis();
    setupSummaryDisclosure();
    observeDynamicAreas();
    enhanceLaunchCards();
    bindProgressInputs();
    syncProgressAndContext();
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

  function buildProgressTrail(){
    var tabDados = document.getElementById('tab-dados');
    var shell = tabDados && tabDados.querySelector('.civeis-dashboard');
    if (!shell || tabDados.querySelector('.redesign-progress')) return;

    var progress = document.createElement('section');
    progress.className = 'redesign-progress card';
    progress.innerHTML = '' +
      '<div class="redesign-progress-head">' +
        '<div><h2>Fluxo do cálculo</h2><div class="card-sub">Acompanhe a etapa atual e o que já foi configurado.</div></div>' +
      '</div>' +
      '<div class="redesign-progress-track" role="list" aria-label="Etapas do cálculo cível">' +
        progressItem('processo', 'Dados do processo', 'Preencha identificação e datas.') +
        progressItem('composicao', 'Composição do cálculo', 'Defina honorários e custas quando necessário.') +
        progressItem('verbas', 'Verbas', 'Crie ou selecione uma verba para editar.') +
        progressItem('relatorio', 'Relatório', 'Revise o resumo antes de gerar o relatório.') +
      '</div>' +
      '<div class="redesign-progress-status" id="redesignProgressStatus"></div>';
    tabDados.insertBefore(progress, shell);
  }

  function progressItem(key, title, sub){
    return '<div class="redesign-progress-step" data-step="' + key + '" role="listitem">' +
      '<span class="redesign-progress-badge" aria-hidden="true"></span>' +
      '<div class="redesign-progress-copy"><strong>' + title + '</strong><span>' + sub + '</span></div>' +
    '</div>';
  }

  function bindProgressInputs(){
    ['processo','requerente','requerido','ajuizamento','dataAtualizacao','honorariosEnabled'].forEach(function(id){
      var node = document.getElementById(id);
      if (!node || node.dataset.redesignProgressBound === '1') return;
      node.dataset.redesignProgressBound = '1';
      node.addEventListener('input', syncProgressAndContext);
      node.addEventListener('change', syncProgressAndContext);
    });
  }

  function enhanceDataCard(){
    var card = document.getElementById('cardDadosProcesso');
    if (!card || card.dataset.redesignReady === '1') return;
    card.dataset.redesignReady = '1';

    var row = card.querySelector('.row');
    if (row && !card.querySelector('.redesign-section-intro')) {
      var intro = document.createElement('div');
      intro.className = 'redesign-section-intro';
      intro.innerHTML = '<div class="redesign-section-kicker">Etapa 1</div><div class="redesign-section-note">Preencha apenas as informações essenciais para iniciar.</div>';
      card.insertBefore(intro, row);
    }
  }

  function enhanceLaunchSection(){
    var launchesCard = findCardByHeading('3. Lançamentos por verba');
    if (!launchesCard || launchesCard.dataset.redesignReady === '1') return;
    launchesCard.dataset.redesignReady = '1';

    var helpCopy = launchesCard.querySelector('.card-sub');
    if (helpCopy) {
      var details = document.createElement('details');
      details.className = 'redesign-help';
      details.innerHTML = '<summary>Detalhes técnicos do editor mensal</summary>' +
        '<div class="redesign-help-body"></div>';
      helpCopy.replaceWith(details);
      details.querySelector('.redesign-help-body').appendChild(helpCopy);
    }

    var inputRow = launchesCard.querySelector('.row');
    var btnRow = launchesCard.querySelector('.btn-row');
    var selectorBar = launchesCard.querySelector('.launch-selector');
    var launchesHost = document.getElementById('launchesHost');
    if (!inputRow || !btnRow || !selectorBar || !launchesHost) return;

    var secondaryActions = document.createElement('div');
    secondaryActions.className = 'redesign-secondary-actions';
    secondaryActions.innerHTML = '<div class="redesign-secondary-actions-copy">Ações gerais</div>';
    Array.prototype.slice.call(btnRow.children).forEach(function(child, index){
      if (index === 0) return;
      secondaryActions.appendChild(child);
    });

    var createSection = document.createElement('section');
    createSection.className = 'redesign-launch-create redesign-panel-section';
    createSection.innerHTML = '' +
      '<div class="redesign-launch-create-head">' +
        '<div>' +
          '<div class="redesign-section-kicker">Etapa 2</div>' +
          '<div class="redesign-launch-create-title">Nova verba</div>' +
          '<div class="redesign-launch-create-sub">Defina os itens que compõem o cálculo e crie a verba inicial.</div>' +
        '</div>' +
      '</div>';
    createSection.appendChild(inputRow);
    createSection.appendChild(btnRow);
    createSection.appendChild(secondaryActions);

    var content = document.createElement('div');
    content.className = 'redesign-launch-content';

    var nav = document.createElement('aside');
    nav.className = 'redesign-launch-nav redesign-panel-section';
    nav.innerHTML = '' +
      '<div class="redesign-launch-nav-head">' +
        '<div>' +
          '<div class="redesign-section-kicker">Etapa 3</div>' +
          '<div class="redesign-launch-nav-title">Editar verba selecionada</div>' +
          '<div class="redesign-launch-nav-meta" id="redesignLaunchNavMeta">Crie ou selecione uma verba para editar.</div>' +
        '</div>' +
      '</div>' +
      '<label for="redesignLaunchSearch">Localizar verba</label>' +
      '<input id="redesignLaunchSearch" class="redesign-launch-search" type="text" placeholder="Pesquisar por nome ou período">' +
      '<div class="redesign-launch-list" id="redesignLaunchList"></div>';

    var editor = document.createElement('div');
    editor.className = 'redesign-launch-editor';

    var editorShell = document.createElement('section');
    editorShell.className = 'redesign-launch-editor-shell redesign-panel-section';
    editorShell.innerHTML = '<div class="redesign-launch-editor-head"><div><div class="redesign-launch-editor-title">Editor da verba ativa</div><div class="redesign-launch-editor-sub" id="redesignActiveLaunchSummary">O editor técnico aparece após criar ou selecionar uma verba.</div></div></div>';
    editorShell.appendChild(selectorBar);
    editorShell.appendChild(launchesHost);

    editor.appendChild(editorShell);
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

    function render(){
      var term = (search.value || '').trim().toLowerCase();
      var options = Array.prototype.slice.call(selector.options || []).filter(function(opt){ return !!opt.value; });
      if (meta) meta.textContent = options.length ? options.length + ' verba(s) cadastrada(s)' : 'Nenhuma verba cadastrada';

      var filtered = options.filter(function(opt){
        var haystack = [opt.textContent, opt.getAttribute('data-periodo'), opt.getAttribute('data-total'), opt.getAttribute('data-competencias')].join(' ').toLowerCase();
        return !term || haystack.indexOf(term) >= 0;
      });

      if (!filtered.length) {
        list.innerHTML = '<div class="redesign-launch-empty">Nenhuma verba encontrada com esse filtro.</div>';
        return;
      }

      list.innerHTML = filtered.map(function(opt){
        var active = String(opt.value) === String(selector.value);
        var title = opt.getAttribute('data-title') || opt.textContent;
        var periodo = opt.getAttribute('data-periodo') || 'Período não informado';
        var competencias = opt.getAttribute('data-competencias') || '0 competência(s)';
        var total = opt.getAttribute('data-total') || '0,00';
        var status = opt.getAttribute('data-status') || 'Em edição';
        return '' +
          '<button type="button" class="redesign-launch-item' + (active ? ' is-active' : '') + '" data-value="' + escapeHtml(opt.value) + '">' +
            '<span class="redesign-launch-item-top"><span class="redesign-launch-item-title">' + escapeHtml(title) + '</span><span class="redesign-launch-item-status">' + escapeHtml(status) + '</span></span>' +
            '<span class="redesign-launch-item-meta">' + escapeHtml(periodo) + ' • ' + escapeHtml(competencias) + '</span>' +
            '<span class="redesign-launch-item-total">Total atual: ' + escapeHtml(total) + '</span>' +
          '</button>';
      }).join('');
    }

    if (!selector.dataset.redesignNavBound) {
      selector.dataset.redesignNavBound = '1';
      selector.addEventListener('change', function(){ render(); syncProgressAndContext(); });
      search.addEventListener('input', render);
      list.addEventListener('click', function(event){
        var btn = event.target.closest('.redesign-launch-item');
        if (!btn) return;
        selector.value = btn.getAttribute('data-value') || '';
        selector.dispatchEvent(new Event('change', { bubbles:true }));
      });
      new MutationObserver(function(){ render(); syncProgressAndContext(); }).observe(selector, { childList:true, subtree:true, characterData:true, attributes:true });
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
        kpi('verbas', 'Quantidade de verbas', '0', 'nenhuma verba cadastrada') +
        kpi('corrigido', 'Valor corrigido total', '0,00', 'subtotal corrigido') +
        kpi('juros', 'Juros total', '0,00', 'juros acumulados') +
        kpi('devido', 'Valor devido', '0,00', 'total consolidado') +
        kpi('honorarios', 'Honorários', 'Desativados', 'configure sob demanda') +
        kpi('custas', 'Custas', '0,00', 'configure sob demanda');
      var anchor = summaryCard.querySelector('.summary-panels') || summaryCard.querySelector('.table-wrap') || summaryCard.lastElementChild;
      summaryCard.insertBefore(kpis, anchor);
    }

    function readText(selector, fallback){
      var node = document.querySelector(selector);
      return (node && node.textContent ? node.textContent.trim() : '') || fallback;
    }

    function readFootCell(index, fallback){
      var node = document.querySelectorAll('#summaryTableFoot td')[index];
      return node && node.textContent ? node.textContent.trim() : fallback;
    }

    function update(){
      var selector = document.getElementById('launchSelector');
      var honorariosEnabled = document.getElementById('honorariosEnabled');
      var verbaCount = selector ? Array.prototype.slice.call(selector.options || []).filter(function(opt){ return !!opt.value; }).length : 0;
      var corrigido = readFootCell(1, '0,00');
      var juros = readFootCell(2, '0,00');
      var devido = readFootCell(3, '0,00');
      var honorariosValor = readText('#honorariosResumo .summary-stat:last-child .summary-stat-value', honorariosEnabled && honorariosEnabled.checked ? '0,00' : 'Desativados');
      var custasValor = readText('#custasResumo .summary-stat:last-child .summary-stat-value', '0,00');

      setKpi('verbas', String(verbaCount), verbaCount ? (verbaCount === 1 ? '1 verba cadastrada' : verbaCount + ' verbas cadastradas') : 'cadastre a primeira verba');
      setKpi('corrigido', corrigido, 'subtotal corrigido');
      setKpi('juros', juros, 'juros acumulados');
      setKpi('devido', devido, 'total consolidado');
      setKpi('honorarios', honorariosEnabled && honorariosEnabled.checked ? honorariosValor : 'Desativados', honorariosEnabled && honorariosEnabled.checked ? 'incidência configurada' : 'abra para configurar');
      setKpi('custas', custasValor, custasValor === '0,00' ? 'abra para lançar' : 'custas cadastradas');
      syncSummaryTableState(verbaCount);
      syncProgressAndContext();
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
      ['summaryTableFoot','summaryTableBody','honorariosResumo','custasResumo','launchSelector'].forEach(function(id){
        var node = document.getElementById(id);
        if (node) new MutationObserver(update).observe(node, { childList:true, subtree:true, characterData:true, attributes:true });
      });
      var honorariosEnabled = document.getElementById('honorariosEnabled');
      if (honorariosEnabled) honorariosEnabled.addEventListener('change', update);
    }

    update();
  }

  function kpi(name, label, value, meta){
    return '<div class="redesign-summary-kpi" data-kpi="' + name + '"><span class="redesign-summary-kpi-label">' + label + '</span><span class="redesign-summary-kpi-value">' + value + '</span><span class="redesign-summary-kpi-meta">' + meta + '</span></div>';
  }

  function setupSummaryDisclosure(){
    var summaryCard = document.getElementById('cardResumoCalculoCivil');
    if (!summaryCard || summaryCard.dataset.redesignDisclosureBound === '1') return;
    summaryCard.dataset.redesignDisclosureBound = '1';

    var panels = summaryCard.querySelectorAll('.summary-panel');
    Array.prototype.forEach.call(panels, function(panel){
      var title = panel.querySelector('.summary-panel-title');
      if (!title) return;
      var titleText = title.textContent.trim();
      panel.classList.add('is-collapsible');
      if (titleText === 'Honorários') panel.setAttribute('data-panel-key', 'honorarios');
      if (titleText === 'Custas') panel.setAttribute('data-panel-key', 'custas');
      if (panel.querySelector('.summary-panel-toggle')) return;
      var header = panel.querySelector('.summary-panel-headrow');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-ghost summary-panel-toggle';
      btn.textContent = 'Expandir';
      btn.addEventListener('click', function(){
        panel.classList.toggle('is-open');
        btn.textContent = panel.classList.contains('is-open') ? 'Recolher' : 'Expandir';
      });
      if (header) header.appendChild(btn);
    });
  }

  function syncSummaryTableState(verbaCount){
    var disclosure = document.querySelector('.summary-table-disclosure');
    if (!disclosure) return;
    disclosure.classList.toggle('is-empty', !verbaCount);
    if (verbaCount && !disclosure.dataset.userToggled) disclosure.open = false;
    if (!verbaCount) disclosure.open = false;
    if (!disclosure.dataset.bound) {
      disclosure.dataset.bound = '1';
      disclosure.addEventListener('toggle', function(){ disclosure.dataset.userToggled = '1'; });
    }
  }

  function observeDynamicAreas(){
    var launchesHost = document.getElementById('launchesHost');
    if (!launchesHost || launchesHost.dataset.redesignObserverBound) return;
    launchesHost.dataset.redesignObserverBound = '1';
    new MutationObserver(function(){ enhanceLaunchCards(); syncProgressAndContext(); }).observe(launchesHost, { childList:true, subtree:true, characterData:true, attributes:true });
  }

  function enhanceLaunchCards(){
    var cards = Array.prototype.slice.call(document.querySelectorAll('#launchesHost .launch-card'));
    cards.forEach(function(card){
      if (card.dataset.redesignCardReady === '1') return;
      card.dataset.redesignCardReady = '1';

      var inlineTools = card.querySelector('.inline-tools');
      if (inlineTools && !inlineTools.closest('details')) {
        var advanced = document.createElement('details');
        advanced.className = 'redesign-advanced-tools';
        advanced.innerHTML = '<summary>Ações e configurações avançadas</summary>';
        inlineTools.parentNode.insertBefore(advanced, inlineTools);
        advanced.appendChild(inlineTools);
      }

      var notes = Array.prototype.slice.call(card.querySelectorAll('.formula-note, .readonly-note'));
      if (notes.length) {
        var details = document.createElement('details');
        details.className = 'redesign-inline-help';
        details.innerHTML = '<summary>Detalhes técnicos desta verba</summary><div class="redesign-inline-help-body"></div>';
        var body = details.querySelector('.redesign-inline-help-body');
        notes.forEach(function(note){ body.appendChild(note); });
        var tableWrap = card.querySelector('.table-wrap');
        if (tableWrap) card.insertBefore(details, tableWrap);
        else card.appendChild(details);
      }

      var table = card.querySelector('.editor-table');
      if (table) {
        table.classList.add('redesign-monthly-table');
        Array.prototype.forEach.call(table.querySelectorAll('th, td'), function(cell, index){
          if (index === 0) cell.classList.add('sticky-first-col');
        });
      }
    });

    var launchesHost = document.getElementById('launchesHost');
    if (launchesHost && !cards.length && !launchesHost.querySelector('.empty-state')) {
      launchesHost.innerHTML = '<div class="empty-state">O editor técnico aparece aqui após criar ou selecionar uma verba.</div>';
    }
  }

  function syncProgressAndContext(){
    var processFilled = !!readValue('processo');
    var verbaOptions = Array.prototype.slice.call((document.getElementById('launchSelector') || {}).options || []).filter(function(opt){ return !!opt.value; });
    var hasVerba = verbaOptions.length > 0;
    var honorariosOn = !!(document.getElementById('honorariosEnabled') || {}).checked;
    var custasValue = (document.querySelector('#custasResumo .summary-stat:last-child .summary-stat-value') || {}).textContent || '0,00';
    var hasComposicao = honorariosOn || normalizeNumberText(custasValue) > 0;
    var reportReady = processFilled && hasVerba;

    setStepState('processo', processFilled);
    setStepState('composicao', hasComposicao);
    setStepState('verbas', hasVerba);
    setStepState('relatorio', reportReady);

    var status = document.getElementById('redesignProgressStatus');
    if (status) {
      var parts = [
        processFilled ? 'Processo preenchido' : 'Preencha o número do processo',
        hasVerba ? verbaOptions.length + ' verba(s) cadastrada(s)' : 'Cadastre a primeira verba',
        hasComposicao ? 'Composição configurada' : 'Honorários e custas opcionais'
      ];
      status.textContent = parts.join(' • ');
    }

    var selector = document.getElementById('launchSelector');
    var option = selector && selector.selectedOptions && selector.selectedOptions[0];
    var summaryNode = document.getElementById('redesignActiveLaunchSummary');
    if (summaryNode) {
      if (option && option.value) {
        var title = option.getAttribute('data-title') || option.textContent || 'Verba';
        var periodo = option.getAttribute('data-periodo') || 'Período não informado';
        var competencias = option.getAttribute('data-competencias') || '0 competência(s)';
        var total = option.getAttribute('data-total') || '0,00';
        summaryNode.textContent = title + ' • ' + periodo + ' • ' + competencias + ' • Total: ' + total;
      } else {
        summaryNode.textContent = 'O editor técnico aparece após criar ou selecionar uma verba.';
      }
    }
  }

  function setStepState(step, complete){
    var node = document.querySelector('.redesign-progress-step[data-step="' + step + '"]');
    if (!node) return;
    node.classList.toggle('is-complete', !!complete);
  }

  function readValue(id){
    var node = document.getElementById(id);
    return node && node.value ? String(node.value).trim() : '';
  }

  function normalizeNumberText(text){
    return Number(String(text || '0').replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '')) || 0;
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
