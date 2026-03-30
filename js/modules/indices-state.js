(function(global){
  'use strict';
  if (global.CPIndicesStateLoaded) return;

  function pad2(v){ return String(v).padStart(2, '0'); }
  function isIsoDate(v){ return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')); }
  function isIsoMonth(v){ return /^\d{4}-\d{2}$/.test(String(v || '')); }
  function nowIso(){ return new Date().toISOString(); }

  function normalizeDateKey(dateLike, periodicidade){
    var v = String(dateLike || '').trim();
    if (!v) throw new Error('Competência vazia.');
    if (periodicidade === 'mensal') {
      if (isIsoMonth(v)) return v;
      if (isIsoDate(v)) return v.slice(0, 7);
      throw new Error('Competência mensal inválida: ' + v);
    }
    if (isIsoDate(v)) return v;
    throw new Error('Competência diária inválida: ' + v);
  }

  function normalizeSerie(series, periodicidade){
    var source = Array.isArray(series) ? series : [];
    var map = new Map();
    source.forEach(function(item){
      if (!item) return;
      var k = normalizeDateKey(item.competencia || item.date || item.key, periodicidade);
      var raw = item.valor != null ? item.valor : item.value;
      var value = Number(raw);
      if (!Number.isFinite(value)) throw new Error('Valor numérico inválido na competência ' + k);
      map.set(k, value);
    });
    return Array.from(map.entries()).sort(function(a,b){ return a[0].localeCompare(b[0]); }).map(function(entry){
      return { competencia: entry[0], valor: entry[1] };
    });
  }

  function normalizeTable(input){
    var src = input || {};
    var periodicidade = src.periodicidade === 'diaria' ? 'diaria' : 'mensal';
    var tipo = /^(juros|correcao|misto)$/.test(String(src.tipo || '')) ? src.tipo : 'misto';
    var vigIni = src.vigencia_inicio ? normalizeDateKey(src.vigencia_inicio, 'diaria') : '';
    var vigFim = src.vigencia_fim ? normalizeDateKey(src.vigencia_fim, 'diaria') : '';
    if (vigIni && vigFim && vigIni > vigFim) throw new Error('Vigência inicial maior que vigência final.');

    var table = {
      id: String(src.id || '').trim() || ('tb_' + Date.now()),
      nome: String(src.nome || '').trim() || 'Tabela sem nome',
      tipo: tipo,
      fonte: String(src.fonte || '').trim(),
      periodicidade: periodicidade,
      vigencia_inicio: vigIni,
      vigencia_fim: vigFim,
      metadados: src.metadados && typeof src.metadados === 'object' ? src.metadados : {},
      versao: Number(src.versao || 1) || 1,
      updated_at: String(src.updated_at || nowIso()),
      updated_by: String(src.updated_by || 'sistema-local'),
      hash: src.hash ? String(src.hash) : '',
      ativa_por_contexto: src.ativa_por_contexto && typeof src.ativa_por_contexto === 'object' ? src.ativa_por_contexto : {},
      serie: normalizeSerie(src.serie, periodicidade)
    };
    return table;
  }

  function upsertSerie(existing, entries, periodicidade){
    var base = normalizeSerie(existing, periodicidade);
    var incoming = normalizeSerie(entries, periodicidade);
    var map = new Map(base.map(function(it){ return [it.competencia, it.valor]; }));
    incoming.forEach(function(it){ map.set(it.competencia, it.valor); });
    return Array.from(map.entries()).sort(function(a,b){ return a[0].localeCompare(b[0]); }).map(function(entry){
      return { competencia: entry[0], valor: entry[1] };
    });
  }

  function valueByDate(table, date){
    var dateKey = normalizeDateKey(date, table.periodicidade);
    var idx = (table.serie || []).find(function(it){ return it.competencia === dateKey; });
    return idx ? idx.valor : null;
  }

  var api = {
    normalizeDateKey: normalizeDateKey,
    normalizeSerie: normalizeSerie,
    normalizeTable: normalizeTable,
    upsertSerie: upsertSerie,
    valueByDate: valueByDate,
    isIsoDate: isIsoDate,
    isIsoMonth: isIsoMonth,
    pad2: pad2
  };

  global.CPIndicesState = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.CPIndicesStateLoaded = true;
})(typeof window !== 'undefined' ? window : globalThis);
