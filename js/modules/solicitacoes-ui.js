(function(){
  var root = window.CPSolicitacoes = window.CPSolicitacoes || {};
  if (root.uiModuleLoaded) return;

  function E(id){ return document.getElementById(id); }

  function updateCompetencia(rows){
    var map = new Map();
    rows.forEach(function(row){
      var date = root.parseDateAny(row['Entrega em']);
      if (!date) return;
      var key = date.getUTCFullYear() + '-' + String(date.getUTCMonth() + 1).padStart(2, '0');
      map.set(key, (map.get(key) || 0) + 1);
    });
    var winner = null;
    var best = -1;
    map.forEach(function(count, key){
      if (count > best || (count === best && key > winner)) {
        best = count;
        winner = key;
      }
    });
    if (!winner) {
      root.store.competenciaAtual = '—';
      E('solicitacoesCompetencia').textContent = 'Competência: —';
      return;
    }
    var parts = winner.split('-').map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, 1));
    var mes = date.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' });
    root.store.competenciaAtual = mes.charAt(0).toUpperCase() + mes.slice(1) + ' de ' + parts[0];
    E('solicitacoesCompetencia').textContent = 'Competência: ' + root.store.competenciaAtual;
  }

  function updateMeta(rows){
    E('solicitacoesTotalCount').textContent = rows.length + ' solicitações';
    E('solicitacoesSumTotal').textContent = root.toBRL(rows.reduce(function(acc, row){
      return acc + root.parseCurrencyBRL(row['Total (Total)']);
    }, 0));
    updateCompetencia(rows);
  }

  function updateReclamadaBtnLabel(){
    var values = Array.from(root.store.selectedReclamadas);
    E('solicitacoesReclamadaBtn').textContent = !values.length
      ? 'Reclamada: (Todas)'
      : values.length <= 2
        ? 'Reclamada: ' + values.join(', ')
        : 'Reclamada: ' + values.length + ' selecionadas';
  }

  function setClientOptions(clients){
    var select = E('solicitacoesClienteSelect');
    CPCommon.clear(select);
    ['(Todos)'].concat(clients).forEach(function(client){
      var option = document.createElement('option');
      option.value = client;
      option.textContent = client;
      select.appendChild(option);
    });
  }

  function setReclamadaDropdown(values){
    var host = E('solicitacoesReclamadaList');
    CPCommon.clear(host);
    values.forEach(function(value, index){
      var label = document.createElement('label');
      label.setAttribute('data-item', '1');
      label.style.display = 'flex';
      label.style.gap = '8px';
      label.style.padding = '4px 0';

      var input = document.createElement('input');
      input.type = 'checkbox';
      input.id = 'rec_' + index;
      input.dataset.reclamada = value;
      input.addEventListener('change', function(){
        if (input.checked) root.store.selectedReclamadas.add(value);
        else root.store.selectedReclamadas.delete(value);
        updateReclamadaBtnLabel();
        root.applyFilters();
      });

      var span = document.createElement('span');
      span.textContent = value;
      label.appendChild(input);
      label.appendChild(span);
      host.appendChild(label);
    });
  }

  function renderTable(rows){
    var thead = E('solicitacoesThead');
    var tbody = E('solicitacoesTbody');
    CPCommon.clear(thead);
    CPCommon.clear(tbody);

    function getVisibleRowIds(){
      return rows.map(function(row){ return root.getRowId(row); }).filter(Boolean);
    }

    function syncMasterCheckbox(masterCheckbox){
      if (!masterCheckbox) return;
      var visibleIds = getVisibleRowIds();
      if (!visibleIds.length) {
        masterCheckbox.checked = false;
        masterCheckbox.indeterminate = false;
        return;
      }
      var selectedCount = visibleIds.reduce(function(acc, id){
        return acc + (root.store.selectedRowIds.has(id) ? 1 : 0);
      }, 0);
      masterCheckbox.checked = selectedCount === visibleIds.length;
      masterCheckbox.indeterminate = selectedCount > 0 && selectedCount < visibleIds.length;
    }

    var headRow = document.createElement('tr');
    var thCheck = document.createElement('th');
    thCheck.className = 'center';
    var masterInput = document.createElement('input');
    masterInput.type = 'checkbox';
    masterInput.setAttribute('aria-label', 'Selecionar linhas visíveis');
    masterInput.addEventListener('change', function(){
      var visibleIds = getVisibleRowIds();
      visibleIds.forEach(function(id){
        if (masterInput.checked) root.store.selectedRowIds.add(id);
        else root.store.selectedRowIds.delete(id);
      });
      tbody.querySelectorAll('input[type="checkbox"][data-row-id]').forEach(function(input){
        input.checked = masterInput.checked;
      });
      syncMasterCheckbox(masterInput);
    });
    thCheck.appendChild(masterInput);
    headRow.appendChild(thCheck);
    root.COLUMNS.forEach(function(column){ headRow.appendChild(CPCommon.cell('th', column)); });
    thead.appendChild(headRow);

    rows.forEach(function(row){
      var tr = document.createElement('tr');
      var key = root.getRowId(row);
      var tdCheck = document.createElement('td');
      tdCheck.className = 'center';
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.dataset.rowId = key;
      input.checked = !!key && root.store.selectedRowIds.has(key);
      input.addEventListener('change', function(){
        if (!key) return;
        if (input.checked) root.store.selectedRowIds.add(key);
        else root.store.selectedRowIds.delete(key);
        syncMasterCheckbox(masterInput);
      });
      tdCheck.appendChild(input);
      tr.appendChild(tdCheck);
      root.COLUMNS.forEach(function(column){ tr.appendChild(CPCommon.cell('td', row[column] == null ? '' : row[column])); });
      tbody.appendChild(tr);
    });

    syncMasterCheckbox(masterInput);
    updateMeta(rows);
  }

  function switchTab(which){
    var isEditor = which === 'editor';
    E('tab-editor').classList.toggle('active', isEditor);
    E('tab-report').classList.toggle('active', !isEditor);
    E('tabBtnEditor').classList.toggle('active', isEditor);
    E('tabBtnReport').classList.toggle('active', !isEditor);
    E('tabBtnEditor').setAttribute('aria-selected', String(isEditor));
    E('tabBtnReport').setAttribute('aria-selected', String(!isEditor));
  }

  function clearDataView(){
    E('solicitacoesClienteSelect').innerHTML = '<option value="(Todos)">(Todos)</option>';
    E('solicitacoesReclamadaList').innerHTML = '';
    E('solicitacoesFileName').textContent = 'Nenhum arquivo selecionado';
    E('solicitacoesFileInput').value = '';
    E('solicitacoesCompetencia').textContent = 'Competência: —';
    var out = E('nfDescricaoOutput');
    if (out) out.value = '';
  }

  root.E = E;
  root.updateCompetencia = updateCompetencia;
  root.updateMeta = updateMeta;
  root.updateReclamadaBtnLabel = updateReclamadaBtnLabel;
  root.setClientOptions = setClientOptions;
  root.setReclamadaDropdown = setReclamadaDropdown;
  root.renderTable = renderTable;
  root.switchTab = switchTab;
  root.clearDataView = clearDataView;
  root.uiModuleLoaded = true;
})();
