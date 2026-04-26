(function(global){
  'use strict';

  var root = global.CPERPFinanceiro = global.CPERPFinanceiro || {};
  if (root.relatoriosModuleLoaded) return;

  var REPORT_TYPES = [
    { key: 'consolidado', label: 'Financeiro consolidado' },
    { key: 'receitas', label: 'Receitas realizadas' },
    { key: 'despesas', label: 'Despesas' },
    { key: 'clientes', label: 'Clientes' },
    { key: 'fornecedores', label: 'Fornecedores' },
    { key: 'produtos', label: 'Produtos' },
    { key: 'vendas', label: 'Vendas' }
  ];

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

  function formatDate(value){
    var iso = normalizeDate(value);
    if (!iso) return '--/--/----';
    var parts = iso.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function getState(){
    root.state = root.state || {};
    root.state.lancamentos = Array.isArray(root.state.lancamentos) ? root.state.lancamentos : [];
    root.state.clientes = Array.isArray(root.state.clientes) ? root.state.clientes : [];
    root.state.fornecedores = Array.isArray(root.state.fornecedores) ? root.state.fornecedores : [];
    root.state.produtos = Array.isArray(root.state.produtos) ? root.state.produtos : [];
    root.state.vendas = Array.isArray(root.state.vendas) ? root.state.vendas : [];
    return root.state;
  }

  function ensureStyles(){
    if (document.getElementById('erpRelatoriosStyles')) return;
    var style = document.createElement('style');
    style.id = 'erpRelatoriosStyles';
    style.textContent = '' +
      '.erp-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}' +
      '.erp-grid .full{grid-column:1 / -1}' +
      '.erp-field{display:flex;flex-direction:column;gap:4px;font-size:12px}' +
      '.erp-field input,.erp-field select{border:1px solid #d7dbe6;border-radius:10px;padding:8px;font-size:13px;background:#fff}' +
      '.erp-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}' +
      '.erp-kpi{border:1px solid #e6e8ef;background:#f8fafc;border-radius:12px;padding:10px}' +
      '.erp-kpi strong{display:block;font-size:11px;color:#667085;font-weight:600}' +
      '.erp-kpi span{display:block;font-size:16px;font-weight:700;margin-top:3px}' +
      '.erp-note{margin-top:8px;font-size:12px;color:#667085}' +
      '@media (max-width:900px){.erp-grid,.erp-kpis{grid-template-columns:1fr}}';
    document.head.appendChild(style);
  }

  function buildLayout(container){
    container.innerHTML = '' +
      '<section class="card"><h2>Relatórios gerenciais</h2>' +
      '<div class="card-sub">Aplique período e tipo para gerar tabulações financeiras, comerciais e cadastrais.</div>' +
      '<div class="erp-grid">' +
      '<label class="erp-field"><span>Período inicial</span><input type="date" id="erpRelFiltroInicio"></label>' +
      '<label class="erp-field"><span>Período final</span><input type="date" id="erpRelFiltroFim"></label>' +
      '<label class="erp-field"><span>Tipo de relatório</span><select id="erpRelFiltroTipo"></select></label>' +
      '</div>' +
      '<div class="erp-kpis" id="erpRelKpis"></div>' +
      '<div class="erp-note" id="erpRelPeriodoInfo">Período: todos os registros.</div>' +
      '</section>' +
      '<section class="card"><h2 id="erpRelTabelaTitulo">Tabulação</h2><div class="table-wrap">' +
      '<table class="editor-table" id="erpRelTabela"><thead></thead><tbody><tr><td>Nenhum dado disponível.</td></tr></tbody></table>' +
      '</div></section>';

    var select = document.getElementById('erpRelFiltroTipo');
    select.innerHTML = REPORT_TYPES.map(function(item){
      return '<option value="' + item.key + '">' + item.label + '</option>';
    }).join('');
  }

  function withinPeriod(dateIso, startIso, endIso){
    if (!dateIso) return !startIso && !endIso;
    if (startIso && dateIso < startIso) return false;
    if (endIso && dateIso > endIso) return false;
    return true;
  }

  function periodInfo(startIso, endIso){
    if (!startIso && !endIso) return 'Período: todos os registros.';
    if (startIso && endIso) return 'Período: ' + formatDate(startIso) + ' a ' + formatDate(endIso) + '.';
    if (startIso) return 'Período: a partir de ' + formatDate(startIso) + '.';
    return 'Período: até ' + formatDate(endIso) + '.';
  }

  function computeReceitasDespesas(lancamentos, startIso, endIso){
    var receitas = 0;
    var despesas = 0;

    lancamentos.forEach(function(item){
      var data = normalizeDate(item.dataCompetencia);
      if (!withinPeriod(data, startIso, endIso)) return;
      var value = toNumber(item.valorLiquido != null ? item.valorLiquido : item.valor);
      if (item.tipo === 'entrada') receitas += value;
      else despesas += value;
    });

    return {
      receitas: receitas,
      despesas: despesas,
      saldo: receitas - despesas
    };
  }

  function reportConsolidado(state, startIso, endIso){
    var base = computeReceitasDespesas(state.lancamentos, startIso, endIso);
    var vendasPeriodo = state.vendas.filter(function(item){
      return withinPeriod(normalizeDate(item.dataEmissao), startIso, endIso);
    });

    return {
      title: 'Financeiro consolidado',
      kpis: [
        { label: 'Receitas', value: formatCurrency(base.receitas) },
        { label: 'Despesas', value: formatCurrency(base.despesas) },
        { label: 'Saldo', value: formatCurrency(base.saldo) },
        { label: 'Vendas', value: String(vendasPeriodo.length) }
      ],
      columns: ['Indicador', 'Valor'],
      rows: [
        ['Receitas realizadas', formatCurrency(base.receitas)],
        ['Despesas totais', formatCurrency(base.despesas)],
        ['Saldo financeiro', formatCurrency(base.saldo)],
        ['Quantidade de vendas', String(vendasPeriodo.length)]
      ]
    };
  }

  function reportReceitas(state, startIso, endIso){
    var rows = state.lancamentos.filter(function(item){
      return item.tipo === 'entrada' && withinPeriod(normalizeDate(item.dataCompetencia), startIso, endIso);
    });
    var total = rows.reduce(function(sum, item){ return sum + toNumber(item.valorLiquido != null ? item.valorLiquido : item.valor); }, 0);

    return {
      title: 'Receitas realizadas',
      kpis: [
        { label: 'Total realizado', value: formatCurrency(total) },
        { label: 'Lançamentos', value: String(rows.length) },
        { label: 'Ticket médio', value: formatCurrency(rows.length ? (total / rows.length) : 0) },
        { label: 'Status padrão', value: 'Realizado' }
      ],
      columns: ['Competência', 'Cliente', 'Descrição', 'Categoria', 'Valor líquido'],
      rows: rows.map(function(item){
        return [
          formatDate(item.dataCompetencia),
          item.nomeContato || '--',
          item.descricao || '--',
          item.categoria || '--',
          formatCurrency(item.valorLiquido != null ? item.valorLiquido : item.valor)
        ];
      })
    };
  }

  function reportDespesas(state, startIso, endIso){
    var rows = state.lancamentos.filter(function(item){
      return item.tipo !== 'entrada' && withinPeriod(normalizeDate(item.dataCompetencia), startIso, endIso);
    });
    var total = rows.reduce(function(sum, item){ return sum + toNumber(item.valorLiquido != null ? item.valorLiquido : item.valor); }, 0);
    var pendente = rows.reduce(function(sum, item){
      var status = String(item.status || '').toLowerCase();
      if (status === 'pendente' || status === 'vencido') {
        return sum + toNumber(item.valorLiquido != null ? item.valorLiquido : item.valor);
      }
      return sum;
    }, 0);

    return {
      title: 'Despesas',
      kpis: [
        { label: 'Total de despesas', value: formatCurrency(total) },
        { label: 'Lançamentos', value: String(rows.length) },
        { label: 'Contas pendentes', value: formatCurrency(pendente) },
        { label: 'Ticket médio', value: formatCurrency(rows.length ? (total / rows.length) : 0) }
      ],
      columns: ['Competência', 'Fornecedor', 'Descrição', 'Status', 'Valor líquido'],
      rows: rows.map(function(item){
        return [
          formatDate(item.dataCompetencia),
          item.nomeContato || '--',
          item.descricao || '--',
          item.status || '--',
          formatCurrency(item.valorLiquido != null ? item.valorLiquido : item.valor)
        ];
      })
    };
  }

  function groupByContato(items, startIso, endIso, mode){
    var map = new Map();

    items.forEach(function(item){
      var data = normalizeDate(item.dataCompetencia);
      if (!withinPeriod(data, startIso, endIso)) return;
      var isReceita = item.tipo === 'entrada';
      if ((mode === 'clientes' && !isReceita) || (mode === 'fornecedores' && isReceita)) return;
      var nome = (item.nomeContato || '--').trim() || '--';
      var prev = map.get(nome) || { nome: nome, qtd: 0, total: 0, ultimo: '' };
      prev.qtd += 1;
      prev.total += toNumber(item.valorLiquido != null ? item.valorLiquido : item.valor);
      if (!prev.ultimo || data > prev.ultimo) prev.ultimo = data;
      map.set(nome, prev);
    });

    return Array.from(map.values()).sort(function(a, b){ return b.total - a.total; });
  }

  function reportClientes(state, startIso, endIso){
    var grouped = groupByContato(state.lancamentos, startIso, endIso, 'clientes');
    var total = grouped.reduce(function(sum, item){ return sum + item.total; }, 0);

    return {
      title: 'Clientes',
      kpis: [
        { label: 'Clientes com receita', value: String(grouped.length) },
        { label: 'Receita total', value: formatCurrency(total) },
        { label: 'Média por cliente', value: formatCurrency(grouped.length ? total / grouped.length : 0) },
        { label: 'Cadastros', value: String(state.clientes.length) }
      ],
      columns: ['Cliente', 'Receitas', 'Qtde lançamentos', 'Última movimentação'],
      rows: grouped.map(function(item){
        return [item.nome, formatCurrency(item.total), String(item.qtd), formatDate(item.ultimo)];
      })
    };
  }

  function reportFornecedores(state, startIso, endIso){
    var grouped = groupByContato(state.lancamentos, startIso, endIso, 'fornecedores');
    var total = grouped.reduce(function(sum, item){ return sum + item.total; }, 0);

    return {
      title: 'Fornecedores',
      kpis: [
        { label: 'Fornecedores com despesa', value: String(grouped.length) },
        { label: 'Despesa total', value: formatCurrency(total) },
        { label: 'Média por fornecedor', value: formatCurrency(grouped.length ? total / grouped.length : 0) },
        { label: 'Cadastros', value: String(state.fornecedores.length) }
      ],
      columns: ['Fornecedor', 'Despesas', 'Qtde lançamentos', 'Última movimentação'],
      rows: grouped.map(function(item){
        return [item.nome, formatCurrency(item.total), String(item.qtd), formatDate(item.ultimo)];
      })
    };
  }

  function reportProdutos(state, startIso, endIso){
    var grouped = new Map();

    state.vendas.forEach(function(venda){
      if (!withinPeriod(normalizeDate(venda.dataEmissao), startIso, endIso)) return;
      (Array.isArray(venda.itens) ? venda.itens : []).forEach(function(item){
        var nome = (item.descricao || '--').trim() || '--';
        var prev = grouped.get(nome) || { nome: nome, quantidade: 0, faturamento: 0 };
        prev.quantidade += toNumber(item.quantidade);
        prev.faturamento += toNumber(item.total);
        grouped.set(nome, prev);
      });
    });

    var rows = Array.from(grouped.values()).sort(function(a, b){ return b.faturamento - a.faturamento; });
    var total = rows.reduce(function(sum, item){ return sum + item.faturamento; }, 0);

    return {
      title: 'Produtos',
      kpis: [
        { label: 'Itens vendidos', value: String(rows.length) },
        { label: 'Faturamento', value: formatCurrency(total) },
        { label: 'Quantidade total', value: rows.reduce(function(sum, item){ return sum + item.quantidade; }, 0).toFixed(2) },
        { label: 'Cadastros', value: String(state.produtos.length) }
      ],
      columns: ['Produto/Serviço', 'Quantidade', 'Faturamento', 'Participação'],
      rows: rows.map(function(item){
        var share = total ? ((item.faturamento / total) * 100).toFixed(2) + '%' : '0,00%';
        return [item.nome, item.quantidade.toFixed(2), formatCurrency(item.faturamento), share];
      })
    };
  }

  function reportVendas(state, startIso, endIso){
    var rows = state.vendas.filter(function(item){
      return withinPeriod(normalizeDate(item.dataEmissao), startIso, endIso);
    });
    var total = rows.reduce(function(sum, item){ return sum + toNumber(item.total); }, 0);

    return {
      title: 'Vendas',
      kpis: [
        { label: 'Pedidos', value: String(rows.length) },
        { label: 'Faturamento', value: formatCurrency(total) },
        { label: 'Ticket médio', value: formatCurrency(rows.length ? total / rows.length : 0) },
        { label: 'Itens vendidos', value: String(rows.reduce(function(sum, item){ return sum + (Array.isArray(item.itens) ? item.itens.length : 0); }, 0)) }
      ],
      columns: ['Pedido', 'Data', 'Cliente', 'Itens', 'Valor', 'Status'],
      rows: rows.map(function(item){
        return [
          item.id || '--',
          formatDate(item.dataEmissao),
          item.clienteNome || '--',
          String(Array.isArray(item.itens) ? item.itens.length : 0),
          formatCurrency(item.total),
          item.status || '--'
        ];
      })
    };
  }

  function buildReport(type, state, startIso, endIso){
    if (type === 'receitas') return reportReceitas(state, startIso, endIso);
    if (type === 'despesas') return reportDespesas(state, startIso, endIso);
    if (type === 'clientes') return reportClientes(state, startIso, endIso);
    if (type === 'fornecedores') return reportFornecedores(state, startIso, endIso);
    if (type === 'produtos') return reportProdutos(state, startIso, endIso);
    if (type === 'vendas') return reportVendas(state, startIso, endIso);
    return reportConsolidado(state, startIso, endIso);
  }

  function renderKpis(kpis){
    var host = document.getElementById('erpRelKpis');
    if (!host) return;
    host.innerHTML = kpis.map(function(item){
      return '<div class="erp-kpi"><strong>' + item.label + '</strong><span>' + item.value + '</span></div>';
    }).join('');
  }

  function renderTable(report){
    var table = document.getElementById('erpRelTabela');
    if (!table) return;
    var thead = table.querySelector('thead');
    var tbody = table.querySelector('tbody');
    document.getElementById('erpRelTabelaTitulo').textContent = 'Tabulação — ' + report.title;

    thead.innerHTML = '<tr>' + report.columns.map(function(col){ return '<th>' + col + '</th>'; }).join('') + '</tr>';

    if (!report.rows.length) {
      tbody.innerHTML = '<tr><td colspan="' + report.columns.length + '">Nenhum dado encontrado para os filtros selecionados.</td></tr>';
      return;
    }

    tbody.innerHTML = report.rows.map(function(row){
      return '<tr>' + row.map(function(cell){ return '<td>' + cell + '</td>'; }).join('') + '</tr>';
    }).join('');
  }

  function refresh(){
    var state = getState();
    var startIso = document.getElementById('erpRelFiltroInicio').value;
    var endIso = document.getElementById('erpRelFiltroFim').value;
    var type = document.getElementById('erpRelFiltroTipo').value || 'consolidado';

    var report = buildReport(type, state, startIso, endIso);
    renderKpis(report.kpis);
    renderTable(report);
    document.getElementById('erpRelPeriodoInfo').textContent = periodInfo(startIso, endIso);
  }

  function bindEvents(){
    ['erpRelFiltroInicio', 'erpRelFiltroFim', 'erpRelFiltroTipo'].forEach(function(id){
      var element = document.getElementById(id);
      if (!element) return;
      element.addEventListener('change', refresh);
      element.addEventListener('input', refresh);
    });
  }

  function init(){
    var tab = document.getElementById('tab-relatorios');
    if (!tab) return;
    ensureStyles();
    buildLayout(tab);
    bindEvents();
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  root.relatoriosModuleLoaded = true;
})(window);
