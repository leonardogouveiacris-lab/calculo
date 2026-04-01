(function(){
  var root = window.CPSolicitacoes = window.CPSolicitacoes || {};
  if (root.importModuleLoaded) return;

  function canonical(value){
    return String(value || '').trim().toLowerCase();
  }

  function getCell(row, names){
    var keys = Object.keys(row || {});
    for (var i = 0; i < names.length; i += 1) {
      var target = canonical(names[i]);
      for (var j = 0; j < keys.length; j += 1) {
        if (canonical(keys[j]) === target) return row[keys[j]];
      }
    }
    return '';
  }

  function getFirstCell(row, names){
    var value = getCell(row, names || []);
    return String(value == null ? '' : value).trim();
  }

  function parseCurrencyBRL(value){
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    var text = String(value == null ? '' : value).trim();
    if (!text) return 0;
    text = text.replace(/[^\d,.-]/g, '');
    if (text.indexOf(',') >= 0) text = text.replace(/\./g, '').replace(',', '.');
    var number = Number(text);
    return Number.isFinite(number) ? number : 0;
  }

  function toBRL(number){
    return Number(number || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function parseDateAny(value, options){
    var opts = options || {};
    var preferMDY = !!opts.preferMDY;
    if (value == null || value === '') return null;
    if (value instanceof Date && !isNaN(value.getTime())) {
      return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
    }
    if (typeof value === 'number' && Number.isFinite(value)) return new Date(Date.UTC(1899,11,30) + Math.round(value * 86400000));
    var text = String(value).trim();
    if (/^\d{5,}$/.test(text)) {
      var serial = Number(text);
      if (Number.isFinite(serial)) return new Date(Date.UTC(1899,11,30) + Math.round(serial * 86400000));
    }
    var isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})T/);
    if (isoMatch) return new Date(Date.UTC(+isoMatch[1], +isoMatch[2] - 1, +isoMatch[3]));
    var match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) return new Date(Date.UTC(+match[3], +match[2] - 1, +match[1]));
    match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) return new Date(Date.UTC(+match[3], +match[2] - 1, +match[1]));
    match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2})$/);
    if (match) {
      var p1 = +match[1];
      var p2 = +match[2];
      var year = 2000 + +match[3];
      var day = p1;
      var month = p2;
      if (p1 <= 12 && p2 > 12) { day = p2; month = p1; }
      return new Date(Date.UTC(year, month - 1, day));
    }
    match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (match) {
      var a = +match[1];
      var b = +match[2];
      var yyyy = +match[3];
      var dd = a;
      var mm = b;
      if (a <= 12 && b > 12) { dd = b; mm = a; }
      return new Date(Date.UTC(yyyy, mm - 1, dd));
    }
    match = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (match) return new Date(Date.UTC(+match[3], +match[2] - 1, +match[1]));
    match = text.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})$/);
    if (match) return new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
    return null;
  }

  function dateBR(date){
    return String(date.getUTCDate()).padStart(2, '0') + '/' + String(date.getUTCMonth() + 1).padStart(2, '0') + '/' + date.getUTCFullYear();
  }

  function nextRowId(){
    root._rowSeq = (root._rowSeq || 0) + 1;
    return 'row_' + root._rowSeq;
  }

  function withRowId(row){
    var copy = Object.assign({}, row || {});
    copy._rowId = copy._rowId ? String(copy._rowId) : nextRowId();
    return copy;
  }

  function extractReclamada(row){
    var direct = getFirstCell(row, ['Reclamada']);
    if (direct) return direct;

    var negocio = getFirstCell(row, ['Negócios', 'Negocios']);
    if (negocio) {
      var splitBiz = negocio.split(/\s+(?:x|vs\.?)\s+/i);
      if (splitBiz.length > 1) return splitBiz[splitBiz.length - 1].trim();
      return negocio;
    }

    var etapa = getFirstCell(row, ['Etapa']);
    if (!etapa) return '';
    var splitStage = etapa.split(/:\s*/);
    return splitStage.length > 1 ? splitStage[splitStage.length - 1].trim() : etapa;
  }

  function extractNumeroProcesso(row){
    var direct = getFirstCell(row, root.ALIASES['Numero do Processo']);
    if (direct) return direct;

    var candidates = [
      getFirstCell(row, ['Negócios', 'Negocios']),
      getFirstCell(row, ['Etapa']),
      getFirstCell(row, ['Título do negócio', 'Titulo do negocio', 'Título', 'Titulo'])
    ].filter(Boolean);

    for (var i = 0; i < candidates.length; i += 1) {
      var text = candidates[i];
      var cnj = text.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/);
      if (cnj) return cnj[0];
      var compact = text.match(/\d{20}/);
      if (compact) return compact[0];
    }
    return '';
  }

  function normalizeAndFormat(data){
    function detectDatePreference(rows){
      var dmyScore = 0;
      var mdyScore = 0;
      (rows || []).forEach(function(row){
        var raw = getCell(row, root.ALIASES['Entrega em']);
        var text = String(raw == null ? '' : raw).trim();
        var m = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
        if (!m) return;
        var a = +m[1];
        var b = +m[2];
        if (a > 12 && b <= 12) dmyScore += 1;
        else if (b > 12 && a <= 12) mdyScore += 1;
      });
      return mdyScore > dmyScore;
    }

    var preferMDY = detectDatePreference(data);
    var rows = (data || []).map(function(row){
      var normalized = {};
      root.COLUMNS.forEach(function(column){
        var raw;
        if (column === 'Reclamada') raw = extractReclamada(row);
        else if (column === 'Numero do Processo') raw = extractNumeroProcesso(row);
        else raw = getCell(row, root.ALIASES[column]);
        if (column === 'Entrega em') {
          var date = parseDateAny(raw, { preferMDY: preferMDY });
          normalized[column] = date ? dateBR(date) : (raw == null ? '' : raw);
          return;
        }
        if (column === 'Total (Total)') {
          var amount = parseCurrencyBRL(raw);
          normalized[column] = (String(raw == null ? '' : raw).trim() && amount === 0 && !/0/.test(String(raw))) ? String(raw) : toBRL(amount);
          return;
        }
        normalized[column] = raw == null ? '' : raw;
      });
      return withRowId(normalized);
    });

    rows.sort(function(a, b){
      var da = parseDateAny(a['Entrega em']);
      var db = parseDateAny(b['Entrega em']);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db - da;
    });

    return rows;
  }

  function detectSeparator(headerLine){
    var candidates = [',', ';', '\t'];
    var best = ',';
    var bestScore = -1;
    candidates.forEach(function(sep){
      var score = 0;
      var inQuotes = false;
      for (var i = 0; i < headerLine.length; i += 1) {
        var ch = headerLine[i];
        if (ch === '"') {
          if (inQuotes && headerLine[i + 1] === '"') i += 1;
          else inQuotes = !inQuotes;
          continue;
        }
        if (!inQuotes && ch === sep) score += 1;
      }
      if (score > bestScore) {
        best = sep;
        bestScore = score;
      }
    });
    return best;
  }

  function parseCSV(text){
    var source = String(text || '').replace(/^\uFEFF/, '');
    if (!source.trim()) return [];

    var firstLineEnd = source.search(/\r?\n/);
    var headerLine = firstLineEnd >= 0 ? source.slice(0, firstLineEnd) : source;
    var separator = detectSeparator(headerLine);

    var rows = [];
    var row = [];
    var cell = '';
    var inQuotes = false;

    for (var i = 0; i < source.length; i += 1) {
      var ch = source[i];
      var next = source[i + 1];

      if (ch === '"') {
        if (inQuotes && next === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (!inQuotes && ch === separator) {
        row.push(cell);
        cell = '';
        continue;
      }

      if (!inQuotes && (ch === '\n' || ch === '\r')) {
        if (ch === '\r' && next === '\n') i += 1;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
        continue;
      }

      cell += ch;
    }

    row.push(cell);
    rows.push(row);

    var meaningful = rows.filter(function(r){
      return r.some(function(c){ return String(c || '').trim() !== ''; });
    });
    if (!meaningful.length) return [];

    var headers = meaningful[0].map(function(value){ return String(value || '').trim(); });
    return meaningful.slice(1).map(function(values){
      var out = {};
      headers.forEach(function(header, index){ out[header] = String(values[index] == null ? '' : values[index]).trim(); });
      return out;
    });
  }

  function getRowId(row){
    return row && row._rowId ? String(row._rowId) : '';
  }

  root.canonical = canonical;
  root.getCell = getCell;
  root.parseCurrencyBRL = parseCurrencyBRL;
  root.toBRL = toBRL;
  root.parseDateAny = parseDateAny;
  root.dateBR = dateBR;
  root.withRowId = withRowId;
  root.getRowId = getRowId;
  root.extractReclamada = extractReclamada;
  root.extractNumeroProcesso = extractNumeroProcesso;
  root.normalizeAndFormat = normalizeAndFormat;
  root.parseCSV = parseCSV;
  root.importModuleLoaded = true;
})();
