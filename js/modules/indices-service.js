(function(global){
  'use strict';
  if (global.CPIndicesLoaded) return;

  var stateApi = global.CPIndicesState;
  var repoFactory = global.CPIndicesRepository;
  var importApi = global.CPIndicesImport;

  var repo = repoFactory.createRepository();

  var defaultRules = {
    poupanca_auto: { id: 'poupanca_auto', tables: ['tr_bcb_7811', 'meta_selic_432'], round: 6, gapPolicy: 'carry', formula: 'TR + (metaSelic > 8.5 ? 0.5 : 0.7 * (metaSelic/12))' },
    jam_auto: { id: 'jam_auto', tables: ['tr_bcb_7811'], round: 6, gapPolicy: 'carry', formula: 'TR + 0.25' },
    ipca: { id: 'ipca', tables: ['ipca_bcb_433'], round: 6, gapPolicy: 'error', formula: 'IPCA mensal' },
    inpc: { id: 'inpc', tables: ['inpc_bcb_188'], round: 6, gapPolicy: 'error', formula: 'INPC mensal' },
    igpm: { id: 'igpm', tables: ['igpm_bcb_189'], round: 6, gapPolicy: 'error', formula: 'IGP-M mensal' },
    selic: { id: 'selic', tables: ['selic_bcb_11'], round: 6, gapPolicy: 'error', formula: 'SELIC convertida para mensal efetiva' },
    cdi: { id: 'cdi', tables: ['cdi_bcb_4389'], round: 6, gapPolicy: 'error', formula: 'CDI convertida para mensal efetiva' }
  };

  function loadStore(){
    var db = repo.load();
    db.rules = Object.assign({}, defaultRules, db.rules || {});
    return db;
  }
  function saveStore(db){ return repo.save(db); }

  async function fetchBCBSeries(code, startBR, endBR){
    var url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' + code + '/dados?formato=json&dataInicial=' + encodeURIComponent(startBR) + '&dataFinal=' + encodeURIComponent(endBR);
    return CPCommon.fetchJson(url, { timeoutMs: 15000 });
  }

  function toBRDate(iso){ var p = String(iso).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }

  function bcbMonthlyFromRaw(list){
    return (list || []).map(function(it){
      var p = String(it.data || '').split('/');
      return { competencia: p[2] + '-' + p[1], valor: Number(String(it.valor).replace(',', '.')) };
    }).filter(function(it){ return /^\d{4}-\d{2}$/.test(it.competencia) && Number.isFinite(it.valor); });
  }

  function bcbDailyToMonthlyEffective(list){
    var map = new Map();
    (list || []).forEach(function(it){
      var p = String(it.data || '').split('/');
      var mk = p[2] + '-' + p[1];
      var v = Number(String(it.valor).replace(',', '.'));
      if (!Number.isFinite(v)) return;
      var dailyRate = Math.pow(1 + (v / 100), 1 / 252) - 1;
      map.set(mk, (map.get(mk) || 1) * (1 + dailyRate));
    });
    return Array.from(map.entries()).sort(function(a,b){ return a[0].localeCompare(b[0]); }).map(function(entry){ return { competencia: entry[0], valor: (entry[1] - 1) * 100 }; });
  }

  async function ensureAutoTable(tableId, startISO, endISO){
    var codeById = { ipca_bcb_433: 433, inpc_bcb_188: 188, igpm_bcb_189: 189, igpdi_bcb_190: 190, tr_bcb_7811: 7811, meta_selic_432: 432, cdi_bcb_4389: 4389, selic_bcb_11: 11 };
    var code = codeById[tableId];
    if (!code) return null;
    var raw = await fetchBCBSeries(code, toBRDate(startISO), toBRDate(endISO));
    var periodicidade = (tableId === 'cdi_bcb_4389' || tableId === 'selic_bcb_11') ? 'diaria' : 'mensal';
    var serie = periodicidade === 'mensal' ? bcbMonthlyFromRaw(raw) : bcbDailyToMonthlyEffective(raw);
    return saveTable({ id: tableId, nome: tableId, tipo: 'misto', fonte: 'BCB/SGS', periodicidade: 'mensal', vigencia_inicio: startISO, vigencia_fim: endISO, metadados: { upstream_code: code }, updated_by: 'auto-sync', serie: serie }, { upsert: true });
  }

  function listTables(){ return loadStore().tables; }
  function getTable(tableId){ return loadStore().tables.find(function(t){ return t.id === tableId; }) || null; }
  function saveTable(tableInput, options){
    var db = loadStore();
    var normalized = stateApi.normalizeTable(tableInput);
    var index = db.tables.findIndex(function(t){ return t.id === normalized.id; });
    if (index >= 0) {
      var prev = db.tables[index];
      normalized.versao = Number(prev.versao || 1) + 1;
      normalized.updated_at = new Date().toISOString();
      normalized.serie = options && options.upsert ? stateApi.upsertSerie(prev.serie, normalized.serie, normalized.periodicidade) : normalized.serie;
      db.tables[index] = normalized;
    } else {
      db.tables.push(normalized);
    }
    saveStore(db);
    return normalized;
  }

  function getValue(tableId, date){
    var table = getTable(tableId);
    if (!table) throw new Error('Tabela não encontrada: ' + tableId);
    return stateApi.valueByDate(table, date);
  }

  function getRange(tableId, startDate, endDate){
    var table = getTable(tableId);
    if (!table) throw new Error('Tabela não encontrada: ' + tableId);
    return (table.serie || []).filter(function(it){ return it.competencia >= startDate.slice(0, it.competencia.length) && it.competencia <= endDate.slice(0, it.competencia.length); });
  }

  function resolveRule(ruleId, params){
    var db = loadStore();
    var rule = (db.rules || {})[ruleId] || defaultRules[ruleId];
    if (!rule) throw new Error('Regra não encontrada: ' + ruleId);
    var month = params && params.month;
    if (!month) throw new Error('Parâmetro month é obrigatório.');

    function get(ruleTableId){
      var v = getValue(ruleTableId, month);
      if (v == null && rule.gapPolicy === 'carry') {
        var table = getTable(ruleTableId);
        var prev = (table && table.serie || []).filter(function(it){ return it.competencia <= month; }).slice(-1)[0];
        return prev ? prev.valor : 0;
      }
      if (v == null && rule.gapPolicy === 'error') throw new Error('Lacuna de dados em ' + ruleTableId + ' para ' + month);
      return v || 0;
    }

    var result = 0;
    if (ruleId === 'poupanca_auto') {
      var tr = get('tr_bcb_7811');
      var meta = get('meta_selic_432');
      result = tr + (meta > 8.5 ? 0.5 : (0.7 * (meta / 12)));
    } else if (ruleId === 'jam_auto') {
      result = get('tr_bcb_7811') + 0.25;
    } else if (ruleId === 'ipca') result = get('ipca_bcb_433');
    else if (ruleId === 'inpc') result = get('inpc_bcb_188');
    else if (ruleId === 'igpm') result = get('igpm_bcb_189');
    else if (ruleId === 'selic') result = get('selic_bcb_11');
    else if (ruleId === 'cdi') result = get('cdi_bcb_4389');

    var pow = Math.pow(10, Number(rule.round || 6));
    return Math.round(result * pow) / pow;
  }

  function setActiveTable(contextKey, tableId){
    var db = loadStore();
    db.tables = db.tables.map(function(t){
      t.ativa_por_contexto = t.ativa_por_contexto || {};
      if (contextKey) t.ativa_por_contexto[contextKey] = (t.id === tableId);
      return t;
    });
    saveStore(db);
    return true;
  }

  function getActiveTable(contextKey){
    return loadStore().tables.find(function(t){ return t.ativa_por_contexto && t.ativa_por_contexto[contextKey]; }) || null;
  }

  function importTablesFromText(text, kind, updatedBy){
    var payload = kind === 'csv' ? importApi.importFromCsvText(text) : importApi.importFromJsonText(text);
    var report = { imported: 0, errors: [] };
    (payload.tables || []).forEach(function(t){
      try {
        t.updated_by = updatedBy || 'import-ui';
        saveTable(t, { upsert: true });
        report.imported += 1;
      } catch (error) {
        report.errors.push(String(error.message || error));
      }
    });
    return report;
  }

  function exportTable(tableId, kind){
    var table = getTable(tableId);
    if (!table) throw new Error('Tabela não encontrada: ' + tableId);
    return kind === 'csv' ? importApi.exportTableAsCsv(table) : importApi.exportTableAsJson(table);
  }

  var api = {
    listTables: listTables,
    getTable: getTable,
    saveTable: saveTable,
    getValue: getValue,
    getRange: getRange,
    resolveRule: resolveRule,
    setActiveTable: setActiveTable,
    getActiveTable: getActiveTable,
    ensureAutoTable: ensureAutoTable,
    importTablesFromText: importTablesFromText,
    exportTable: exportTable,
    __private: { loadStore: loadStore, bcbMonthlyFromRaw: bcbMonthlyFromRaw, bcbDailyToMonthlyEffective: bcbDailyToMonthlyEffective }
  };

  global.CPIndices = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.CPIndicesLoaded = true;
})(typeof window !== 'undefined' ? window : globalThis);
