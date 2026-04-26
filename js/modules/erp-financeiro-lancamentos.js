(function(global){
  'use strict';

  var root = global.CPERPFinanceiro = global.CPERPFinanceiro || {};
  if (root.lancamentosModuleLoaded) return;

  var STATUS_OPTIONS = ['Pendente', 'Pago', 'Vencido', 'Cancelado', 'Realizado'];
  var CONCILIACAO_OPTIONS = ['Pendente', 'Conciliado', 'Divergente'];

  function toNumber(value){
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    var normalized = String(value == null ? '' : value).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    var parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatCurrency(value){
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toNumber(value));
  }

  function normalizeDate(value){
    if (!value) return '';
    var text = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    var m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? (m[3] + '-' + m[2] + '-' + m[1]) : '';
  }

  function dateLabel(value){
    var iso = normalizeDate(value);
    if (!iso) return '--/--/----';
    var parts = iso.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function computeValorLiquido(payload){
    return toNumber(payload.valor) + toNumber(payload.juros) + toNumber(payload.multa) - toNumber(payload.desconto);
  }

  function ensureStyles(){
    if (document.getElementById('erpLancamentosStyles')) return;
    var style = document.createElement('style');
    style.id = 'erpLancamentosStyles';
    style.textContent = '' +
      '.erp-fin-wrap{display:grid;gap:14px}' +
      '.erp-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}' +
      '.erp-grid .full{grid-column:1 / -1}' +
      '.erp-field{display:flex;flex-direction:column;gap:4px;font-size:12px}' +
      '.erp-field input,.erp-field select,.erp-field textarea{border:1px solid #d7dbe6;border-radius:10px;padding:8px;font-size:13px;background:#fff}' +
      '.erp-field textarea{min-height:68px;resize:vertical}' +
      '.erp-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}' +
      '.erp-kpi{border:1px solid #e6e8ef;background:#f8fafc;border-radius:12px;padding:10px}' +
      '.erp-kpi strong{display:block;font-size:11px;color:#667085;font-weight:600}' +
      '.erp-kpi span{display:block;font-size:16px;font-weight:700;margin-top:3px}' +
      '.erp-note{font-size:12px;color:#667085}' +
      '@media (max-width:900px){.erp-grid,.erp-kpis{grid-template-columns:1fr}}';
    document.head.appendChild(style);
  }

  function getState(){
    if (!root.state || !Array.isArray(root.state.lancamentos)) {
      root.state = root.state || {};
      root.state.lancamentos = [];
    }
    return root.state;
  }

  function saveState(){
    if (typeof root.saveState === 'function' && root.state) root.saveState(root.state);
  }

  function buildLayout(container){
    container.innerHTML = '' +
      '<section class="card"><h2>Lançamentos financeiros</h2>' +
        '<div class="card-sub">Receitas são registradas como realizadas (sem contas a receber).</div>' +
        '<form id="erpLancamentosForm" class="erp-fin-wrap">' +
          '<div class="erp-grid">' +
            '<label class="erp-field"><span>Data competência *</span><input type="date" name="dataCompetencia" required></label>' +
            '<label class="erp-field"><span>Fornecedor/Cliente *</span><input type="text" name="nomeContato" required></label>' +
            '<label class="erp-field"><span>Descrição *</span><input type="text" name="descricao" required></label>' +
            '<label class="erp-field"><span>Tipo *</span><select name="tipo" required><option value="saida">Saída</option><option value="entrada">Entrada (realizada)</option></select></label>' +
            '<label class="erp-field"><span>Categoria *</span><input type="text" name="categoria" required value="Geral"></label>' +
            '<label class="erp-field"><span>Conta bancária *</span><input type="text" name="contaBancaria" required></label>' +
            '<label class="erp-field"><span>Forma pgto/recbto *</span><input type="text" name="forma" required></label>' +
            '<label class="erp-field"><span>Valor bruto *</span><input type="number" step="0.01" min="0" name="valor" required></label>' +
            '<label class="erp-field"><span>Situação *</span><input type="text" name="situacao" required placeholder="Ex.: Em aberto, Pago"></label>' +
            '<label class="erp-field"><span>Juros *</span><input type="number" step="0.01" min="0" name="juros" required value="0"></label>' +
            '<label class="erp-field"><span>Multa *</span><input type="number" step="0.01" min="0" name="multa" required value="0"></label>' +
            '<label class="erp-field"><span>Desconto *</span><input type="number" step="0.01" min="0" name="desconto" required value="0"></label>' +
            '<label class="erp-field"><span>Status *</span><select name="status" required>' +
              STATUS_OPTIONS.map(function(item){ return '<option value="' + item + '">' + item + '</option>'; }).join('') +
            '</select></label>' +
            '<label class="erp-field"><span>Status conciliação *</span><select name="statusConciliacao" required>' +
              CONCILIACAO_OPTIONS.map(function(item){ return '<option value="' + item + '">' + item + '</option>'; }).join('') +
            '</select></label>' +
            '<label class="erp-field"><span>Valor líquido</span><input type="text" name="valorLiquido" readonly value="R$ 0,00"></label>' +
            '<label class="erp-field full"><span>Observações *</span><textarea name="observacoes" required></textarea></label>' +
          '</div>' +
          '<div class="btn-row"><button type="submit" class="btn-primary">Adicionar lançamento</button></div>' +
          '<div class="erp-note" id="erpReceitaHint">Entradas são lançadas como realizadas e não entram em contas a receber.</div>' +
        '</form>' +
      '</section>' +
      '<section class="card"><h2>Filtros e totais</h2>' +
        '<div class="erp-grid">' +
          '<label class="erp-field"><span>Período inicial</span><input type="date" id="erpFiltroInicio"></label>' +
          '<label class="erp-field"><span>Período final</span><input type="date" id="erpFiltroFim"></label>' +
          '<label class="erp-field"><span>Status</span><select id="erpFiltroStatus"><option value="">Todos</option></select></label>' +
          '<label class="erp-field"><span>Categoria</span><select id="erpFiltroCategoria"><option value="">Todas</option></select></label>' +
          '<label class="erp-field"><span>Conta bancária</span><select id="erpFiltroConta"><option value="">Todas</option></select></label>' +
        '</div>' +
        '<div class="erp-kpis">' +
          '<div class="erp-kpi"><strong>Receitas</strong><span id="kpiReceitas">R$ 0,00</span></div>' +
          '<div class="erp-kpi"><strong>Despesas</strong><span id="kpiDespesas">R$ 0,00</span></div>' +
          '<div class="erp-kpi"><strong>Contas a pagar</strong><span id="kpiPagar">R$ 0,00</span></div>' +
          '<div class="erp-kpi"><strong>Saldo</strong><span id="kpiSaldo">R$ 0,00</span></div>' +
        '</div>' +
      '</section>' +
      '<section class="card"><h2>Tabela de lançamentos</h2><div class="table-wrap">' +
        '<table class="editor-table" id="erpTabelaLancamentos"><thead><tr>' +
          '<th>Competência</th><th>Fornecedor/Cliente</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Conta</th><th>Forma</th><th>Situação</th><th>Status</th><th>Conciliação</th><th>Valor líquido</th>' +
        '</tr></thead><tbody><tr><td colspan="11">Nenhum lançamento cadastrado.</td></tr></tbody></table>' +
      '</div></section>';
  }

  function fillDynamicFilters(lancamentos){
    var statusSelect = document.getElementById('erpFiltroStatus');
    var categoriaSelect = document.getElementById('erpFiltroCategoria');
    var contaSelect = document.getElementById('erpFiltroConta');
    if (!statusSelect || !categoriaSelect || !contaSelect) return;

    function setOptions(select, values, empty){
      var current = select.value;
      select.innerHTML = '<option value="">' + empty + '</option>' + values.map(function(v){ return '<option value="' + v + '">' + v + '</option>'; }).join('');
      select.value = values.indexOf(current) >= 0 ? current : '';
    }

    var statuses = Array.from(new Set(lancamentos.map(function(item){ return item.status; }).filter(Boolean))).sort();
    var categorias = Array.from(new Set(lancamentos.map(function(item){ return item.categoria; }).filter(Boolean))).sort();
    var contas = Array.from(new Set(lancamentos.map(function(item){ return item.contaBancaria; }).filter(Boolean))).sort();

    setOptions(statusSelect, statuses, 'Todos');
    setOptions(categoriaSelect, categorias, 'Todas');
    setOptions(contaSelect, contas, 'Todas');
  }

  function filteredRows(rows){
    var inicio = document.getElementById('erpFiltroInicio').value;
    var fim = document.getElementById('erpFiltroFim').value;
    var status = document.getElementById('erpFiltroStatus').value;
    var categoria = document.getElementById('erpFiltroCategoria').value;
    var conta = document.getElementById('erpFiltroConta').value;

    return rows.filter(function(item){
      var data = normalizeDate(item.dataCompetencia);
      if (inicio && (!data || data < inicio)) return false;
      if (fim && (!data || data > fim)) return false;
      if (status && item.status !== status) return false;
      if (categoria && item.categoria !== categoria) return false;
      if (conta && item.contaBancaria !== conta) return false;
      return true;
    });
  }

  function renderTable(rows){
    var body = document.querySelector('#erpTabelaLancamentos tbody');
    if (!body) return;
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="11">Nenhum lançamento encontrado para os filtros selecionados.</td></tr>';
      return;
    }
    body.innerHTML = rows.map(function(item){
      return '<tr>' +
        '<td>' + dateLabel(item.dataCompetencia) + '</td>' +
        '<td>' + item.nomeContato + '</td>' +
        '<td>' + item.descricao + '</td>' +
        '<td>' + item.categoria + '</td>' +
        '<td>' + (item.tipo === 'entrada' ? 'Entrada (realizada)' : 'Saída') + '</td>' +
        '<td>' + item.contaBancaria + '</td>' +
        '<td>' + item.forma + '</td>' +
        '<td>' + item.situacao + '</td>' +
        '<td>' + item.status + '</td>' +
        '<td>' + item.statusConciliacao + '</td>' +
        '<td>' + formatCurrency(item.valorLiquido) + '</td>' +
      '</tr>';
    }).join('');
  }

  function renderKpis(rows){
    var receitas = 0;
    var despesas = 0;
    var contasPagar = 0;

    rows.forEach(function(item){
      var liquido = toNumber(item.valorLiquido);
      if (item.tipo === 'entrada') {
        receitas += liquido;
        return;
      }
      despesas += liquido;
      if (item.status === 'Pendente' || item.status === 'Vencido') contasPagar += liquido;
    });

    var saldo = receitas - despesas;
    document.getElementById('kpiReceitas').textContent = formatCurrency(receitas);
    document.getElementById('kpiDespesas').textContent = formatCurrency(despesas);
    document.getElementById('kpiPagar').textContent = formatCurrency(contasPagar);
    document.getElementById('kpiSaldo').textContent = formatCurrency(saldo);
  }

  function sanitizeEntry(payload){
    var entry = Object.assign({}, payload);
    entry.tipo = entry.tipo === 'entrada' ? 'entrada' : 'saida';
    if (entry.tipo === 'entrada') {
      entry.status = 'Realizado';
      entry.situacao = 'Receita realizada';
    }
    entry.valorLiquido = computeValorLiquido(entry);
    entry.dataCompetencia = normalizeDate(entry.dataCompetencia);
    entry.id = entry.id || (typeof root.generateEntityId === 'function' ? root.generateEntityId('lancamentos') : ('lan_' + Date.now()));
    return entry;
  }

  function refresh(){
    var state = getState();
    var lancamentos = state.lancamentos.map(sanitizeEntry);
    state.lancamentos = lancamentos;
    fillDynamicFilters(lancamentos);
    var rows = filteredRows(lancamentos);
    renderTable(rows);
    renderKpis(rows);
    saveState();
  }

  function bindForm(){
    var form = document.getElementById('erpLancamentosForm');
    if (!form) return;

    function updateLiquido(){
      var payload = {
        valor: form.valor.value,
        juros: form.juros.value,
        multa: form.multa.value,
        desconto: form.desconto.value
      };
      form.valorLiquido.value = formatCurrency(computeValorLiquido(payload));
    }

    ['valor', 'juros', 'multa', 'desconto'].forEach(function(name){
      form[name].addEventListener('input', updateLiquido);
    });

    form.tipo.addEventListener('change', function(){
      if (form.tipo.value === 'entrada') {
        form.status.value = 'Realizado';
        form.situacao.value = 'Receita realizada';
      }
    });

    form.addEventListener('submit', function(event){
      event.preventDefault();
      var payload = {
        dataCompetencia: form.dataCompetencia.value,
        nomeContato: form.nomeContato.value.trim(),
        descricao: form.descricao.value.trim(),
        tipo: form.tipo.value,
        categoria: form.categoria.value.trim(),
        contaBancaria: form.contaBancaria.value.trim(),
        forma: form.forma.value.trim(),
        valor: form.valor.value,
        situacao: form.situacao.value.trim(),
        juros: form.juros.value,
        multa: form.multa.value,
        desconto: form.desconto.value,
        observacoes: form.observacoes.value.trim(),
        status: form.status.value,
        statusConciliacao: form.statusConciliacao.value
      };

      var state = getState();
      state.lancamentos.push(sanitizeEntry(payload));
      saveState();
      form.reset();
      form.juros.value = '0';
      form.multa.value = '0';
      form.desconto.value = '0';
      form.categoria.value = 'Geral';
      updateLiquido();
      refresh();
    });

    updateLiquido();
  }

  function bindFilters(){
    ['erpFiltroInicio', 'erpFiltroFim', 'erpFiltroStatus', 'erpFiltroCategoria', 'erpFiltroConta'].forEach(function(id){
      var node = document.getElementById(id);
      if (!node) return;
      node.addEventListener('input', refresh);
      node.addEventListener('change', refresh);
    });
  }

  function init(){
    var tab = document.getElementById('tab-financeiro');
    if (!tab) return;
    ensureStyles();
    buildLayout(tab);
    bindForm();
    bindFilters();
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  root.lancamentosModuleLoaded = true;
})(window);
