(function(global){
  'use strict';
  if (global.CPIndicesImportLoaded) return;

  function parseCSV(text){
    var lines = String(text || '').split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];
    var head = lines[0].split(',').map(function(c){ return c.trim(); });
    return lines.slice(1).map(function(line){
      var cols = line.split(',');
      var out = {};
      head.forEach(function(k, i){ out[k] = (cols[i] || '').trim(); });
      return out;
    });
  }

  function importFromJsonText(text){
    var payload = JSON.parse(String(text || '{}'));
    var tables = Array.isArray(payload.tables) ? payload.tables : [payload];
    return { tables: tables, issues: [] };
  }

  function importFromCsvText(text){
    var rows = parseCSV(text);
    var grouped = new Map();
    rows.forEach(function(r){
      var id = String(r.id || '').trim();
      if (!id) return;
      if (!grouped.has(id)) grouped.set(id, {
        id: id,
        nome: r.nome || id,
        tipo: r.tipo || 'misto',
        fonte: r.fonte || '',
        periodicidade: r.periodicidade || 'mensal',
        vigencia_inicio: r.vigencia_inicio || '',
        vigencia_fim: r.vigencia_fim || '',
        metadados: {},
        versao: Number(r.versao || 1),
        updated_by: r.updated_by || 'import-csv',
        serie: []
      });
      grouped.get(id).serie.push({ competencia: r.competencia, valor: Number(r.valor) });
    });
    return { tables: Array.from(grouped.values()), issues: [] };
  }

  function exportTableAsJson(table){ return JSON.stringify(table, null, 2); }
  function exportTableAsCsv(table){
    var head = 'id,nome,tipo,fonte,periodicidade,vigencia_inicio,vigencia_fim,versao,updated_by,competencia,valor';
    var lines = (table.serie || []).map(function(it){
      return [table.id, table.nome, table.tipo, table.fonte, table.periodicidade, table.vigencia_inicio || '', table.vigencia_fim || '', table.versao || 1, table.updated_by || '', it.competencia, it.valor].join(',');
    });
    return [head].concat(lines).join('\n');
  }

  var api = { parseCSV: parseCSV, importFromJsonText: importFromJsonText, importFromCsvText: importFromCsvText, exportTableAsJson: exportTableAsJson, exportTableAsCsv: exportTableAsCsv };
  global.CPIndicesImport = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.CPIndicesImportLoaded = true;
})(typeof window !== 'undefined' ? window : globalThis);
