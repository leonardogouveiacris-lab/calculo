(function(){
  var root = window.CPSolicitacoes = window.CPSolicitacoes || {};
  if (root.reportModuleLoaded) return;

  function getReportLogo(){
    return (root.store.logoDataUrl && String(root.store.logoDataUrl).trim()) ? root.store.logoDataUrl : CPPrintLayout.defaults.logo;
  }

  function getReportBranding(){
    return {
      header: root.store.header,
      footer: root.store.footer,
      logo: getReportLogo()
    };
  }

  function renderReportHeaderFooter(){
    if (!window.CPPrintLayout) return;
    CPPrintLayout.applyReportBranding(document.getElementById('reportRoot'), getReportBranding());
  }

  function syncHeaderFooterInputs(){
    var E = root.E;
    if (E('inHdrNome')) E('inHdrNome').value = root.store.header.nome || '';
    if (E('inHdrTel')) E('inHdrTel').value = root.store.header.tel || '';
    if (E('inHdrEmail')) E('inHdrEmail').value = root.store.header.email || '';
    if (E('inFtrL1')) E('inFtrL1').value = root.store.footer.l1 || '';
    if (E('inFtrL2')) E('inFtrL2').value = root.store.footer.l2 || '';
    if (E('inFtrSite')) E('inFtrSite').value = root.store.footer.site || '';
    if (E('inFtrEmp')) E('inFtrEmp').value = root.store.footer.emp || '';
  }

  function bindHeaderFooterInputs(){
    var E = root.E;
    function bindText(id, setter){
      var node = E(id);
      if (!node) return;
      node.addEventListener('input', function(event){
        setter(String(event.target.value || ''));
        renderReportHeaderFooter();
      });
    }
    bindText('inHdrNome', function(value){ root.store.header.nome = value; });
    bindText('inHdrTel', function(value){ root.store.header.tel = value; });
    bindText('inHdrEmail', function(value){ root.store.header.email = value; });
    bindText('inFtrL1', function(value){ root.store.footer.l1 = value; });
    bindText('inFtrL2', function(value){ root.store.footer.l2 = value; });
    bindText('inFtrSite', function(value){ root.store.footer.site = value; });
    bindText('inFtrEmp', function(value){ root.store.footer.emp = value; });
  }

  function compactName(full){
    var parts = String(full || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0];
    return parts[0] + ' ' + parts[parts.length - 1];
  }

  function compactService(service){
    var text = String(service || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    text = text.replace(/C[áa]lculo\s*Inicial/ig,'Cálc. Ini.');
    text = text.replace(/Urg[êe]ncia/ig,'Urg.');
    text = text.replace(/adicional\s*de\s*urg[êe]ncia/ig,'Urg.');
    text = text.replace(/Atualiza[cç][ãa]o\s*banc[áa]ria/ig,'At. Banc.');
    if (text.length > 28) text = text.slice(0, 28).trimEnd() + '.';
    return text;
  }

  function sanitizeFilename(name){
    return String(name || '').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function compactProc(proc){ return String(proc || '').trim(); }

  function gerarDescricaoNF(){
    var itens = [];
    root.store.currentRows.forEach(function(row){
      var key = root.rowKey(row);
      if (!root.store.selectedRowKeys.has(key)) return;
      var data = String(row['Entrega em'] || '').trim();
      var proc = compactProc(row['Numero do Processo']);
      var nome = compactName(row['Reclamante']);
      var serv = compactService(row['Serviços']);
      var total = root.parseCurrencyBRL(row['Total (Total)']);
      var linha = data + ' Proc. ' + proc + ' ' + nome;
      if (serv) linha += ' ' + serv;
      if (total) linha += ' ' + root.toBRL(total);
      linha = linha.replace(/\s+/g, ' ').trim();
      itens.push(linha);
    });
    var texto = itens.join('; ');
    var out = root.E('nfDescricaoOutput');
    if (out) out.value = texto;
    if (!itens.length) alert('Selecione pelo menos uma linha (checkbox) para gerar a descrição.');
  }


  function buildMetaText(){
    return root.E('solicitacoesTotalCount').textContent + ' • ' +
      root.E('solicitacoesSumTotal').textContent + ' • ' +
      root.E('solicitacoesCompetencia').textContent + ' • Cliente: ' + root.store.currentClient;
  }

  function createSolicPage(rootEl, pageIndex, metaText, includeTitle){
    return CPPrintLayout.createPage(rootEl, {
      pageIndex: pageIndex,
      includeTitle: includeTitle,
      title: 'RELATÓRIO DE SOLICITAÇÕES',
      meta: metaText,
      logo: getReportLogo(),
      header: root.store.header,
      footer: root.store.footer,
      contentHtml: '<table class="report-table"><thead><tr>' + root.COLUMNS.map(function(column){ return '<th>' + column + '</th>'; }).join('') + '</tr></thead><tbody></tbody></table>'
    });
  }

  function createSolicRow(row){
    var tr = document.createElement('tr');
    root.COLUMNS.forEach(function(column){ tr.appendChild(CPCommon.cell('td', row[column] == null ? '' : row[column])); });
    return tr;
  }

  function rowFitsInPage(page){
    return CPPrintLayout.pageHasRoom(page, '.footer', 8);
  }

  function buildReport(){
    renderReportHeaderFooter();
    var rootEl = root.E('reportRoot');
    rootEl.classList.add('solic-paged');
    rootEl.classList.add('cp-report-root');
    var meta = buildMetaText();
    rootEl.innerHTML = '';

    var pageIndex = 1;
    var page = createSolicPage(rootEl, pageIndex, meta, true);
    var tbody = page.querySelector('tbody');

    if (!root.store.currentRows.length) return;

    root.store.currentRows.forEach(function(row){
      var tr = createSolicRow(row);
      tbody.appendChild(tr);
      if (!rowFitsInPage(page)) {
        tr.remove();
        pageIndex += 1;
        page = createSolicPage(rootEl, pageIndex, meta, false);
        tbody = page.querySelector('tbody');
        tbody.appendChild(tr);
      }
    });

    Array.from(rootEl.querySelectorAll('.page')).forEach(function(pg){
      if (!pg.querySelectorAll('tbody tr').length) pg.remove();
    });

    if (!rootEl.querySelector('.page')) createSolicPage(rootEl, 1, meta, true);
    renderReportHeaderFooter();
  }

  function goReport(){
    root.switchTab('report');
    buildReport();
    var reportRoot = root.E('reportRoot');
    if (reportRoot) reportRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function printReport(){
    if (!root.store.currentRows.length) return alert('Nenhum dado disponível para imprimir.');
    var fileTitle = sanitizeFilename((root.store.competenciaAtual === '—' ? 'Sem competência' : root.store.competenciaAtual) + ' - ' + root.store.currentClient) || 'solicitacoes';
    root.switchTab('report');
    buildReport();
    var reportRoot = root.E('reportRoot');
    if (!reportRoot || !window.CPPrintLayout || !CPPrintLayout.printRootInHost) {
      return window.print();
    }
    CPPrintLayout.printRootInHost(reportRoot, 'solicitacoes-print', fileTitle);
  }

  root.renderReportHeaderFooter = renderReportHeaderFooter;
  root.syncHeaderFooterInputs = syncHeaderFooterInputs;
  root.bindHeaderFooterInputs = bindHeaderFooterInputs;
  root.gerarDescricaoNF = gerarDescricaoNF;
  root.buildReport = buildReport;
  root.goReport = goReport;
  root.printReport = printReport;
  root.reportModuleLoaded = true;
})();
