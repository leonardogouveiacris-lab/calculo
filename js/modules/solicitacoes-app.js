window.CPFeatureFlags = Object.assign({ useCentralIndices: true }, window.CPFeatureFlags || {});
(function(){
  var root = window.CPSolicitacoes = window.CPSolicitacoes || {};
  var store = root.store;
  var E = root.E;

  function sortRows(rows){
    var arr = rows.slice();
    function cmpStr(a, b){ return String(a || '').localeCompare(String(b || ''), 'pt-BR', { sensitivity: 'base' }); }
    arr.sort(function(ra, rb){
      if (store.sortMode === 'date_desc' || store.sortMode === 'date_asc') {
        var da = root.parseDateAny(ra['Entrega em']);
        var db = root.parseDateAny(rb['Entrega em']);
        var va = da ? da.getTime() : -Infinity;
        var vb = db ? db.getTime() : -Infinity;
        return store.sortMode === 'date_asc' ? (va - vb) : (vb - va);
      }
      if (store.sortMode === 'total_desc' || store.sortMode === 'total_asc') {
        var ta = root.parseCurrencyBRL(ra['Total (Total)']);
        var tb = root.parseCurrencyBRL(rb['Total (Total)']);
        return store.sortMode === 'total_asc' ? (ta - tb) : (tb - ta);
      }
      if (store.sortMode === 'cliente_asc' || store.sortMode === 'cliente_desc') {
        var vc = cmpStr(ra['Contato: Primeiro nome'], rb['Contato: Primeiro nome']);
        return store.sortMode === 'cliente_asc' ? vc : -vc;
      }
      if (store.sortMode === 'reclamada_asc' || store.sortMode === 'reclamada_desc') {
        var vr = cmpStr(ra['Reclamada'], rb['Reclamada']);
        return store.sortMode === 'reclamada_asc' ? vr : -vr;
      }
      if (store.sortMode === 'proc_asc' || store.sortMode === 'proc_desc') {
        var vp = cmpStr(ra['Numero do Processo'], rb['Numero do Processo']);
        return store.sortMode === 'proc_asc' ? vp : -vp;
      }
      return 0;
    });
    return arr;
  }

  function applyFilters(){
    store.currentClient = E('solicitacoesClienteSelect').value || '(Todos)';
    var rows = store.allRows.slice();
    if (store.currentClient !== '(Todos)') {
      rows = rows.filter(function(row){ return String(row['Contato: Primeiro nome'] || '').trim() === store.currentClient; });
    }
    if (store.selectedReclamadas.size) {
      rows = rows.filter(function(row){ return store.selectedReclamadas.has(String(row['Reclamada'] || '').trim()); });
    }
    rows = sortRows(rows);
    store.currentRows = rows;
    root.renderTable(rows);
  }

  function computeFillRate(rows, column){
    if (!rows.length) return 0;
    var filled = rows.filter(function(row){ return String(row[column] || '').trim() !== ''; }).length;
    return filled / rows.length;
  }

  function validateImportQuality(rows){
    if (!rows.length) return { ok: true };
    var keyColumns = ['Entrega em','Contato: Primeiro nome','Reclamada','Serviços','Total (Total)'];
    var rates = {};
    keyColumns.forEach(function(column){ rates[column] = computeFillRate(rows, column); });
    var lowCoverage = keyColumns.filter(function(column){ return rates[column] < 0.2; }).length;
    var onlyReclamante = computeFillRate(rows, 'Reclamante') >= 0.6 && keyColumns.every(function(column){ return rates[column] < 0.1; });
    var verySparse = lowCoverage >= 4;
    return {
      ok: !(onlyReclamante || verySparse),
      rates: rates
    };
  }

  function afterImport(data){
    var normalized = root.normalizeAndFormat(data);
    var quality = validateImportQuality(normalized);
    if (!quality.ok) {
      alert(
        'Layout de planilha incompatível para importação.\\n\\n' +
        'Verifique os cabeçalhos esperados: Entrega em, Contato: Primeiro nome, Reclamada, Serviços e Total (Total).'
      );
      return false;
    }

    store.allRows = normalized;
    store.currentRows = store.allRows.slice();
    store.selectedRowIds.clear();

    var clients = Array.from(new Set(store.allRows.map(function(row){ return String(row['Contato: Primeiro nome'] || '').trim(); }).filter(Boolean)))
      .sort(function(a, b){ return a.localeCompare(b); });
    root.setClientOptions(clients);

    var reclamadas = Array.from(new Set(store.allRows.map(function(row){ return String(row['Reclamada'] || '').trim(); }).filter(Boolean)))
      .sort(function(a, b){ return a.localeCompare(b); });
    store.selectedReclamadas.clear();
    root.setReclamadaDropdown(reclamadas);
    root.updateReclamadaBtnLabel();
    applyFilters();
    return true;
  }

  async function handleFileImport(event){
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    E('solicitacoesFileName').textContent = file.name;
    try {
      var data = [];
      if (/\.csv$/i.test(file.name)) {
        data = root.parseCSV(await file.text());
      } else if (/\.(xlsx|xls)$/i.test(file.name)) {
        if (!window.XLSX) throw new Error('SheetJS não carregado');
        var workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
      } else {
        throw new Error('Formato não suportado');
      }
      afterImport(data);
    } catch (error) {
      alert('Erro ao importar arquivo: ' + (error.message || error));
    }
  }

  function clearFilters(){
    E('solicitacoesClienteSelect').value = '(Todos)';
    store.selectedReclamadas.clear();
    E('solicitacoesReclamadaList').querySelectorAll('input[type="checkbox"]').forEach(function(ch){ ch.checked = false; });
    root.updateReclamadaBtnLabel();
    applyFilters();
  }

  function clearData(){
    root.resetDataState(store);
    root.clearDataView();
    root.renderTable([]);
  }

  function selectAllFiltered(){
    if (!store.currentRows.length) return;
    store.currentRows.forEach(function(row){ var rowId = root.getRowId(row); if (rowId) store.selectedRowIds.add(rowId); });
    root.renderTable(store.currentRows);
  }

  function clearSelection(){
    store.selectedRowIds.clear();
    root.renderTable(store.currentRows);
  }

  function exportVisible(){
    if (!store.currentRows.length) return alert('Nenhum dado disponível para exportar.');
    if (!window.XLSX) return alert('SheetJS não carregado.');
    var rows = store.currentRows.map(function(row){
      return {
        'Entrega em': row['Entrega em'],
        'Cliente': row['Contato: Primeiro nome'],
        'Número do Processo': row['Numero do Processo'],
        'Reclamante': row['Reclamante'],
        'Reclamada': row['Reclamada'],
        'Serviço': row['Serviços'],
        'Total': row['Total (Total)']
      };
    });
    var ws = XLSX.utils.json_to_sheet(rows);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Solicitacoes');
    var d = new Date();
    var stamp = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    XLSX.writeFile(wb, 'solicitacoes_' + stamp + '.xlsx');
  }

  function bindReclamadaControls(){
    E('solicitacoesReclamadaBtn').addEventListener('click', function(event){
      event.stopPropagation();
      var panel = E('reclamadaPanel');
      panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    });
    E('reclamadaPanel').addEventListener('click', function(event){ event.stopPropagation(); });
    document.addEventListener('click', function(){ E('reclamadaPanel').style.display = 'none'; });
    E('solicitacoesReclamadaSearch').addEventListener('input', function(){
      var query = E('solicitacoesReclamadaSearch').value.toLowerCase();
      E('solicitacoesReclamadaList').querySelectorAll('[data-item="1"]').forEach(function(node){
        node.style.display = node.textContent.toLowerCase().includes(query) ? 'flex' : 'none';
      });
    });
    E('solicitacoesReclamadaMarkAll').addEventListener('click', function(){
      E('solicitacoesReclamadaList').querySelectorAll('input[type="checkbox"]').forEach(function(ch){
        ch.checked = true;
        store.selectedReclamadas.add(ch.dataset.reclamada || '');
      });
      root.updateReclamadaBtnLabel();
      applyFilters();
    });
    E('solicitacoesReclamadaClear').addEventListener('click', function(){
      E('solicitacoesReclamadaList').querySelectorAll('input[type="checkbox"]').forEach(function(ch){ ch.checked = false; });
      store.selectedReclamadas.clear();
      root.updateReclamadaBtnLabel();
      applyFilters();
    });
  }

  function bindEvents(){
    E('btnBack').addEventListener('click', function(){ location.href = 'index.html'; });
    E('solicitacoesFileInput').addEventListener('change', handleFileImport);
    E('solicitacoesClienteSelect').addEventListener('change', applyFilters);
    E('solicitacoesLimparFiltroBtn').addEventListener('click', clearFilters);
    E('solicitacoesLimparDadosBtn').addEventListener('click', clearData);
    E('solicitacoesExportBtn').addEventListener('click', exportVisible);
    E('btnBuildReport').addEventListener('click', root.goReport);
    E('btnPrint').addEventListener('click', root.printReport);
    E('btnPrint2').addEventListener('click', root.printReport);
    E('btnBackToData').addEventListener('click', function(){ root.switchTab('editor'); });
    E('tabBtnEditor').addEventListener('click', function(){ root.switchTab('editor'); });
    E('tabBtnReport').addEventListener('click', function(){ root.switchTab('report'); });
    E('btnSelectAllFiltered').addEventListener('click', selectAllFiltered);
    E('btnClearSelection').addEventListener('click', clearSelection);
    E('btnGerarDescricaoNF').addEventListener('click', root.gerarDescricaoNF);
    E('sortSelect').addEventListener('change', function(){
      store.sortMode = E('sortSelect').value || 'date_desc';
      applyFilters();
    });
    bindReclamadaControls();
  }

  function init(){
    root.applyFilters = applyFilters;
    root.renderTable([]);
    root.updateReclamadaBtnLabel();
    root.syncHeaderFooterInputs();
    root.bindHeaderFooterInputs();
    root.renderReportHeaderFooter();
    root.switchTab('editor');
    var sort = E('sortSelect');
    if (sort) sort.value = store.sortMode;
    bindEvents();
  }

  init();
})();
