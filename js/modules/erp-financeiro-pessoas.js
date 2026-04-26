(function(global){
  'use strict';

  var root = global.CPERPFinanceiro = global.CPERPFinanceiro || {};
  if (root.pessoasModuleLoaded) return;

  function ensureStyles(){
    if (document.getElementById('erpPessoasStyles')) return;
    var style = document.createElement('style');
    style.id = 'erpPessoasStyles';
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
    root.state.clientes = Array.isArray(root.state.clientes) ? root.state.clientes : [];
    root.state.fornecedores = Array.isArray(root.state.fornecedores) ? root.state.fornecedores : [];
    return root.state;
  }

  function saveState(){
    if (typeof root.saveState === 'function' && root.state) root.saveState(root.state);
  }

  function fmtDoc(doc){
    return doc || '--';
  }

  function buildLayout(container){
    container.innerHTML = '' +
      '<section class="card"><h2>Clientes e fornecedores</h2>' +
      '<div class="card-sub">Cadastre contatos usados nas vendas e no financeiro.</div>' +
      '<form id="erpPessoasForm" class="erp-grid">' +
      '<label class="erp-field"><span>Tipo *</span><select name="tipo" required><option value="cliente">Cliente</option><option value="fornecedor">Fornecedor</option></select></label>' +
      '<label class="erp-field"><span>Nome *</span><input type="text" name="nome" required></label>' +
      '<label class="erp-field"><span>Documento</span><input type="text" name="documento" placeholder="CPF/CNPJ"></label>' +
      '<label class="erp-field"><span>Contato</span><input type="text" name="contato" placeholder="Telefone ou e-mail"></label>' +
      '<label class="erp-field"><span>Status</span><select name="status"><option>Ativo</option><option>Inativo</option></select></label>' +
      '<label class="erp-field"><span>Cidade/UF</span><input type="text" name="cidade"></label>' +
      '<div class="btn-row full"><button type="submit" class="btn-primary">Salvar cadastro</button></div>' +
      '</form></section>' +
      '<section class="card"><h2>Lista de contatos</h2><div class="table-wrap">' +
      '<table class="editor-table" id="erpTabelaPessoas"><thead><tr><th>Nome</th><th>Documento</th><th>Tipo</th><th>Contato</th><th>Status</th></tr></thead><tbody><tr><td colspan="5">Nenhum contato cadastrado.</td></tr></tbody></table>' +
      '</div></section>';
  }

  function allPeople(){
    var state = getState();
    var clientes = state.clientes.map(function(item){ return Object.assign({ tipo: 'cliente' }, item); });
    var fornecedores = state.fornecedores.map(function(item){ return Object.assign({ tipo: 'fornecedor' }, item); });
    return clientes.concat(fornecedores);
  }

  function renderTable(){
    var body = document.querySelector('#erpTabelaPessoas tbody');
    if (!body) return;
    var rows = allPeople();
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="5">Nenhum contato cadastrado.</td></tr>';
      return;
    }

    body.innerHTML = rows.map(function(item){
      var tipo = item.tipo === 'fornecedor' ? 'Fornecedor' : 'Cliente';
      return '<tr>' +
        '<td>' + item.nome + '</td>' +
        '<td>' + fmtDoc(item.documento) + '</td>' +
        '<td>' + tipo + '</td>' +
        '<td>' + (item.contato || '--') + '</td>' +
        '<td>' + (item.status || 'Ativo') + '</td>' +
      '</tr>';
    }).join('');
  }

  function bindForm(){
    var form = document.getElementById('erpPessoasForm');
    if (!form) return;

    form.addEventListener('submit', function(event){
      event.preventDefault();
      var payload = {
        id: typeof root.generateEntityId === 'function' ? root.generateEntityId(form.tipo.value === 'cliente' ? 'clientes' : 'fornecedores') : String(Date.now()),
        nome: form.nome.value.trim(),
        documento: form.documento.value.trim(),
        contato: form.contato.value.trim(),
        status: form.status.value,
        cidade: form.cidade.value.trim()
      };

      var state = getState();
      if (form.tipo.value === 'fornecedor') {
        state.fornecedores.push(payload);
      } else {
        state.clientes.push(payload);
      }

      saveState();
      form.reset();
      form.status.value = 'Ativo';
      renderTable();
    });
  }

  function init(){
    var tab = document.getElementById('tab-clientes');
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

  root.pessoasModuleLoaded = true;
})(window);
