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
      return normalized;
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

  function parseCSV(text){
    var clean = String(text || '').replace(/^\uFEFF/, '');
    var lines = clean.split(/\r?\n/).filter(function(line){ return line.trim() !== ''; });
    if (!lines.length) return [];
    var separators = [',',';','\t'];
    var headerLine = lines[0];
    var separator = separators.map(function(item){ return { sep: item, count: headerLine.split(item).length }; }).sort(function(a, b){ return b.count - a.count; })[0].sep;
    var headers = headerLine.split(separator).map(function(cell){ return cell.trim(); });
    return lines.slice(1).map(function(line){
      var cols = line.split(separator);
      var row = {};
      headers.forEach(function(header, index){ row[header] = (cols[index] || '').trim(); });
      return row;
    });
  }

  function rowKey(row){
    var data = String((row && row['Entrega em']) || '').trim();
    var proc = String((row && row['Numero do Processo']) || '').trim();
    var recl = String((row && row['Reclamante']) || '').trim();
    var total = String((row && row['Total (Total)']) || '').trim();
    return data + '||' + proc + '||' + recl + '||' + total;
  }

  root.canonical = canonical;
  root.getCell = getCell;
  root.parseCurrencyBRL = parseCurrencyBRL;
  root.toBRL = toBRL;
  root.parseDateAny = parseDateAny;
  root.dateBR = dateBR;
  root.normalizeAndFormat = normalizeAndFormat;
  root.parseCSV = parseCSV;
  root.rowKey = rowKey;
  root.importModuleLoaded = true;
})();
