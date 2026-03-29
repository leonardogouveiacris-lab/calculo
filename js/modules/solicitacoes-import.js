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

  function parseDateAny(value){
    if (value == null || value === '') return null;
    if (value instanceof Date && !isNaN(value.getTime())) return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
    if (typeof value === 'number' && Number.isFinite(value)) return new Date(Date.UTC(1899,11,30) + Math.round(value * 86400000));
    var text = String(value).trim();
    var match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) return new Date(Date.UTC(+match[3], +match[2] - 1, +match[1]));
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

  function normalizeAndFormat(data){
    var rows = (data || []).map(function(row){
      var normalized = {};
      root.COLUMNS.forEach(function(column){
        var raw = getCell(row, root.ALIASES[column]);
        if (column === 'Entrega em') {
          var date = parseDateAny(raw);
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
  root.normalizeAndFormat = normalizeAndFormat;
  root.parseCSV = parseCSV;
  root.importModuleLoaded = true;
})();
