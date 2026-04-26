(function(global){
  'use strict';

  var root = global.CPERPFinanceiro = global.CPERPFinanceiro || {};
  if (root.importModuleLoaded) return;

  function ensureState(){
    root.state = root.state || {};
    if (!Array.isArray(root.state.extratos)) root.state.extratos = [];
    if (!Array.isArray(root.state.historicoConciliacao)) root.state.historicoConciliacao = [];
    return root.state;
  }

  function saveState(){
    if (typeof root.saveState === 'function' && root.state) root.saveState(root.state);
  }

  function toNumber(value){
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    var normalized = String(value == null ? '' : value).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    var parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function normalizeDate(value){
    var text = String(value || '').trim();
    if (!text) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    var dmy = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmy) return dmy[3] + '-' + dmy[2] + '-' + dmy[1];
    var ymd = text.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (ymd) return ymd[1] + '-' + ymd[2] + '-' + ymd[3];
    var parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return '';
  }

  function normalizeText(value){
    return String(value == null ? '' : value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeDocument(value){
    return String(value == null ? '' : value)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  function resolveContactReference(nomeContato, documento){
    var state = ensureState();
    var byId = {};
    var byDocumento = {};
    var byNome = {};

    function addPerson(tipo, person){
      if (!person || !person.id) return;
      var personLite = {
        pessoaTipo: tipo,
        pessoaId: String(person.id),
        nome: String(person.nome || '').trim()
      };
      byId[personLite.pessoaId] = personLite;
      var docKey = normalizeDocument(person.documento);
      if (docKey && !byDocumento[docKey]) byDocumento[docKey] = personLite;
      var nomeKey = normalizeText(person.nome);
      if (nomeKey && !byNome[nomeKey]) byNome[nomeKey] = personLite;
    }

    (state.clientes || []).forEach(function(person){ addPerson('cliente', person); });
    (state.fornecedores || []).forEach(function(person){ addPerson('fornecedor', person); });

    var contatoTexto = String(nomeContato || '').trim();
    var docKey = normalizeDocument(documento);
    var nomeKey = normalizeText(contatoTexto);

    var found = null;
    if (contatoTexto && byId[contatoTexto]) {
      found = byId[contatoTexto];
    } else if (docKey && byDocumento[docKey]) {
      found = byDocumento[docKey];
    } else if (nomeKey && byNome[nomeKey]) {
      found = byNome[nomeKey];
    }

    if (!found) {
      return {
        nomeContato: contatoTexto,
        pessoaTipo: '',
        pessoaId: ''
      };
    }

    return {
      nomeContato: contatoTexto || found.nome,
      pessoaTipo: found.pessoaTipo,
      pessoaId: found.pessoaId
    };
  }

  function signatureOf(entry){
    return [normalizeDate(entry.data), toNumber(entry.valor).toFixed(2), normalizeText(entry.descricao), normalizeText(entry.documento), normalizeText(entry.conta)].join('|');
  }

  function hashSignature(signature){
    var hash = 2166136261;
    for (var i = 0; i < signature.length; i++) {
      hash ^= signature.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return ('00000000' + (hash >>> 0).toString(16)).slice(-8);
  }

  function parseCsv(text, separator){
    var rows = [];
    var row = [];
    var token = '';
    var quote = false;
    var i;
    for (i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === '"') {
        if (quote && text[i + 1] === '"') {
          token += '"';
          i += 1;
        } else {
          quote = !quote;
        }
      } else if (!quote && ch === separator) {
        row.push(token);
        token = '';
      } else if (!quote && (ch === '\n' || ch === '\r')) {
        if (ch === '\r' && text[i + 1] === '\n') i += 1;
        row.push(token);
        rows.push(row);
        row = [];
        token = '';
      } else {
        token += ch;
      }
    }
    if (token || row.length) {
      row.push(token);
      rows.push(row);
    }
    return rows.filter(function(cols){ return cols.some(function(c){ return String(c || '').trim(); }); });
  }

  function parseOfx(text){
    var body = String(text || '').replace(/\r/g, '\n');
    var txMatches = body.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>|<STMTTRN>[\s\S]*?(?=<STMTTRN>|$)/gi) || [];
    return txMatches.map(function(block){
      function pick(tag){
        var re = new RegExp('<' + tag + '>([^<\\n\\r]+)', 'i');
        var m = block.match(re);
        return m ? m[1].trim() : '';
      }
      return {
        data: normalizeDate(pick('DTPOSTED').slice(0, 8)),
        descricao: pick('MEMO') || pick('NAME') || 'Movimento OFX',
        valor: toNumber(pick('TRNAMT')),
        documento: pick('CHECKNUM') || pick('FITID'),
        conta: pick('ACCTID')
      };
    });
  }

  function ensureStyles(){
    if (document.getElementById('erpFinanceiroImportStyles')) return;
    var style = document.createElement('style');
    style.id = 'erpFinanceiroImportStyles';
    style.textContent = '' +
      '.erp-import-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}' +
      '.erp-import-field{display:flex;flex-direction:column;gap:4px;font-size:12px}' +
      '.erp-import-field input,.erp-import-field select{border:1px solid #d7dbe6;border-radius:10px;padding:8px;font-size:13px;background:#fff}' +
      '.erp-preview-tools{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}' +
      '.erp-pill{display:inline-flex;align-items:center;padding:3px 8px;border:1px solid #d7dbe6;border-radius:999px;font-size:11px;font-weight:600;background:#f8fafc}' +
      '.erp-pill.warn{background:#fff7ed;border-color:#fed7aa;color:#9a3412}' +
      '.erp-preview-edit{width:100%;border:1px solid #d7dbe6;border-radius:8px;padding:6px 8px;font-size:12px}' +
      '.erp-status-msg{font-size:12px;color:#475467;margin-top:8px}' +
      '@media (max-width:900px){.erp-import-grid{grid-template-columns:1fr}}';
    document.head.appendChild(style);
  }

  function buildLayout(container){
    var card = document.createElement('section');
    card.className = 'card';
    card.innerHTML = '' +
      '<h2>Importação de extrato (CSV/XLSX/OFX)</h2>' +
      '<div class="card-sub">Mapeie as colunas, revise na prévia editável e salve com deduplicação por assinatura.</div>' +
      '<div class="erp-import-grid">' +
        '<label class="erp-import-field"><span>Arquivo</span><input type="file" id="erpExtratoFile" accept=".csv,.xlsx,.ofx"></label>' +
        '<label class="erp-import-field"><span>Separador CSV</span><select id="erpCsvSep"><option value=",">Vírgula</option><option value=";" selected>Ponto e vírgula</option><option value="\t">Tab</option></select></label>' +
        '<label class="erp-import-field"><span>Linha cabeçalho</span><input type="number" id="erpCsvHeader" value="1" min="1"></label>' +
        '<label class="erp-import-field"><span>Conta padrão</span><input type="text" id="erpContaPadrao" placeholder="Banco principal"></label>' +
      '</div>' +
      '<div class="erp-import-grid" id="erpImportMap"></div>' +
      '<div class="erp-preview-tools">' +
        '<button type="button" class="btn" id="erpBtnParse">Carregar prévia</button>' +
        '<button type="button" class="btn-primary" id="erpBtnSavePreview">Salvar prévia</button>' +
        '<span class="erp-pill" id="erpPreviewCount">0 registros</span>' +
        '<span class="erp-pill warn" id="erpPreviewDupes">0 duplicados</span>' +
      '</div>' +
      '<div class="table-wrap"><table class="editor-table" id="erpPreviewTable"><thead><tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Documento</th><th>Contato</th><th>Conta</th><th>Hash</th></tr></thead><tbody><tr><td colspan="7">Selecione um arquivo para visualizar.</td></tr></tbody></table></div>' +
      '<div id="erpImportStatus" class="erp-status-msg"></div>';
    container.appendChild(card);
  }

  function renderMapSelectors(headers){
    var host = document.getElementById('erpImportMap');
    if (!host) return;
    var options = '<option value="">-- não mapear --</option>' + headers.map(function(h, idx){ return '<option value="' + idx + '">' + h + '</option>'; }).join('');
    host.innerHTML = [
      ['data', 'Coluna data'],
      ['descricao', 'Coluna descrição'],
      ['valor', 'Coluna valor'],
      ['documento', 'Coluna documento'],
      ['contato', 'Coluna contato (nome/pessoaId)'],
      ['conta', 'Coluna conta']
    ].map(function(item){
      return '<label class="erp-import-field"><span>' + item[1] + '</span><select data-map="' + item[0] + '">' + options + '</select></label>';
    }).join('');
  }

  function parseTableByMapping(rows){
    var mapNodes = Array.from(document.querySelectorAll('#erpImportMap select[data-map]'));
    var mapping = {};
    mapNodes.forEach(function(node){ mapping[node.dataset.map] = node.value === '' ? -1 : Number(node.value); });
    var contaPadrao = document.getElementById('erpContaPadrao').value.trim();
    return rows.map(function(cols){
      var entry = {
        data: mapping.data >= 0 ? cols[mapping.data] : '',
        descricao: mapping.descricao >= 0 ? cols[mapping.descricao] : '',
        valor: mapping.valor >= 0 ? cols[mapping.valor] : '',
        documento: mapping.documento >= 0 ? cols[mapping.documento] : '',
        nomeContato: mapping.contato >= 0 ? cols[mapping.contato] : '',
        conta: mapping.conta >= 0 ? cols[mapping.conta] : contaPadrao
      };
      entry.data = normalizeDate(entry.data);
      entry.valor = toNumber(entry.valor);
      entry.descricao = String(entry.descricao || '').trim();
      entry.documento = String(entry.documento || '').trim();
      entry.nomeContato = String(entry.nomeContato || '').trim();
      entry.conta = String(entry.conta || contaPadrao || '').trim();
      var contatoRef = resolveContactReference(entry.nomeContato, entry.documento);
      entry.nomeContato = contatoRef.nomeContato;
      entry.pessoaTipo = contatoRef.pessoaTipo;
      entry.pessoaId = contatoRef.pessoaId;
      entry.signature = signatureOf(entry);
      entry.hash = hashSignature(entry.signature);
      entry.id = typeof root.generateEntityId === 'function' ? root.generateEntityId('extratos') : ('ext_' + Date.now() + '_' + Math.random());
      return entry;
    }).filter(function(item){ return item.data && item.descricao && item.valor !== 0; });
  }

  function renderPreview(entries){
    var tbody = document.querySelector('#erpPreviewTable tbody');
    if (!tbody) return;
    if (!entries.length) {
      tbody.innerHTML = '<tr><td colspan="7">Nenhum registro válido encontrado.</td></tr>';
      document.getElementById('erpPreviewCount').textContent = '0 registros';
      document.getElementById('erpPreviewDupes').textContent = '0 duplicados';
      return;
    }

    var known = new Set((ensureState().extratos || []).map(function(item){ return item.hash; }));
    var seen = new Set();
    var dupes = 0;

    tbody.innerHTML = entries.map(function(item, idx){
      var duplicated = known.has(item.hash) || seen.has(item.hash);
      seen.add(item.hash);
      if (duplicated) dupes += 1;
      return '<tr data-row="' + idx + '" data-hash="' + item.hash + '"' + (duplicated ? ' style="background:#fff7ed"' : '') + '>' +
        '<td><input class="erp-preview-edit" data-edit="data" value="' + item.data + '"></td>' +
        '<td><input class="erp-preview-edit" data-edit="descricao" value="' + item.descricao.replace(/"/g, '&quot;') + '"></td>' +
        '<td><input class="erp-preview-edit" data-edit="valor" value="' + item.valor + '"></td>' +
        '<td><input class="erp-preview-edit" data-edit="documento" value="' + item.documento.replace(/"/g, '&quot;') + '"></td>' +
        '<td><input class="erp-preview-edit" data-edit="nomeContato" value="' + String(item.nomeContato || '').replace(/"/g, '&quot;') + '"></td>' +
        '<td><input class="erp-preview-edit" data-edit="conta" value="' + item.conta.replace(/"/g, '&quot;') + '"></td>' +
        '<td><code>' + item.hash + '</code></td>' +
      '</tr>';
    }).join('');

    document.getElementById('erpPreviewCount').textContent = entries.length + ' registros';
    document.getElementById('erpPreviewDupes').textContent = dupes + ' duplicados';
  }

  function readPreviewEntries(){
    return Array.from(document.querySelectorAll('#erpPreviewTable tbody tr[data-row]')).map(function(row){
      var get = function(field){
        var node = row.querySelector('input[data-edit="' + field + '"]');
        return node ? node.value : '';
      };
      var entry = {
        data: normalizeDate(get('data')),
        descricao: String(get('descricao') || '').trim(),
        valor: toNumber(get('valor')),
        documento: String(get('documento') || '').trim(),
        nomeContato: String(get('nomeContato') || '').trim(),
        conta: String(get('conta') || '').trim()
      };
      var contatoRef = resolveContactReference(entry.nomeContato, entry.documento);
      entry.nomeContato = contatoRef.nomeContato;
      entry.pessoaTipo = contatoRef.pessoaTipo;
      entry.pessoaId = contatoRef.pessoaId;
      entry.signature = signatureOf(entry);
      entry.hash = hashSignature(entry.signature);
      entry.id = typeof root.generateEntityId === 'function' ? root.generateEntityId('extratos') : ('ext_' + Date.now() + '_' + Math.random());
      return entry;
    }).filter(function(item){ return item.data && item.descricao && item.valor !== 0; });
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

  function bind(){
    var fileNode = document.getElementById('erpExtratoFile');
    var parseBtn = document.getElementById('erpBtnParse');
    var saveBtn = document.getElementById('erpBtnSavePreview');
    var statusNode = document.getElementById('erpImportStatus');
    var parsedEntries = [];

    parseBtn.addEventListener('click', function(){
      var file = fileNode.files && fileNode.files[0];
      if (!file) {
        statusNode.textContent = 'Selecione um arquivo para importar.';
        return;
      }
      var name = file.name.toLowerCase();
      var reader = new FileReader();
      reader.onload = function(evt){
        var text = evt.target.result;
        if (name.endsWith('.ofx')) {
          parsedEntries = parseOfx(text);
          renderPreview(parsedEntries);
          statusNode.textContent = 'OFX identificado e processado automaticamente.';
          return;
        }

        if (name.endsWith('.xlsx')) {
          if (!global.XLSX || typeof global.XLSX.read !== 'function') {
            statusNode.textContent = 'Arquivo XLSX detectado, mas a biblioteca XLSX não está disponível nesta página.';
            parsedEntries = [];
            renderPreview(parsedEntries);
            return;
          }
          var wb = global.XLSX.read(text, { type: 'binary' });
          var first = wb.SheetNames[0];
          var rows = global.XLSX.utils.sheet_to_json(wb.Sheets[first], { header: 1, raw: false });
          var headers = rows[0] || [];
          renderMapSelectors(headers);
          parsedEntries = parseTableByMapping(rows.slice(1));
          renderPreview(parsedEntries);
          statusNode.textContent = 'Prévia XLSX carregada. Ajuste o mapeamento se necessário.';
          return;
        }

        var sep = document.getElementById('erpCsvSep').value || ';';
        var rowsCsv = parseCsv(String(text || '').replace(/\uFEFF/g, ''), sep);
        var headerIndex = Math.max(0, Number(document.getElementById('erpCsvHeader').value || 1) - 1);
        var headers = rowsCsv[headerIndex] || [];
        renderMapSelectors(headers);
        parsedEntries = parseTableByMapping(rowsCsv.slice(headerIndex + 1));
        renderPreview(parsedEntries);
        statusNode.textContent = 'Prévia CSV carregada. Revise e edite antes de salvar.';
      };
      if (name.endsWith('.xlsx')) reader.readAsBinaryString(file);
      else reader.readAsText(file, 'utf-8');
    });

    document.getElementById('erpImportMap').addEventListener('change', function(){
      if (!parsedEntries.length) return;
      parsedEntries = readPreviewEntries();
      renderPreview(parsedEntries);
    });

    saveBtn.addEventListener('click', function(){
      var entries = readPreviewEntries();
      if (!entries.length) {
        statusNode.textContent = 'Não há registros válidos para salvar.';
        return;
      }
      var state = ensureState();
      var known = new Set(state.extratos.map(function(item){ return item.hash; }));
      var saved = 0;
      entries.forEach(function(entry){
        if (known.has(entry.hash)) return;
        known.add(entry.hash);
        state.extratos.push(entry);
        saved += 1;
      });
      registerHistory('importacao_extrato', 'Importados ' + saved + ' lançamentos (deduplicação ativa).');
      saveState();
      statusNode.textContent = 'Importação concluída. ' + saved + ' novo(s) registro(s) salvo(s).';
      global.dispatchEvent(new CustomEvent('cp:erp-conciliacao-refresh'));
    });
  }

  function init(){
    var tab = document.getElementById('tab-financeiro');
    if (!tab) return;
    ensureStyles();
    buildLayout(tab);
    renderMapSelectors([]);
    bind();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  root.importModuleLoaded = true;
})(window);
