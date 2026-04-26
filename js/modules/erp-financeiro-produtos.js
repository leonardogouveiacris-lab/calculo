(function(global){
  'use strict';

  var root = global.CPERPFinanceiro = global.CPERPFinanceiro || {};
  if (root.produtosModuleLoaded) return;

  function ensureStyles(){
    if (document.getElementById('erpProdutosStyles')) return;
    var style = document.createElement('style');
    style.id = 'erpProdutosStyles';
    style.textContent = '' +
      '.erp-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}' +
      '.erp-grid .full{grid-column:1 / -1}' +
      '.erp-field{display:flex;flex-direction:column;gap:4px;font-size:12px}' +
      '.erp-field input,.erp-field select{border:1px solid #d7dbe6;border-radius:10px;padding:8px;font-size:13px;background:#fff}' +
      '@media (max-width:900px){.erp-grid{grid-template-columns:1fr}}';
    document.head.appendChild(style);
  }

  function getState(){
    root.state = root.state || {};
    root.state.produtos = Array.isArray(root.state.produtos) ? root.state.produtos : [];
    return root.state;
  }

  function saveState(){
    if (typeof root.saveState === 'function' && root.state) root.saveState(root.state);
  }

  function formatCurrency(value){
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  }

  function buildLayout(container){
    container.innerHTML = '' +
      '<section class="card"><h2>Produtos e serviços</h2>' +
      '<div class="card-sub">Catálogo para composição de itens nas vendas.</div>' +
      '<form id="erpProdutosForm" class="erp-grid">' +
      '<label class="erp-field"><span>Tipo *</span><select name="tipo" required><option value="produto">Produto</option><option value="servico">Serviço</option></select></label>' +
      '<label class="erp-field"><span>Descrição *</span><input type="text" name="descricao" required></label>' +
      '<label class="erp-field"><span>Categoria</span><input type="text" name="categoria" value="Geral"></label>' +
      '<label class="erp-field"><span>Preço padrão *</span><input type="number" min="0" step="0.01" name="preco" required></label>' +
      '<label class="erp-field"><span>Unidade</span><input type="text" name="unidade" value="UN"></label>' +
      '<label class="erp-field"><span>Status</span><select name="status"><option>Ativo</option><option>Inativo</option></select></label>' +
      '<div class="btn-row full"><button type="submit" class="btn-primary">Salvar item</button></div>' +
      '</form></section>' +
      '<section class="card"><h2>Catálogo cadastrado</h2><div class="table-wrap">' +
      '<table class="editor-table" id="erpTabelaProdutos"><thead><tr><th>Item</th><th>Tipo</th><th>Categoria</th><th>Preço</th><th>Status</th></tr></thead><tbody><tr><td colspan="5">Nenhum item cadastrado.</td></tr></tbody></table>' +
      '</div></section>';
  }

  function renderTable(){
    var body = document.querySelector('#erpTabelaProdutos tbody');
    if (!body) return;
    var items = getState().produtos;
    if (!items.length) {
      body.innerHTML = '<tr><td colspan="5">Nenhum item cadastrado.</td></tr>';
      return;
    }

    body.innerHTML = items.map(function(item){
      return '<tr>' +
        '<td>' + item.descricao + '</td>' +
        '<td>' + (item.tipo === 'servico' ? 'Serviço' : 'Produto') + '</td>' +
        '<td>' + (item.categoria || 'Geral') + '</td>' +
        '<td>' + formatCurrency(item.preco) + '</td>' +
        '<td>' + (item.status || 'Ativo') + '</td>' +
      '</tr>';
    }).join('');
  }

  function bindForm(){
    var form = document.getElementById('erpProdutosForm');
    if (!form) return;

    form.addEventListener('submit', function(event){
      event.preventDefault();
      var state = getState();
      state.produtos.push({
        id: typeof root.generateEntityId === 'function' ? root.generateEntityId('produtos') : String(Date.now()),
        tipo: form.tipo.value,
        descricao: form.descricao.value.trim(),
        categoria: form.categoria.value.trim() || 'Geral',
        preco: Number(form.preco.value) || 0,
        unidade: form.unidade.value.trim() || 'UN',
        status: form.status.value
      });
      saveState();
      form.reset();
      form.categoria.value = 'Geral';
      form.unidade.value = 'UN';
      form.status.value = 'Ativo';
      renderTable();
    });
  }

  function init(){
    var tab = document.getElementById('tab-produtos');
    if (!tab) return;
    ensureStyles();
    buildLayout(tab);
    bindForm();
    renderTable();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  root.produtosModuleLoaded = true;
})(window);
