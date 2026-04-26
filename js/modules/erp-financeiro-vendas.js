(function(global){
  'use strict';

  var root = global.CPERPFinanceiro = global.CPERPFinanceiro || {};
  if (root.vendasModuleLoaded) return;

  var draftItems = [];

  function ensureStyles(){
    if (document.getElementById('erpVendasStyles')) return;
    var style = document.createElement('style');
    style.id = 'erpVendasStyles';
    style.textContent = '' +
      '.erp-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}' +
      '.erp-grid .full{grid-column:1 / -1}' +
      '.erp-field{display:flex;flex-direction:column;gap:4px;font-size:12px}' +
      '.erp-field input,.erp-field select{border:1px solid #d7dbe6;border-radius:10px;padding:8px;font-size:13px;background:#fff}' +
      '.erp-tot{font-size:18px;font-weight:700}' +
      '@media (max-width:900px){.erp-grid{grid-template-columns:1fr}}';
    document.head.appendChild(style);
  }

  function getState(){
    root.state = root.state || {};
    root.state.clientes = Array.isArray(root.state.clientes) ? root.state.clientes : [];
    root.state.produtos = Array.isArray(root.state.produtos) ? root.state.produtos : [];
    root.state.vendas = Array.isArray(root.state.vendas) ? root.state.vendas : [];
    root.state.lancamentos = Array.isArray(root.state.lancamentos) ? root.state.lancamentos : [];
    return root.state;
  }

  function saveState(){
    if (typeof root.saveState === 'function' && root.state) root.saveState(root.state);
  }

  function formatCurrency(value){
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  }

  function dateIso(){
    return new Date().toISOString().slice(0, 10);
  }

  function buildLayout(container){
    container.innerHTML = '' +
      '<section class="card"><h2>Nova venda</h2>' +
      '<div class="card-sub">Selecione cliente, inclua itens e confirme para gerar receita realizada automaticamente.</div>' +
      '<form id="erpVendaForm" class="erp-grid">' +
      '<label class="erp-field"><span>Cliente *</span><select name="clienteId" required id="erpVendaCliente"></select></label>' +
      '<label class="erp-field"><span>Data da venda *</span><input type="date" name="dataEmissao" required></label>' +
      '<label class="erp-field"><span>Observações</span><input type="text" name="observacoes" placeholder="Opcional"></label>' +
      '<label class="erp-field"><span>Produto/Serviço *</span><select id="erpItemProduto"></select></label>' +
      '<label class="erp-field"><span>Quantidade *</span><input type="number" id="erpItemQtd" min="0.01" step="0.01" value="1"></label>' +
      '<label class="erp-field"><span>Valor unitário *</span><input type="number" id="erpItemValor" min="0" step="0.01" value="0"></label>' +
      '<div class="btn-row full"><button type="button" id="erpAddItem" class="btn">Adicionar item</button></div>' +
      '<div class="full table-wrap"><table class="editor-table" id="erpTabelaItens"><thead><tr><th>Item</th><th>Qtd</th><th>Valor unit.</th><th>Total</th><th>Ação</th></tr></thead><tbody><tr><td colspan="5">Nenhum item adicionado.</td></tr></tbody></table></div>' +
      '<div class="erp-tot full">Total da venda: <span id="erpVendaTotal">R$ 0,00</span></div>' +
      '<div class="btn-row full"><button type="submit" class="btn-primary">Confirmar venda</button></div>' +
      '</form></section>' +
      '<section class="card"><h2>Vendas concluídas</h2><div class="table-wrap">' +
      '<table class="editor-table" id="erpTabelaVendas"><thead><tr><th>Pedido</th><th>Cliente</th><th>Emissão</th><th>Itens</th><th>Valor</th><th>Status</th></tr></thead><tbody><tr><td colspan="6">Nenhuma venda concluída.</td></tr></tbody></table>' +
      '</div></section>';
  }

  function fillSelectors(){
    var state = getState();
    var clienteSelect = document.getElementById('erpVendaCliente');
    var produtoSelect = document.getElementById('erpItemProduto');
    if (!clienteSelect || !produtoSelect) return;

    if (!state.clientes.length) {
      clienteSelect.innerHTML = '<option value="">Cadastre um cliente primeiro</option>';
    } else {
      clienteSelect.innerHTML = '<option value="">Selecione</option>' + state.clientes.map(function(cliente){
        return '<option value="' + cliente.id + '">' + cliente.nome + '</option>';
      }).join('');
    }

    if (!state.produtos.length) {
      produtoSelect.innerHTML = '<option value="">Cadastre produtos/serviços primeiro</option>';
      var valor = document.getElementById('erpItemValor');
      if (valor) valor.value = '0';
      return;
    }

    produtoSelect.innerHTML = '<option value="">Selecione</option>' + state.produtos.map(function(item){
      return '<option value="' + item.id + '">' + item.descricao + '</option>';
    }).join('');
  }

  function currentTotal(){
    return draftItems.reduce(function(sum, item){ return sum + item.total; }, 0);
  }

  function renderItems(){
    var body = document.querySelector('#erpTabelaItens tbody');
    if (!body) return;

    if (!draftItems.length) {
      body.innerHTML = '<tr><td colspan="5">Nenhum item adicionado.</td></tr>';
    } else {
      body.innerHTML = draftItems.map(function(item, index){
        return '<tr>' +
          '<td>' + item.descricao + '</td>' +
          '<td>' + item.quantidade.toFixed(2) + '</td>' +
          '<td>' + formatCurrency(item.valorUnitario) + '</td>' +
          '<td>' + formatCurrency(item.total) + '</td>' +
          '<td><button type="button" class="btn" data-remove-item="' + index + '">Remover</button></td>' +
        '</tr>';
      }).join('');
    }

    document.getElementById('erpVendaTotal').textContent = formatCurrency(currentTotal());
  }

  function renderSales(){
    var body = document.querySelector('#erpTabelaVendas tbody');
    if (!body) return;
    var vendas = getState().vendas;
    if (!vendas.length) {
      body.innerHTML = '<tr><td colspan="6">Nenhuma venda concluída.</td></tr>';
      return;
    }

    body.innerHTML = vendas.map(function(venda){
      return '<tr>' +
        '<td>' + venda.id + '</td>' +
        '<td>' + venda.clienteNome + '</td>' +
        '<td>' + venda.dataEmissao + '</td>' +
        '<td>' + venda.itens.length + '</td>' +
        '<td>' + formatCurrency(venda.total) + '</td>' +
        '<td>' + venda.status + '</td>' +
      '</tr>';
    }).join('');
  }

  function addItem(){
    var state = getState();
    var produtoId = document.getElementById('erpItemProduto').value;
    var qtd = Number(document.getElementById('erpItemQtd').value);
    var valor = Number(document.getElementById('erpItemValor').value);
    var produto = state.produtos.find(function(item){ return item.id === produtoId; });

    if (!produto) {
      global.alert('Selecione um produto/serviço válido.');
      return;
    }

    if (!(qtd > 0) || !(valor >= 0)) {
      global.alert('Informe quantidade e valor unitário válidos.');
      return;
    }

    draftItems.push({
      produtoId: produto.id,
      descricao: produto.descricao,
      tipo: produto.tipo,
      quantidade: qtd,
      valorUnitario: valor,
      total: qtd * valor
    });

    renderItems();
  }

  function createRevenueEntry(venda){
    var state = getState();
    state.lancamentos.push({
      id: typeof root.generateEntityId === 'function' ? root.generateEntityId('lancamentos') : String(Date.now()),
      dataCompetencia: venda.dataEmissao,
      nomeContato: venda.clienteNome,
      descricao: 'Receita da venda ' + venda.id,
      tipo: 'entrada',
      categoria: 'Vendas',
      contaBancaria: 'Caixa',
      forma: 'Venda',
      valor: venda.total,
      situacao: 'Receita realizada',
      juros: 0,
      multa: 0,
      desconto: 0,
      observacoes: 'Lançamento automático da venda ' + venda.id,
      status: 'Realizado',
      statusConciliacao: 'Pendente',
      valorLiquido: venda.total,
      vendaId: venda.id
    });
  }

  function bindEvents(){
    var form = document.getElementById('erpVendaForm');
    if (!form) return;

    form.dataEmissao.value = dateIso();

    var produtoSelect = document.getElementById('erpItemProduto');
    produtoSelect.addEventListener('change', function(){
      var state = getState();
      var produto = state.produtos.find(function(item){ return item.id === produtoSelect.value; });
      if (!produto) return;
      document.getElementById('erpItemValor').value = Number(produto.preco || 0).toFixed(2);
    });

    document.getElementById('erpAddItem').addEventListener('click', addItem);

    document.querySelector('#erpTabelaItens tbody').addEventListener('click', function(event){
      var button = event.target.closest('[data-remove-item]');
      if (!button) return;
      var index = Number(button.getAttribute('data-remove-item'));
      if (Number.isNaN(index)) return;
      draftItems.splice(index, 1);
      renderItems();
    });

    form.addEventListener('submit', function(event){
      event.preventDefault();
      var state = getState();
      var clienteId = form.clienteId.value;
      var cliente = state.clientes.find(function(item){ return item.id === clienteId; });

      if (!cliente) {
        global.alert('Selecione um cliente válido.');
        return;
      }

      if (!draftItems.length) {
        global.alert('Adicione pelo menos um item na venda.');
        return;
      }

      var total = currentTotal();
      var confirmacao = global.confirm('Confirmar venda para ' + cliente.nome + ' no total de ' + formatCurrency(total) + '?');
      if (!confirmacao) return;

      var venda = {
        id: typeof root.generateEntityId === 'function' ? root.generateEntityId('vendas') : String(Date.now()),
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        dataEmissao: form.dataEmissao.value,
        observacoes: form.observacoes.value.trim(),
        itens: draftItems.map(function(item){ return Object.assign({}, item); }),
        total: total,
        status: 'Concluída'
      };

      state.vendas.push(venda);
      createRevenueEntry(venda);
      saveState();

      draftItems = [];
      form.reset();
      form.dataEmissao.value = dateIso();
      fillSelectors();
      renderItems();
      renderSales();
    });
  }

  function init(){
    var tab = document.getElementById('tab-vendas');
    if (!tab) return;
    ensureStyles();
    buildLayout(tab);
    fillSelectors();
    bindEvents();
    renderItems();
    renderSales();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  root.vendasModuleLoaded = true;
})(window);
