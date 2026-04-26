(function(global){
  'use strict';

  var root = global.CPERPFinanceiro = global.CPERPFinanceiro || {};
  if (root.conciliacaoModuleLoaded) return;

  function ensureState(){
    root.state = root.state || {};
    if (!Array.isArray(root.state.lancamentos)) root.state.lancamentos = [];
    if (!Array.isArray(root.state.extratos)) root.state.extratos = [];
    if (!Array.isArray(root.state.conciliacoes)) root.state.conciliacoes = [];
    if (!Array.isArray(root.state.historicoConciliacao)) root.state.historicoConciliacao = [];
    return root.state;
  }

  function saveState(){
    if (typeof root.saveState === 'function') root.saveState(root.state);
  }

  function toNumber(value){
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    var normalized = String(value == null ? '' : value).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    var parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function normalizeDate(value){
    var text = String(value || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    var m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return m[3] + '-' + m[2] + '-' + m[1];
    return '';
  }

  function dayDiff(a, b){
    var da = new Date(normalizeDate(a) + 'T00:00:00Z').getTime();
    var db = new Date(normalizeDate(b) + 'T00:00:00Z').getTime();
    if (!Number.isFinite(da) || !Number.isFinite(db)) return 999;
    return Math.round(Math.abs(da - db) / 86400000);
  }

  function normalizeText(value){
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function tokenSet(text){
    return new Set(normalizeText(text).split(' ').filter(Boolean));
  }

  function textSimilarity(a, b){
    var ta = tokenSet(a);
    var tb = tokenSet(b);
    if (!ta.size || !tb.size) return 0;
    var intersection = 0;
    ta.forEach(function(token){ if (tb.has(token)) intersection += 1; });
    return (2 * intersection) / (ta.size + tb.size);
  }

  function formatCurrency(value){
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toNumber(value));
  }

  function dateLabel(value){
    var iso = normalizeDate(value);
    if (!iso) return '--/--/----';
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function ensureStyles(){
    if (document.getElementById('erpConciliacaoStyles')) return;
    var style = document.createElement('style');
    style.id = 'erpConciliacaoStyles';
    style.textContent = '' +
      '.erp-actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}' +
      '.erp-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;border:1px solid #d7dbe6;font-size:11px;font-weight:700}' +
      '.erp-badge.conciliado{background:#ecfdf3;border-color:#abefc6;color:#067647}' +
      '.erp-badge.sugestao{background:#eff8ff;border-color:#b2ddff;color:#175cd3}' +
      '.erp-badge.nao{background:#f8fafc;color:#475467}' +
      '.erp-badge.ignorado{background:#fff7ed;border-color:#fed7aa;color:#9a3412}';
    document.head.appendChild(style);
  }

  function buildLayout(tab){
    tab.innerHTML = '' +
      '<section class="grid"><section class="card"><h2>Conciliação bancária inteligente</h2>' +
      '<div class="card-sub">Sugestão por valor, janela de data ±3 dias e similaridade textual com ações em massa.</div>' +
      '<div class="erp-actions">' +
        '<button type="button" class="btn" id="erpGerarSugestoes">Gerar sugestões</button>' +
        '<button type="button" class="btn-primary" id="erpAplicarMassa">Aplicar sugestões</button>' +
        '<button type="button" class="btn" id="erpIgnorarMassa">Ignorar selecionadas</button>' +
        '<button type="button" class="btn" id="erpDesfazerMassa">Desfazer conciliação</button>' +
      '</div>' +
      '<div class="table-wrap"><table class="editor-table" id="erpTabelaConciliacao"><thead><tr><th></th><th>Extrato</th><th>Data</th><th>Valor</th><th>Sugestão</th><th>Score</th><th>Status</th><th>Ação</th></tr></thead><tbody><tr><td colspan="8">Sem dados para conciliar.</td></tr></tbody></table></div>' +
      '</section></section>' +
      '<section class="grid"><section class="card"><h2>Histórico de ações</h2><div class="table-wrap"><table class="editor-table" id="erpTabelaHistorico"><thead><tr><th>Data/Hora</th><th>Tipo</th><th>Detalhes</th></tr></thead><tbody><tr><td colspan="3">Nenhuma ação registrada.</td></tr></tbody></table></div></section></section>';
  }

  function registerHistory(tipo, detalhes){
    var state = ensureState();
    state.historicoConciliacao.push({
      id: typeof root.generateEntityId === 'function' ? root.generateEntityId('historicoConciliacao') : ('hco_' + Date.now()),
      dataHora: new Date().toISOString(),
      tipoOperacao: tipo,
      detalhes: detalhes || ''
    });
  }

  function bestSuggestion(extrato, lancamentos, used){
    var best = null;
    lancamentos.forEach(function(lan){
      if (used.has(lan.id)) return;
      if (lan.statusConciliacao === 'Conciliado') return;
      var valueScore = Math.abs(toNumber(extrato.valor) - toNumber(lan.valorLiquido || lan.valor)) <= 0.01 ? 1 : 0;
      if (!valueScore) return;
      var dd = dayDiff(extrato.data, lan.dataCompetencia);
      if (dd > 3) return;
      var dateScore = 1 - (dd / 3);
      var textScore = textSimilarity(extrato.descricao, lan.descricao || lan.observacoes || lan.nomeContato);
      var score = (valueScore * 0.55) + (dateScore * 0.25) + (textScore * 0.20);
      if (!best || score > best.score) {
        best = { lancamentoId: lan.id, score: score, nome: lan.descricao || lan.nomeContato || '-' };
      }
    });
    return best;
  }

  function recomputeSuggestions(){
    var state = ensureState();
    state.lancamentos.forEach(function(lan){
      if (lan.statusConciliacao !== 'Conciliado') lan.statusConciliacao = 'Pendente';
    });
    var used = new Set(state.conciliacoes.filter(function(c){ return c.status === 'conciliado'; }).map(function(c){ return c.lancamentoId; }));
    var pendings = state.extratos.filter(function(ex){
      return !state.conciliacoes.some(function(c){ return c.extratoId === ex.id && (c.status === 'conciliado' || c.status === 'ignorado'); });
    });

    pendings.forEach(function(ex){
      var suggestion = bestSuggestion(ex, state.lancamentos, used);
      var current = state.conciliacoes.find(function(c){ return c.extratoId === ex.id && c.status === 'sugestao'; });
      if (suggestion) {
        if (current) {
          current.lancamentoId = suggestion.lancamentoId;
          current.score = suggestion.score;
          current.sugestaoNome = suggestion.nome;
        } else {
          state.conciliacoes.push({
            id: typeof root.generateEntityId === 'function' ? root.generateEntityId('conciliacoes') : ('con_' + Date.now()),
            extratoId: ex.id,
            lancamentoId: suggestion.lancamentoId,
            score: suggestion.score,
            sugestaoNome: suggestion.nome,
            status: 'sugestao'
          });
        }
        var lanSug = state.lancamentos.find(function(item){ return item.id === suggestion.lancamentoId; });
        if (lanSug && lanSug.statusConciliacao !== 'Conciliado') lanSug.statusConciliacao = 'Sugestão';
      }
    });
    registerHistory('geracao_sugestoes', 'Sugestões recalculadas para ' + pendings.length + ' lançamento(s) de extrato.');
    saveState();
  }

  function statusBadge(status){
    if (status === 'conciliado') return '<span class="erp-badge conciliado">CONCILIADO</span>';
    if (status === 'sugestao') return '<span class="erp-badge sugestao">SUGESTÃO</span>';
    if (status === 'ignorado') return '<span class="erp-badge ignorado">IGNORADO</span>';
    return '<span class="erp-badge nao">NÃO CONCILIADO</span>';
  }

  function render(){
    var state = ensureState();
    var tbody = document.querySelector('#erpTabelaConciliacao tbody');
    if (!tbody) return;

    if (!state.extratos.length) {
      tbody.innerHTML = '<tr><td colspan="8">Sem dados para conciliar.</td></tr>';
    } else {
      tbody.innerHTML = state.extratos.map(function(ex){
        var con = state.conciliacoes.find(function(item){ return item.extratoId === ex.id; });
        var lan = con ? state.lancamentos.find(function(item){ return item.id === con.lancamentoId; }) : null;
        var status = con ? con.status : 'nao_conciliado';
        return '<tr data-extrato="' + ex.id + '">' +
          '<td><input type="checkbox" class="erp-row-check"></td>' +
          '<td>' + (ex.descricao || '-') + '</td>' +
          '<td>' + dateLabel(ex.data) + '</td>' +
          '<td>' + formatCurrency(ex.valor) + '</td>' +
          '<td>' + (con ? (con.sugestaoNome || (lan ? lan.descricao : '-')) : '-') + '</td>' +
          '<td>' + (con && con.score ? (con.score * 100).toFixed(1) + '%' : '--') + '</td>' +
          '<td>' + statusBadge(status) + '</td>' +
          '<td><button type="button" class="btn" data-action="toggle">Vincular/Desfazer</button></td>' +
        '</tr>';
      }).join('');
    }

    var hbody = document.querySelector('#erpTabelaHistorico tbody');
    var hist = state.historicoConciliacao.slice().reverse().slice(0, 80);
    hbody.innerHTML = hist.length ? hist.map(function(item){
      var dt = new Date(item.dataHora);
      return '<tr><td>' + dt.toLocaleString('pt-BR') + '</td><td>' + item.tipoOperacao + '</td><td>' + (item.detalhes || '-') + '</td></tr>';
    }).join('') : '<tr><td colspan="3">Nenhuma ação registrada.</td></tr>';
  }

  function applySuggestion(extratoId){
    var state = ensureState();
    var con = state.conciliacoes.find(function(item){ return item.extratoId === extratoId && item.status === 'sugestao'; });
    if (!con) return false;
    con.status = 'conciliado';
    var lan = state.lancamentos.find(function(item){ return item.id === con.lancamentoId; });
    if (lan) lan.statusConciliacao = 'Conciliado';
    registerHistory('conciliacao_manual', 'Extrato ' + extratoId + ' conciliado com lançamento ' + con.lancamentoId + '.');
    return true;
  }

  function ignoreSuggestion(extratoId){
    var state = ensureState();
    var con = state.conciliacoes.find(function(item){ return item.extratoId === extratoId; });
    if (!con) {
      state.conciliacoes.push({
        id: typeof root.generateEntityId === 'function' ? root.generateEntityId('conciliacoes') : ('con_' + Date.now()),
        extratoId: extratoId,
        lancamentoId: '',
        score: 0,
        sugestaoNome: '',
        status: 'ignorado'
      });
    } else {
      con.status = 'ignorado';
    }
    registerHistory('ignorar_sugestao', 'Extrato ' + extratoId + ' marcado como ignorado.');
  }

  function undoConciliation(extratoId){
    var state = ensureState();
    var con = state.conciliacoes.find(function(item){ return item.extratoId === extratoId; });
    if (!con) return false;
    var lan = state.lancamentos.find(function(item){ return item.id === con.lancamentoId; });
    if (lan) lan.statusConciliacao = 'Pendente';
    con.status = 'sugestao';
    registerHistory('desfazer_conciliacao', 'Conciliação revertida para extrato ' + extratoId + '.');
    return true;
  }

  function selectedExtratos(){
    return Array.from(document.querySelectorAll('#erpTabelaConciliacao tbody tr[data-extrato]')).filter(function(row){
      var cb = row.querySelector('.erp-row-check');
      return cb && cb.checked;
    }).map(function(row){ return row.dataset.extrato; });
  }

  function bind(){
    document.getElementById('erpGerarSugestoes').addEventListener('click', function(){
      recomputeSuggestions();
      render();
      global.dispatchEvent(new CustomEvent('cp:erp-refresh-lancamentos'));
    });

    document.getElementById('erpAplicarMassa').addEventListener('click', function(){
      var ids = selectedExtratos();
      var done = 0;
      ids.forEach(function(id){ if (applySuggestion(id)) done += 1; });
      registerHistory('conciliacao_massa', 'Aplicadas ' + done + ' sugestões em massa.');
      saveState();
      render();
      global.dispatchEvent(new CustomEvent('cp:erp-refresh-lancamentos'));
    });

    document.getElementById('erpIgnorarMassa').addEventListener('click', function(){
      selectedExtratos().forEach(ignoreSuggestion);
      registerHistory('ignorar_massa', 'Registros ignorados em massa.');
      saveState();
      render();
    });

    document.getElementById('erpDesfazerMassa').addEventListener('click', function(){
      var ids = selectedExtratos();
      var undone = 0;
      ids.forEach(function(id){ if (undoConciliation(id)) undone += 1; });
      registerHistory('desfazer_massa', 'Conciliações desfeitas: ' + undone + '.');
      saveState();
      render();
      global.dispatchEvent(new CustomEvent('cp:erp-refresh-lancamentos'));
    });

    document.getElementById('erpTabelaConciliacao').addEventListener('click', function(event){
      var btn = event.target.closest('button[data-action="toggle"]');
      if (!btn) return;
      var row = btn.closest('tr[data-extrato]');
      if (!row) return;
      var extratoId = row.dataset.extrato;
      var state = ensureState();
      var con = state.conciliacoes.find(function(item){ return item.extratoId === extratoId; });
      if (con && con.status === 'conciliado') undoConciliation(extratoId);
      else applySuggestion(extratoId);
      saveState();
      render();
      global.dispatchEvent(new CustomEvent('cp:erp-refresh-lancamentos'));
    });

    global.addEventListener('cp:erp-conciliacao-refresh', function(){
      render();
    });
  }

  function init(){
    var tab = document.getElementById('tab-conciliacao');
    if (!tab) return;
    ensureStyles();
    buildLayout(tab);
    bind();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  root.conciliacaoModuleLoaded = true;
})(window);
