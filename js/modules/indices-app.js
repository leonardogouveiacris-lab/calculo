(function(global){
  'use strict';
  if (global.CPIndicesAppLoaded) return;

  function $(id){ return document.getElementById(id); }
  function toast(msg){ var el = $('indicesToast'); if (el) el.textContent = msg || ''; }
  function report(msg){ var el = $('importReport'); if (el) el.textContent = msg || ''; }

  function renderTables(){
    var tbody = $('idxTablesBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var activeDeposito = CPIndices.getActiveTable('deposito-recursal');
    CPIndices.listTables().forEach(function(t){
      var isActive = !!(activeDeposito && activeDeposito.id === t.id);
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + t.id + (isActive ? ' <strong>(ativo)</strong>' : '') + '</td><td>' + t.nome + '</td><td>' + t.tipo + '</td><td>' + t.periodicidade + '</td><td>v' + t.versao + '</td><td>' + (t.updated_at || '-') + '</td><td><button data-action="edit" data-id="' + t.id + '">Editar</button> <button data-action="exp" data-id="' + t.id + '">Exportar</button></td>';
      tbody.appendChild(tr);
    });
  }

  function selectedTableFromForm(){
    return {
      id: $('tableId').value.trim(),
      nome: $('tableNome').value.trim(),
      tipo: $('tableTipo').value,
      fonte: $('tableFonte').value.trim(),
      periodicidade: $('tablePeriodicidade').value,
      vigencia_inicio: $('tableVigIni').value,
      vigencia_fim: $('tableVigFim').value,
      updated_by: $('tableUpdatedBy').value.trim() || 'ui-local',
      metadados: { origem: 'ui-indices' },
      serie: []
    };
  }

  function onSaveTable(){
    try {
      var table = selectedTableFromForm();
      CPIndices.saveTable(table, { upsert: true });
      toast('Tabela salva com sucesso.');
      renderTables();
    } catch (e){ toast('Erro: ' + (e.message || e)); }
  }

  function onAddSerie(){
    var tableId = $('tableId').value.trim();
    var competencia = $('serieComp').value.trim();
    var valor = Number($('serieVal').value);
    if (!tableId) return toast('Informe o ID da tabela.');
    try {
      CPIndices.saveTable({ id: tableId, nome: $('tableNome').value || tableId, tipo: $('tableTipo').value || 'misto', fonte: $('tableFonte').value || '', periodicidade: $('tablePeriodicidade').value || 'mensal', vigencia_inicio: $('tableVigIni').value || '', vigencia_fim: $('tableVigFim').value || '', updated_by: $('tableUpdatedBy').value || 'ui-local', serie: [{ competencia: competencia, valor: valor }] }, { upsert: true });
      toast('Linha upsert aplicada.');
      renderTables();
    } catch (e){ toast('Erro: ' + (e.message || e)); }
  }

  function onImport(){
    var file = $('importFile').files[0];
    if (!file) return;
    file.text().then(function(text){
      var kind = /\.csv$/i.test(file.name) ? 'csv' : 'json';
      var rep = CPIndices.importTablesFromText(text, kind, 'import-ui');
      toast('Importadas: ' + rep.imported + ' | Erros: ' + rep.errors.length);
      report(rep.errors.length ? rep.errors.join('\n') : 'Sem inconsistências.');
      renderTables();
    }).catch(function(err){ toast('Erro no import: ' + (err.message || err)); });
  }

  async function onImportApi(){
    var preset = $('apiPreset').value;
    var start = $('apiStart').value;
    var end = $('apiEnd').value;
    if (!start || !end) return toast('Informe data inicial e final para sincronizar via API.');
    try {
      var t = await CPIndices.ensureAutoTable(preset, start, end);
      toast('Sincronização via API concluída: ' + preset);
      report('Tabela sincronizada: ' + t.id + '\nFonte: ' + t.fonte + '\nVigência: ' + (t.vigencia_inicio || '-') + ' até ' + (t.vigencia_fim || '-') + '\nVersão: ' + t.versao + '\nLinhas: ' + ((t.serie || []).length));
      renderTables();
    } catch (e){ toast('Erro na API: ' + (e.message || e)); }
  }

  function onSetActiveDeposito(){
    var tableId = $('tableId').value.trim();
    if (!tableId) return toast('Informe o ID da tabela para marcar como ativa.');
    CPIndices.setActiveTable('deposito-recursal', tableId);
    toast('Tabela ativa para depósito recursal definida: ' + tableId);
    renderTables();
  }

  function onTableActions(ev){
    var btn = ev.target.closest('button[data-action]');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    var action = btn.getAttribute('data-action');
    if (action === 'edit') {
      var t = CPIndices.getTable(id);
      if (!t) return;
      $('tableId').value = t.id; $('tableNome').value = t.nome; $('tableTipo').value = t.tipo; $('tableFonte').value = t.fonte; $('tablePeriodicidade').value = t.periodicidade; $('tableVigIni').value = t.vigencia_inicio || ''; $('tableVigFim').value = t.vigencia_fim || ''; $('tableUpdatedBy').value = t.updated_by || '';
      toast('Tabela carregada para edição.');
    }
    if (action === 'exp') {
      var content = CPIndices.exportTable(id, 'json');
      var blob = new Blob([content], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = id + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    }
  }

  function initDefaults(){
    var today = new Date();
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var dd = String(today.getDate()).padStart(2, '0');
    var isoToday = today.getFullYear() + '-' + mm + '-' + dd;
    $('apiEnd').value = isoToday;
    $('apiStart').value = (today.getFullYear() - 5) + '-01-01';
  }

  function init(){
    $('btnSaveTable').addEventListener('click', onSaveTable);
    $('btnAddSerie').addEventListener('click', onAddSerie);
    $('btnImport').addEventListener('click', onImport);
    $('btnImportApi').addEventListener('click', onImportApi);
    $('btnSetActiveDeposito').addEventListener('click', onSetActiveDeposito);
    $('idxTablesBody').addEventListener('click', onTableActions);
    initDefaults();
    renderTables();
  }

  document.addEventListener('DOMContentLoaded', init);
  global.CPIndicesAppLoaded = true;
})(window);
