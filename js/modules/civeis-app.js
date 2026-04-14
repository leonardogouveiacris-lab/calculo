/** arquivo único autorizado para manutenção do cível */

(function(){
  const STORAGE_KEY = 'cp_civeis_inicial_v6';
  const LEGACY_STORAGE_KEYS = ['cp_civeis_inicial_v5', 'cp_civeis_inicial_v3'];
  const $ = (id) => document.getElementById(id);
  const fields = {
    requerente: $('requerente'),
    requerido: $('requerido'),
    processo: $('processo'),
    ajuizamento: $('ajuizamento'),
    dataAtualizacao: $('dataAtualizacao'),
    observacoes: $('observacoes'),
    novaVerba: $('novaVerba'),
    periodoInicial: $('periodoInicial'),
    periodoFinal: $('periodoFinal'),
    novaVerbaObservacao: $('novaVerbaObservacao')
  };
  const reportRoot = $('reportRoot');
  const launchesHost = $('launchesHost');
  const columnModal = $('columnModal');
  const modalLaunchIndex = $('modalLaunchIndex');
  const modalColumnType = $('modalColumnType');
  const modalColumnName = $('modalColumnName');
  const modalColumnFormula = $('modalColumnFormula');
  const modalColumnSummaryRole = $('modalColumnSummaryRole');
  const formulaFieldWrap = $('formulaFieldWrap');
  let indexFieldWrap = $('indexFieldWrap');
  let modalIndexKind = $('modalIndexKind');
  let modalIndexSource = $('modalIndexSource');
  let modalIndexStart = $('modalIndexStart');
  let modalIndexEnd = $('modalIndexEnd');
  let modalIndexSegments = $('modalIndexSegments');
  let btnAddModalIndexSegment = $('btnAddModalIndexSegment');
  const columnModalTitle = $('columnModalTitle');
  const columnModalSub = $('columnModalSub');
  const launchSelector = $('launchSelector');
  const editColumnModal = $('editColumnModal');
  const editModalLaunchIndex = $('editModalLaunchIndex');
  const editModalColumnId = $('editModalColumnId');
  const editModalColumnName = $('editModalColumnName');
  const editModalColumnFormula = $('editModalColumnFormula');
  const editModalColumnSummaryRole = $('editModalColumnSummaryRole');
  const editFormulaFieldWrap = $('editFormulaFieldWrap');
  const editIndexFieldWrap = $('editIndexFieldWrap');
  const editModalIndexSource = $('editModalIndexSource');
  const editModalIndexStart = $('editModalIndexStart');
  const editModalIndexEnd = $('editModalIndexEnd');
  const editModalIndexSegments = $('editModalIndexSegments');
  const btnAddEditIndexSegment = $('btnAddEditIndexSegment');
  const editLaunchModal = $('editLaunchModal');
  const editLaunchIndex = $('editLaunchIndex');
  const editLaunchVerba = $('editLaunchVerba');
  const editLaunchDataInicial = $('editLaunchDataInicial');
  const editLaunchDataFinal = $('editLaunchDataFinal');
  const editLaunchSummaryValorCorrigido = $('editLaunchSummaryValorCorrigido');
  const editLaunchSummaryJuros = $('editLaunchSummaryJuros');
  const editLaunchObservacao = $('editLaunchObservacao');
  const honorariosEnabled = $('honorariosEnabled');
  const honorariosDescricao = $('honorariosDescricao');
  const honorariosPercentual = $('honorariosPercentual');
  const btnToggleHonorariosSelector = $('btnToggleHonorariosSelector');
  const honorariosSelectorPanel = $('honorariosSelectorPanel');
  const honorariosSelectedHost = $('honorariosSelectedHost');
  const honorariosSearch = $('honorariosSearch');
  const honorariosLaunchesHost = $('honorariosLaunchesHost');
  const honorariosResumo = $('honorariosResumo');
  const btnHonorariosSelectAll = $('btnHonorariosSelectAll');
  const btnHonorariosClear = $('btnHonorariosClear');
  const custasHost = $('custasHost');
  const custasResumo = $('custasResumo');
  const btnAddCusta = $('btnAddCusta');
  const summaryTableHead = $('summaryTableHead');
  const summaryTableBody = $('summaryTableBody');
  const summaryTableFoot = $('summaryTableFoot');
  const INDEX_SOURCE_OPTIONS = {
    correcao: [
      { value:'none', label:'Sem correção' },
      { value:'ipca', label:'IPCA (BCB)' },
      { value:'ipcae', label:'IPCA-E (BCB)' },
      { value:'inpc', label:'INPC (BCB)' },
      { value:'igpm', label:'IGP-M (BCB)' },
      { value:'igpdi', label:'IGP-DI (BCB)' },
      { value:'tr', label:'TR mensal (BCB)' },
      { value:'ec113_2021', label:'EC 113/2021 (IPCA-E até 11/2021 e Selic a partir de 12/2021)' }
    ],
    juros: [
      { value:'none', label:'Sem juros' },
      { value:'selic', label:'Selic (BCB)' },
      { value:'cdi', label:'CDI (BCB)' },
      { value:'taxa_legal', label:'Taxa Legal (Selic mensal - IPCA-15 do mês anterior)' },
      { value:'poupanca_auto', label:'Poupança (BCB)' },
      { value:'juros_1am', label:'Juros de 1% a.m.' },
      { value:'jam_auto', label:'JAM/TR + 0,25% a.m.' }
    ]
  };
  const DEFAULT_INDEX_COLUMNS = Object.freeze([
    { id:'correcao_monetaria', nome:'Correção Monetária', tipo:'indice', locked:true, formato:'indice', indexKind:'correcao', indexSource:'ipca', indexLimit:{ start:'', end:'' }, accumulationMode:'compound' },
    { id:'juros', nome:'Juros', tipo:'indice', locked:true, formato:'indice', indexKind:'juros', indexSource:'selic', indexLimit:{ start:'', end:'' }, accumulationMode:'compound' }
  ]);
  const DEFAULT_RESULT_COLUMNS = Object.freeze([
    { id:'valor_correcao', nome:'Valor da Correção', tipo:'formula', formato:'moeda', formula:'', includeInSummary:true },
    { id:'valor_juros', nome:'Valor dos Juros', tipo:'formula', formato:'moeda', formula:'', includeInSummary:true },
    { id:'valor_devido', nome:'Valor Devido', tipo:'formula', formato:'moeda', formula:'', includeInSummary:true }
  ]);
  let state = { lancamentos: [], lancamentoSelecionadoId: '', honorarios: defaultHonorariosConfig(), custas: [] };
  let honorariosSelectorOpen = false;
  let honorariosSearchTerm = '';

  (function ensureIndexColumnModalFields(){
    if (!columnModal || $('indexFieldWrap')) return;
    const modalBody = columnModal.querySelector('.modal-body');
    if (!modalBody) return;
    const wrap = document.createElement('div');
    wrap.id = 'indexFieldWrap';
    wrap.style.display = 'none';
    wrap.innerHTML = '' +
      '<label for="modalIndexKind">Tipo do índice</label>' +
      '<select id="modalIndexKind" class="select"><option value="correcao">Correção monetária</option><option value="juros">Juros</option></select>' +
      '<label for="modalIndexSource">Fonte do índice</label>' +
      '<select id="modalIndexSource" class="select"></select>' +
      '<div class="row" style="margin-top:8px">' +
        '<div class="col-6"><label for="modalIndexStart">Aplicar a partir de</label><input id="modalIndexStart" type="date"></div>' +
        '<div class="col-6"><label for="modalIndexEnd">Aplicar até</label><input id="modalIndexEnd" type="date"></div>' +
      '</div>' +
      '<div id="modalIndexSegments" style="display:grid;gap:8px;margin-top:8px"></div>' +
      '<div class="btn-row" style="margin-top:8px"><button type="button" class="btn btn-ghost" id="btnAddModalIndexSegment">Adicionar tabela por período</button></div>' +
      '<div class="formula-help">Defina fonte e limites opcionais para acumular o fator do índice.</div>';
    modalBody.appendChild(wrap);
    indexFieldWrap = $('indexFieldWrap');
    modalIndexKind = $('modalIndexKind');
    modalIndexSource = $('modalIndexSource');
    modalIndexStart = $('modalIndexStart');
    modalIndexEnd = $('modalIndexEnd');
    modalIndexSegments = $('modalIndexSegments');
    btnAddModalIndexSegment = $('btnAddModalIndexSegment');
  })();

  function esc(value){
    return String(value || '').replace(/[&<>\"]/g, function(char){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[char] || char;
    });
  }

  function safeStringify(value){
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '[unserializable: ' + String(error && error.message || error || 'erro desconhecido') + ']';
    }
  }

  function formatDateBR(value){
    if (!value) return '—';
    const parts = String(value).split('-');
    if (parts.length !== 3) return value;
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function formatLimitInterval(startISO, endISO){
    if (!startISO && !endISO) return 'sem limite';
    const startLabel = startISO ? formatDateBR(startISO) : 'início aberto';
    const endLabel = endISO ? formatDateBR(endISO) : 'final aberto';
    return startLabel + ' até ' + endLabel;
  }

  function getIndexSourceLabel(coluna){
    const composition = getIndexComposition(coluna);
    if (composition.length > 1) return 'Combinado (' + composition.length + ' tabelas)';
    const kind = coluna && coluna.indexKind ? coluna.indexKind : 'correcao';
    const source = coluna && coluna.indexSource ? coluna.indexSource : '';
    return ((INDEX_SOURCE_OPTIONS[kind] || []).find(function(opt){ return opt.value === source; }) || {}).label || source || '—';
  }

  function normalizeIndexSegment(segment, fallbackKind){
    const base = segment || {};
    const kind = fallbackKind === 'juros' ? 'juros' : 'correcao';
    const source = String(base.source || base.indexSource || '').trim() || defaultIndexSourceByKind(kind);
    const start = String(base.start || '').trim();
    const end = String(base.end || '').trim();
    return {
      source: source,
      start: start,
      end: end,
      accumulationMode: sourceAccumulationMode(source)
    };
  }

  function getIndexComposition(coluna){
    const kind = coluna && coluna.indexKind === 'juros' ? 'juros' : 'correcao';
    const source = coluna && coluna.indexSource ? coluna.indexSource : defaultIndexSourceByKind(kind);
    const limit = getIndexLimit(coluna);
    const legacy = normalizeIndexSegment({ source: source, start: limit.start, end: limit.end }, kind);
    const list = Array.isArray(coluna && coluna.indexComposition) ? coluna.indexComposition.map(function(item){
      return normalizeIndexSegment(item, kind);
    }).filter(function(item){ return !!item.source; }) : [];
    return list.length ? list : [legacy];
  }

  function syncLegacyIndexFieldsFromComposition(coluna){
    const composition = getIndexComposition(coluna);
    const first = composition[0] || normalizeIndexSegment({}, coluna && coluna.indexKind);
    coluna.indexComposition = composition;
    coluna.indexSource = first.source;
    coluna.indexLimit = { start: first.start || '', end: first.end || '' };
    coluna.accumulationMode = first.accumulationMode || sourceAccumulationMode(first.source);
  }

  function summarizeIndexColumn(coluna, columnRef){
    const kind = coluna && coluna.indexKind === 'juros' ? 'juros' : 'correcao';
    const limit = getIndexLimit(coluna);
    const hasLimit = !!(limit.start || limit.end);
    const sourceRule = window.CPBCBRates && typeof window.CPBCBRates.describeSourceRule === 'function'
      ? window.CPBCBRates.describeSourceRule(coluna && coluna.indexSource)
      : null;
    const noOverlap = !!(coluna && coluna.__lastNoOverlap);
    return {
      name: String(coluna && coluna.nome || 'Índice'),
      columnRef: String(columnRef || ''),
      typeLabel: kind === 'juros' ? 'Juros' : 'Correção',
      sourceLabel: getIndexSourceLabel(coluna),
      limitLabel: formatLimitInterval(limit.start, limit.end),
      seriesLabel: sourceRule ? sourceRule.seriesLabel : 'Manual/sem série',
      unitLabel: sourceRule ? sourceRule.unitLabel : '—',
      formulaLabel: sourceRule ? sourceRule.formulaLabel : '—',
      intervalLabel: sourceRule ? sourceRule.intervalLabel : formatLimitInterval(limit.start, limit.end),
      finalFactorLabel: formatIndexFactor(Number(coluna && coluna.__lastFactor || 1)),
      overlapLabel: (noOverlap && hasLimit) ? 'Sem incidência no período atual (limite fora da competência/data de atualização).' : ''
    };
  }

  function normalizeLooseNumericText(value){
    if (value == null) return '';
    let text = String(value).trim();
    if (!text) return '';
    const negativeByParentheses = /^\(.*\)$/.test(text);
    text = text.replace(/[()\s\u00a0R$\u202f]/g, '').replace(/[^\d,.\-]/g, '');
    if (!text) return '';
    const isNegative = negativeByParentheses || text.includes('-');
    text = text.replace(/-/g, '');
    const lastComma = text.lastIndexOf(',');
    const lastDot = text.lastIndexOf('.');
    const separatorIndex = Math.max(lastComma, lastDot);
    if (separatorIndex >= 0){
      const intPart = text.slice(0, separatorIndex).replace(/[.,]/g, '');
      const decimalPart = text.slice(separatorIndex + 1).replace(/[.,]/g, '');
      text = intPart + (decimalPart ? ('.' + decimalPart) : '');
    } else {
      text = text.replace(/[.,]/g, '');
    }
    if (!text) return '';
    return (isNegative ? '-' : '') + text;
  }

  function parseBRNumber(value){
    if (value == null) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const normalized = normalizeLooseNumericText(value);
    if (!normalized || normalized === '-' || normalized === '.') return 0;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : 0;
  }

  function formatNumberBR(value, minimumFractionDigits, maximumFractionDigits, useGrouping){
    const number = parseBRNumber(value);
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: minimumFractionDigits,
      maximumFractionDigits: maximumFractionDigits,
      useGrouping: useGrouping !== false
    });
  }

  function formatCurrencyBR(value){
    return formatNumberBR(value, 2, 2, true);
  }

  function formatEditableNumberBR(value){
    return formatNumberBR(value, 2, 2, false);
  }

  function monthLabel(year, monthIndex){
    const month = String(monthIndex + 1).padStart(2, '0');
    return month + '/' + year;
  }

  function compareMonth(a, b){ return String(a.month || a).localeCompare(String(b.month || b)); }
  function toBR(iso){ if (!iso) return ''; const p = String(iso).split('-'); return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0]) : iso; }
  function parseBCBNumber(value){
    const raw = String(value == null ? '' : value).trim();
    if (!raw) return 0;
    let normalized = raw;
    if (normalized.includes(',') && normalized.includes('.')) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else if (normalized.includes(',')) {
      normalized = normalized.replace(',', '.');
    }
    const num = Number(normalized);
    return Number.isFinite(num) ? num : 0;
  }
  function formatSeriesLabel(code){
    if (window.CPBCBRates && typeof window.CPBCBRates.formatSeriesLabel === 'function') return window.CPBCBRates.formatSeriesLabel(code);
    return 'série SGS ' + code;
  }
  function makeUTCDate(iso){ if (!iso) return null; const parts = String(iso).split('-').map(Number); if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null; return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])); }
  function cloneUTCDate(date){ return date instanceof Date ? new Date(date.getTime()) : null; }
  function formatUTCDateBR(date){ if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''; return String(date.getUTCDate()).padStart(2, '0') + '/' + String(date.getUTCMonth() + 1).padStart(2, '0') + '/' + date.getUTCFullYear(); }
  function addDaysUTC(date, days){ const next = cloneUTCDate(date); next.setUTCDate(next.getUTCDate() + Number(days || 0)); return next; }
  function midpointUTC(startDate, endDate){ return new Date(startDate.getTime() + Math.floor((endDate.getTime() - startDate.getTime()) / 2)); }
  async function fetchSeriesChunk(code, startDate, endDate){
    const query = 'formato=json&dataInicial=' + encodeURIComponent(formatUTCDateBR(startDate)) + '&dataFinal=' + encodeURIComponent(formatUTCDateBR(endDate));
    const urls = [
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' + code + '/dados?' + query,
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' + code + '/dados/?' + query
    ];
    let lastError = null;
    for (let index = 0; index < urls.length; index += 1){
      try {
        const part = await CPCommon.fetchJson(urls[index], { timeoutMs: 20000 });
        return Array.isArray(part) ? part : [];
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('Falha ao consultar serviço externo.');
  }
  async function fetchSeriesRecursive(code, startDate, endDate, depth){
    const level = Number(depth || 0);
    try {
      return await fetchSeriesChunk(code, startDate, endDate);
    } catch (error) {
      const is404 = /HTTP 404/.test(String(error && error.message || ''));
      const rangeDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
      if (is404 && rangeDays > 40 && level < 6){
        const middle = midpointUTC(startDate, endDate);
        const leftEnd = cloneUTCDate(middle);
        const rightStart = addDaysUTC(middle, 1);
        if (leftEnd < startDate || rightStart > endDate) throw error;
        const left = await fetchSeriesRecursive(code, startDate, leftEnd, level + 1);
        const right = await fetchSeriesRecursive(code, rightStart, endDate, level + 1);
        return left.concat(right);
      }
      throw error;
    }
  }
  async function fetchSeries(code, startDateISO, endDateISO){
    const startDate = makeUTCDate(startDateISO);
    const endDate = makeUTCDate(endDateISO);
    if (!startDate || !endDate || startDate > endDate) return [];
    const all = [];
    let curStart = cloneUTCDate(startDate);
    while (curStart <= endDate){
      let curEnd = cloneUTCDate(curStart);
      curEnd.setUTCFullYear(curEnd.getUTCFullYear() + 4);
      curEnd = addDaysUTC(curEnd, -1);
      if (curEnd > endDate) curEnd = cloneUTCDate(endDate);
      let part = [];
      try {
        part = await fetchSeriesRecursive(code, curStart, curEnd, 0);
      } catch (error) {
        throw new Error(formatSeriesLabel(code) + ': ' + (error && error.message ? error.message : 'erro inesperado.'));
      }
      if (Array.isArray(part) && part.length) all.push.apply(all, part);
      curStart = addDaysUTC(curEnd, 1);
    }
    if (!all.length) {
      throw new Error(formatSeriesLabel(code) + ': a consulta não retornou dados para o período solicitado.');
    }
    return all;
  }
  function monthlyMapFromBCB(list){ const map = new Map(); (list || []).forEach(function(item){ const p = String(item.data || '').split('/'); if (p.length === 3) map.set(p[2] + '-' + p[1], parseBCBNumber(item.valor)); }); return map; }
  function dailyToMonthlyEffective(dailyList, seriesCode){ if (!(window.CPBCBRates && typeof window.CPBCBRates.dailyToMonthlyEffective === 'function')) throw new Error('CPBCBRates.dailyToMonthlyEffective não disponível.'); return window.CPBCBRates.dailyToMonthlyEffective(dailyList, seriesCode); }
  function dailyCompoundExactFactor(dailyList, seriesCode, startISO, endISO){ if (!(window.CPBCBRates && typeof window.CPBCBRates.dailyCompoundExactFactor === 'function')) throw new Error('CPBCBRates.dailyCompoundExactFactor não disponível.'); return window.CPBCBRates.dailyCompoundExactFactor(dailyList, seriesCode, startISO, endISO); }
  (function validateDailyToMonthlyEffectiveConsistency(){ if (!(window.CPBCBRates && typeof window.CPBCBRates.validateDailyToMonthlyFixtures === 'function')) return; const report = window.CPBCBRates.validateDailyToMonthlyFixtures(dailyToMonthlyEffective); if (report.some(function(item){ return !item.passed; })) console.error('Falha nas fixtures estáticas de conversão diária->mensal (módulo cível).', report); })();
  (function validateDailyCompoundExactConsistency(){ if (!(window.CPBCBRates && typeof window.CPBCBRates.validateDailyCompoundExactFixtures === 'function')) return; const report = window.CPBCBRates.validateDailyCompoundExactFixtures(dailyCompoundExactFactor); if (report.some(function(item){ return !item.passed; })) console.error('Falha nas fixtures estáticas de composição diária exata (módulo cível).', report); })();
  (function validateProportionalMonthlyConsistency(){ if (!(window.CPBCBRates && typeof window.CPBCBRates.validateProportionalFixtures === 'function')) return; const report = window.CPBCBRates.validateProportionalFixtures(window.CPBCBRates.proportionalMonthlyEffectiveByDays); if (report.some(function(item){ return !item.passed; })) console.error('Falha nas fixtures estáticas de proporcionalização mensal (módulo cível).', report); })();
  function proportionalMonthlyEffectiveByDays(monthlyPercent, daysApplied, daysInReferenceMonth, mode){ if (!(window.CPBCBRates && typeof window.CPBCBRates.proportionalMonthlyEffectiveByDays === 'function')) throw new Error('CPBCBRates.proportionalMonthlyEffectiveByDays não disponível.'); return window.CPBCBRates.proportionalMonthlyEffectiveByDays(monthlyPercent, daysApplied, daysInReferenceMonth, mode); }
  function buildPoupancaMonthly(trList, metaSelicList){ const trMap = monthlyMapFromBCB(trList), metaMap = monthlyMapFromBCB(metaSelicList); return Array.from(new Set([].concat(Array.from(trMap.keys()), Array.from(metaMap.keys())))).sort().map(function(month){ const tr = trMap.get(month) || 0; const metaSelicAA = metaMap.get(month) || 0; const adicional = metaSelicAA > 8.5 ? 0.5 : 0.7 * (metaSelicAA / 12); return { month: month, value: tr + adicional }; }); }
  function buildJamMonthly(trList){ const trMap = monthlyMapFromBCB(trList); return Array.from(trMap.entries()).map(function(entry){ return { month: entry[0], value: entry[1] + 0.25 }; }).sort(compareMonth); }
  function buildFixedMonthlyRate(startDate, endDate, value){ const startMonth = monthKeyFromISO(startDate); const endMonth = monthKeyFromISO(endDate); if (!startMonth || !endMonth || startMonth > endMonth) return []; return monthRange(startMonth, endMonth).map(function(month){ return { month: month, value: Number(value) || 0 }; }); }
  function previousMonthKey(monthKey){ const parts = String(monthKey || '').split('-'); if (parts.length !== 2) return ''; let year = Number(parts[0]); let month = Number(parts[1]) - 1; if (month < 1){ month = 12; year -= 1; } return String(year) + '-' + String(month).padStart(2, '0'); }
  function nextMonthKey(monthKey){ const parts = String(monthKey || '').split('-'); if (parts.length !== 2) return ''; let year = Number(parts[0]); let month = Number(parts[1]) + 1; if (month > 12){ month = 1; year += 1; } return String(year) + '-' + String(month).padStart(2, '0'); }
  function buildTaxaLegalMonthly(selicDailyList, ipca15List){ const selicMap = new Map(dailyToMonthlyEffective(selicDailyList, 11).map(function(item){ return [item.month, item.value]; })); const ipca15Map = monthlyMapFromBCB(ipca15List); const months = Array.from(new Set([].concat(Array.from(selicMap.keys()), Array.from(ipca15Map.keys())))).sort(); return months.map(function(baseMonth){ const refMonth = nextMonthKey(baseMonth); if (!refMonth || refMonth < '2024-09') return null; const percent = Math.max((Number(selicMap.get(baseMonth) || 0) - Number(ipca15Map.get(baseMonth) || 0)), 0); return { month: refMonth, value: percent }; }).filter(Boolean).sort(compareMonth); }
  function buildEc113Monthly(ipcaeList, selicDailyList){ const ipcaeMap = monthlyMapFromBCB(ipcaeList); const selicMap = new Map(dailyToMonthlyEffective(selicDailyList, 11).map(function(item){ return [item.month, item.value]; })); const months = Array.from(new Set([].concat(Array.from(ipcaeMap.keys()), Array.from(selicMap.keys())))).sort(); return months.map(function(month){ if (month <= '2021-11') return { month: month, value: Number(ipcaeMap.get(month) || 0) }; if (month >= '2021-12') return { month: month, value: Number(selicMap.get(month) || 0) }; return null; }).filter(Boolean).sort(compareMonth); }
  function sourceAccumulationMode(sourceType){ return sourceType === 'taxa_legal' ? 'simple' : 'compound'; }
  function makeIndexPayload(path, monthlyRates, dailyRates, dailySeriesCode){ return { calculationPath: path || 'monthly', monthlyRates: Array.isArray(monthlyRates) ? monthlyRates : [], dailyRates: Array.isArray(dailyRates) ? dailyRates : [], dailySeriesCode: dailySeriesCode || null }; }
  async function loadAutoIndices(sourceType, startDate, endDate){ if (!startDate || !endDate || sourceType === 'none') return makeIndexPayload('monthly', []); if (sourceType === 'ipca') return makeIndexPayload('monthly', Array.from(monthlyMapFromBCB(await fetchSeries(433, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth)); if (sourceType === 'ipcae') return makeIndexPayload('monthly', Array.from(monthlyMapFromBCB(await fetchSeries(10764, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth)); if (sourceType === 'inpc') return makeIndexPayload('monthly', Array.from(monthlyMapFromBCB(await fetchSeries(188, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth)); if (sourceType === 'igpm') return makeIndexPayload('monthly', Array.from(monthlyMapFromBCB(await fetchSeries(189, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth)); if (sourceType === 'igpdi') return makeIndexPayload('monthly', Array.from(monthlyMapFromBCB(await fetchSeries(190, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth)); if (sourceType === 'tr') return makeIndexPayload('monthly', Array.from(monthlyMapFromBCB(await fetchSeries(7811, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth)); if (sourceType === 'cdi') { const raw = await fetchSeries(4389, startDate, endDate); return makeIndexPayload('daily_compound_exact', dailyToMonthlyEffective(raw, 4389), raw, 4389); } if (sourceType === 'selic') { const rawSelic = await fetchSeries(11, startDate, endDate); return makeIndexPayload('daily_compound_exact', dailyToMonthlyEffective(rawSelic, 11), rawSelic, 11); } if (sourceType === 'taxa_legal') { const taxaLegalStart = previousMonthKey(monthKeyFromISO(startDate)); const taxaLegalStartISO = taxaLegalStart ? (taxaLegalStart + '-01') : startDate; return makeIndexPayload('monthly', buildTaxaLegalMonthly(await fetchSeries(11, taxaLegalStartISO, endDate), await fetchSeries(7478, taxaLegalStartISO, endDate))); } if (sourceType === 'ec113_2021') return makeIndexPayload('monthly', buildEc113Monthly(await fetchSeries(10764, startDate, endDate), await fetchSeries(11, startDate, endDate))); if (sourceType === 'poupanca_auto') return makeIndexPayload('monthly', buildPoupancaMonthly(await fetchSeries(7811, startDate, endDate), await fetchSeries(432, startDate, endDate))); if (sourceType === 'juros_1am') return makeIndexPayload('monthly', buildFixedMonthlyRate(startDate, endDate, 1)); if (sourceType === 'jam_auto') return makeIndexPayload('monthly', buildJamMonthly(await fetchSeries(7811, startDate, endDate))); return makeIndexPayload('monthly', []); }
  function formatPercent(value){ return formatNumberBR(value, 4, 6, true) + '%'; }
  function formatIndexFactor(value){
    return formatNumberBR(value, 7, 7, true);
  }

  function formatInputValueByColumn(coluna, value){
    return displayColumnValue(coluna, value, { forInput:true });
  }
  function defaultIndexSourceByKind(kind){
    return kind === 'juros' ? 'selic' : 'ipca';
  }

  function normalizeIndexColumn(coluna, fallback){
    const base = Object.assign({}, fallback || {}, coluna || {});
    const kind = base.indexKind === 'juros' ? 'juros' : 'correcao';
    const source = String(base.indexSource || base.defaultSource || defaultIndexSourceByKind(kind) || '').trim() || defaultIndexSourceByKind(kind);
    const mode = String(base.accumulationMode || sourceAccumulationMode(source) || 'compound').trim() || 'compound';
    const limit = base.indexLimit || {};
    const composition = getIndexComposition(Object.assign({}, base, {
      indexKind: kind,
      indexSource: source,
      indexLimit: { start: String(limit.start || ''), end: String(limit.end || '') }
    }));
    return Object.assign({}, base, {
      tipo: 'indice',
      formato: 'indice',
      indexKind: kind,
      indexSource: source,
      accumulationMode: mode,
      indexLimit: { start: String(limit.start || ''), end: String(limit.end || '') },
      indexComposition: composition
    });
  }

  function getIndexColumns(lancamento){
    return (lancamento && Array.isArray(lancamento.colunas) ? lancamento.colunas : []).filter(function(coluna){ return coluna && coluna.tipo === 'indice'; });
  }

  function getIndexColumnByKind(lancamento, kind){
    return getIndexColumns(lancamento).find(function(coluna){ return coluna.indexKind === kind; }) || null;
  }

  function buildDefaultColumns(){
    const valor = { id:'valor', nome:'Valor', tipo:'manual' };
    return [valor];
  }
  function defaultIndexConfig(){ return { mode: 'factor_v9', lastAutoRefresh: '' }; }
  function defaultSummaryMapping(){
    return { valorCorrigidoColumnId: 'valor_correcao', jurosColumnId: 'valor_juros' };
  }

  function uid(prefix){
    return String(prefix || 'id') + '_' + Date.now() + '_' + Math.random().toString(16).slice(2);
  }

  function roundMoney(value){
    return Number(parseBRNumber(value).toFixed(2));
  }

  function defaultHonorariosConfig(){
    return { enabled:false, descricao:'Honorários', percentual:10, launchIds:[] };
  }

  function normalizeHonorarios(config){
    const base = Object.assign(defaultHonorariosConfig(), config || {});
    return {
      enabled: !!base.enabled,
      descricao: String(base.descricao || 'Honorários').trim() || 'Honorários',
      percentual: parseBRNumber(base.percentual || 0),
      launchIds: Array.isArray(base.launchIds) ? base.launchIds.map(String).filter(Boolean) : []
    };
  }

  function normalizeCusta(item){
    const source = item || {};
    return {
      id: String(source.id || uid('custa')),
      descricao: String(source.descricao || 'Custas').trim() || 'Custas',
      valor: roundMoney(source.valor || 0)
    };
  }

  function sanitizeSummaryState(){
    state.honorarios = normalizeHonorarios(state.honorarios);
    const validLaunchIds = new Set((state.lancamentos || []).map(function(lancamento){ return String(lancamento.id || ''); }).filter(Boolean));
    state.honorarios.launchIds = state.honorarios.launchIds.filter(function(id){ return validLaunchIds.has(String(id)); });
    state.custas = Array.isArray(state.custas) ? state.custas.map(normalizeCusta) : [];
  }

  function ensureHonorariosDefaultSelection(){
    state.honorarios = normalizeHonorarios(state.honorarios);
    if (!state.honorarios.enabled) return;
    if (state.honorarios.launchIds.length) return;
    if (!(state.lancamentos || []).length) return;
    state.honorarios.launchIds = state.lancamentos.map(function(lancamento){ return lancamento.id; });
  }

  function launchNeedsIndexRefresh(lancamento){
    const indexColumns = getIndexColumns(lancamento);
    return (lancamento.linhas || []).some(function(linha){
      return indexColumns.some(function(coluna){
        const fator = Number(linha[coluna.id] || 1);
        return !Number.isFinite(fator) || fator <= 0 || fator > 2;
      });
    });
  }

  function monthKeyFromISO(value){
    if (!value) return '';
    const parts = String(value).split('-');
    return parts.length === 3 ? (parts[0] + '-' + parts[1]) : '';
  }

  function monthKeyFromPeriodo(periodo){
    const parts = String(periodo || '').split('/');
    return parts.length === 2 ? (parts[1] + '-' + parts[0]) : '';
  }

  function monthRange(startMonthKey, endMonthKey){
    if (!startMonthKey || !endMonthKey || startMonthKey > endMonthKey) return [];
    const start = String(startMonthKey).split('-');
    const end = String(endMonthKey).split('-');
    if (start.length !== 2 || end.length !== 2) return [];
    let year = Number(start[0]);
    let month = Number(start[1]);
    const endYear = Number(end[0]);
    const endMonth = Number(end[1]);
    const list = [];
    while (year < endYear || (year === endYear && month <= endMonth)){
      list.push(String(year) + '-' + String(month).padStart(2, '0'));
      month += 1;
      if (month > 12){ month = 1; year += 1; }
    }
    return list;
  }

  function parseISODateUTC(value){
    const parts = String(value || '').split('-').map(Number);
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  }

  function formatISODateUTC(date){
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    return String(date.getUTCFullYear()) + '-' + String(date.getUTCMonth() + 1).padStart(2, '0') + '-' + String(date.getUTCDate()).padStart(2, '0');
  }

  function clampPeriodByLimit(requestedStartISO, requestedEndISO, limit){
    const requestedStart = parseISODateUTC(requestedStartISO);
    const requestedEnd = parseISODateUTC(requestedEndISO);
    if (!requestedStart || !requestedEnd || requestedStart > requestedEnd) return null;
    const limitStart = parseISODateUTC(limit && limit.start ? limit.start : '');
    const limitEnd = parseISODateUTC(limit && limit.end ? limit.end : '');
    const effectiveStartDate = limitStart && limitStart > requestedStart ? limitStart : requestedStart;
    const effectiveEndDate = limitEnd && limitEnd < requestedEnd ? limitEnd : requestedEnd;
    if (!effectiveStartDate || !effectiveEndDate || effectiveStartDate > effectiveEndDate) return null;
    return {
      startISO: formatISODateUTC(effectiveStartDate),
      endISO: formatISODateUTC(effectiveEndDate)
    };
  }

  function minISODate(aISO, bISO){
    const a = parseISODateUTC(aISO);
    const b = parseISODateUTC(bISO);
    if (a && b) return a <= b ? formatISODateUTC(a) : formatISODateUTC(b);
    if (a) return formatISODateUTC(a);
    if (b) return formatISODateUTC(b);
    return '';
  }

  function requestedStartISOForColumn(coluna, competenciaStartISO){
    const baseStart = String(competenciaStartISO || '');
    if (!coluna || coluna.indexKind !== 'juros') return baseStart;
    const limit = getIndexLimit(coluna);
    if (limit && limit.start) return String(limit.start);
    return baseStart;
  }

  function monthBoundsUTC(monthKey){
    const parts = String(monthKey || '').split('-').map(Number);
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    const start = new Date(Date.UTC(parts[0], parts[1] - 1, 1));
    const end = new Date(Date.UTC(parts[0], parts[1], 0));
    return { start: start, end: end, daysInMonth: end.getUTCDate() };
  }

  function adjustedMonthlyPercent(monthlyPercent, monthKey, periodStartISO, periodEndISO, mode){
    const bounds = monthBoundsUTC(monthKey);
    if (!bounds) return 0;
    const periodStart = parseISODateUTC(periodStartISO);
    const periodEnd = parseISODateUTC(periodEndISO);
    if (!periodStart || !periodEnd || periodStart > periodEnd) return 0;
    const applyStart = periodStart > bounds.start ? periodStart : bounds.start;
    const applyEnd = periodEnd < bounds.end ? periodEnd : bounds.end;
    if (applyStart > applyEnd) return 0;
    const daysApplied = Math.floor((applyEnd.getTime() - applyStart.getTime()) / 86400000) + 1;
    return proportionalMonthlyEffectiveByDays(monthlyPercent, daysApplied, bounds.daysInMonth, mode === 'simple' ? 'linear' : 'compound');
  }

  function accumulateIndexFactor(monthMap, startMonthKey, endMonthKey, limit, mode, periodStartISO, periodEndISO){
    if (!startMonthKey || !endMonthKey || startMonthKey > endMonthKey) return 1;
    const accumulationMode = mode || 'compound';
    const requestedStartISO = String(periodStartISO || (startMonthKey + '-01'));
    const requestedEndISO = String(periodEndISO || (endMonthKey + '-31'));
    const effectivePeriod = clampPeriodByLimit(requestedStartISO, requestedEndISO, limit);
    if (!effectivePeriod) return 1;
    const effectiveStartISO = effectivePeriod.startISO;
    const effectiveEndISO = effectivePeriod.endISO;
    const clampedStart = effectiveStartISO.slice(0, 7);
    const clampedEnd = effectiveEndISO.slice(0, 7);
    if (!clampedStart || !clampedEnd || clampedStart > clampedEnd) return 1;
    return monthRange(clampedStart, clampedEnd).reduce(function(factor, monthKey){
      const percent = Number(monthMap.get(monthKey) || 0);
      const adjustedPercent = adjustedMonthlyPercent(percent, monthKey, effectiveStartISO, effectiveEndISO, accumulationMode);
      if (accumulationMode === 'simple') return factor + (adjustedPercent / 100);
      return factor * (1 + adjustedPercent / 100);
    }, 1);
  }

  function buildMonthlyRows(startDate, endDate){
    const rows = [];
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    let year = start.getFullYear();
    let month = start.getMonth();
    const endYear = end.getFullYear();
    const endMonth = end.getMonth();
    while (year < endYear || (year === endYear && month <= endMonth)){
      rows.push({ periodo: monthLabel(year, month), valor: '' });
      month += 1;
      if (month > 11){ month = 0; year += 1; }
    }
    return rows;
  }

  function collect(){
    sanitizeSummaryState();
    return {
      requerente: fields.requerente.value.trim(),
      requerido: fields.requerido.value.trim(),
      processo: fields.processo.value.trim(),
      ajuizamento: fields.ajuizamento.value,
      dataAtualizacao: fields.dataAtualizacao.value || new Date().toISOString().slice(0,10),
      observacoes: fields.observacoes.value.trim(),
      lancamentos: state.lancamentos,
      lancamentoSelecionadoId: state.lancamentoSelecionadoId || '',
      honorarios: state.honorarios,
      custas: state.custas,
      atualizadoEm: new Date().toLocaleString('pt-BR')
    };
  }

  function fill(data){
    const source = data || {};
    fields.requerente.value = source.requerente || '';
    fields.requerido.value = source.requerido || '';
    fields.processo.value = source.processo || '';
    fields.ajuizamento.value = source.ajuizamento || '';
    fields.dataAtualizacao.value = source.dataAtualizacao || new Date().toISOString().slice(0,10);
    fields.observacoes.value = source.observacoes || '';
    state.lancamentos = normalizeLaunchListSafely(Array.isArray(source.lancamentos) ? source.lancamentos : []);
    state.lancamentoSelecionadoId = source.lancamentoSelecionadoId || (state.lancamentos[0] ? state.lancamentos[0].id : '');
    state.honorarios = normalizeHonorarios(source.honorarios);
    state.custas = Array.isArray(source.custas) ? source.custas.map(normalizeCusta) : [];
    sanitizeSummaryState();
  }

  function save(data){
    if (window.CPCommon && CPCommon.storage) CPCommon.storage.save(STORAGE_KEY, data);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadFromStorageKey(key){
    if (!key) return null;
    if (window.CPCommon && CPCommon.storage) return CPCommon.storage.load(key, null);
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch(e){
      return null;
    }
  }

  function load(){
    const current = loadFromStorageKey(STORAGE_KEY);
    if (current && Object.keys(current).length) return current;
    for (let index = 0; index < LEGACY_STORAGE_KEYS.length; index += 1){
      const legacy = loadFromStorageKey(LEGACY_STORAGE_KEYS[index]);
      if (legacy && Object.keys(legacy).length) return legacy;
    }
    return {};
  }

  function normalizeLaunchListSafely(list){
    return (Array.isArray(list) ? list : []).reduce(function(acc, lancamento){
      try {
        acc.push(recalculateLaunch(normalizeLaunch(lancamento)));
      } catch (error) {
        console.error('Falha ao normalizar lançamento do cálculo cível.', error);
      }
      return acc;
    }, []);
  }

  function switchTab(tab){
    ['dados','report'].forEach(function(name){
      const btn = name === 'dados' ? $('tabBtnDados') : $('tabBtnReport');
      const pane = name === 'dados' ? $('tab-dados') : $('tab-report');
      const active = name === tab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      pane.classList.toggle('active', active);
    });
  }

  function columnLetter(index){
    let value = index + 1;
    let result = '';
    while (value > 0){
      const mod = (value - 1) % 26;
      result = String.fromCharCode(65 + mod) + result;
      value = Math.floor((value - 1) / 26);
    }
    return result;
  }

  function columnTitle(coluna, idx){
    return '(' + columnLetter(idx + 1) + ') ' + (coluna.nome || '');
  }

  function defaultValorCorrecaoFormula(){
    return '({valor}*({correcao_monetaria}-1))';
  }

  function defaultValorJurosFormula(){
    return '(({valor}+{valor_correcao})*({juros}-1))';
  }

  function defaultValorDevidoFormula(){
    return '({valor}+{valor_correcao}+{valor_juros})';
  }

  function defaultSummaryRoleByColumnId(columnId){
    const id = String(columnId || '');
    if (id === 'valor_correcao') return 'correcao';
    if (id === 'valor_juros') return 'juros';
    return 'none';
  }

  function normalizeColumnSummaryMeta(coluna){
    if (!coluna) return coluna;
    if (!coluna.summaryRole) {
      if (coluna.includeInSummary === true) coluna.summaryRole = defaultSummaryRoleByColumnId(coluna.id);
      else coluna.summaryRole = 'none';
    }
    if (coluna.summaryRole !== 'correcao' && coluna.summaryRole !== 'juros') coluna.summaryRole = 'none';
    delete coluna.includeInSummary;
    return coluna;
  }

  function canColumnUseSummaryRole(coluna){
    if (!coluna) return false;
    if (coluna.tipo === 'indice') return false;
    if (coluna.formato === 'indice' || coluna.formato === 'percentual') return false;
    return true;
  }

  function getSummaryRoleTotals(lancamento){
    return (lancamento && Array.isArray(lancamento.colunas) ? lancamento.colunas : []).reduce(function(acc, coluna){
      if (!coluna || !canColumnUseSummaryRole(coluna)) return acc;
      if (String(coluna.id || '') === 'valor') return acc;
      const role = coluna.summaryRole === 'correcao' || coluna.summaryRole === 'juros' ? coluna.summaryRole : 'none';
      if (role === 'none') return acc;
      acc[role] += roundMoney(totalLancamento(lancamento, coluna.id));
      return acc;
    }, { correcao:0, juros:0 });
  }

  function hasSummaryRoleConfigured(lancamento){
    return (lancamento && Array.isArray(lancamento.colunas) ? lancamento.colunas : []).some(function(coluna){
      if (!coluna || !canColumnUseSummaryRole(coluna)) return false;
      if (String(coluna.id || '') === 'valor') return false;
      return coluna.summaryRole === 'correcao' || coluna.summaryRole === 'juros';
    });
  }

  function formulaTokenByColumnId(columnId){
    const tokenId = String(columnId || '').trim();
    if (!tokenId) return '';
    return '{' + tokenId + '}';
  }

  function buildFormulaMaps(lancamento){
    const letterToId = {};
    const aliasToId = {
      VALOR: 'valor',
      CORRECAO_MONETARIA: 'correcao_monetaria',
      JUROS: 'juros',
      VALOR_CORRECAO: 'valor_correcao',
      VALOR_JUROS: 'valor_juros',
      VALOR_DEVIDO: 'valor_devido'
    };
    (lancamento && Array.isArray(lancamento.colunas) ? lancamento.colunas : []).forEach(function(coluna, idx){
      if (!coluna || !coluna.id) return;
      const letter = columnLetter(idx + 1);
      letterToId[letter] = coluna.id;
      aliasToId[String(coluna.id).toUpperCase()] = coluna.id;
    });
    return { letterToId: letterToId, aliasToId: aliasToId };
  }

  function convertFormulaToStableTokens(formula, lancamento){
    const text = String(formula || '').trim();
    if (!text) return text;
    const maps = buildFormulaMaps(lancamento);
    const protectedText = text.replace(/\{\s*([a-zA-Z0-9_]+)\s*\}/g, function(match, tokenId){
      return formulaTokenByColumnId(tokenId);
    });
    const aliasesReplaced = protectedText.replace(/\b([A-Z_][A-Z0-9_]*)\b/g, function(match){
      const mappedId = maps.aliasToId[String(match || '').toUpperCase()];
      return mappedId ? formulaTokenByColumnId(mappedId) : match;
    });
    return aliasesReplaced.replace(/\b([A-Z]{1,3})\b/g, function(match){
      const mappedId = maps.letterToId[String(match || '').toUpperCase()];
      return mappedId ? formulaTokenByColumnId(mappedId) : match;
    });
  }

  function formatFormulaForDisplay(formula, lancamento){
    const text = String(formula || '').trim();
    if (!text) return '';
    const maps = buildFormulaMaps(lancamento);
    const idToLetter = {};
    Object.keys(maps.letterToId).forEach(function(letter){
      idToLetter[maps.letterToId[letter]] = letter;
    });
    return text.replace(/\{\s*([a-zA-Z0-9_]+)\s*\}/g, function(match, tokenId){
      const mappedLetter = idToLetter[String(tokenId || '').trim()];
      return mappedLetter || match;
    });
  }

  function isLegacyValorDevidoFormula(formula){
    const normalized = String(formula || '').toUpperCase().replace(/\s+/g, '').replace(/X/g, '*');
    return normalized === '(B*C*D)' || normalized === '(B*C*E)' || normalized === '(B*D*E)' || normalized === '(B*CORRECAO_MONETARIA*JUROS)';
  }

  function getIndexLimit(coluna){
    if (coluna && Array.isArray(coluna.indexComposition) && coluna.indexComposition.length) {
      const first = coluna.indexComposition[0] || {};
      return { start: String(first.start || ''), end: String(first.end || '') };
    }
    const limit = coluna && coluna.indexLimit ? coluna.indexLimit : {};
    return { start: String(limit.start || ''), end: String(limit.end || '') };
  }

  function normalizeLaunch(lancamento){
    lancamento.observacao = String(lancamento.observacao || '');
    lancamento.indexConfig = Object.assign(defaultIndexConfig(), lancamento.indexConfig || {});
    const existing = Array.isArray(lancamento.colunas) ? lancamento.colunas.slice() : [];
    const valor = existing.find(function(item){ return item && item.id === 'valor'; }) || { id:'valor', nome:'Valor', tipo:'manual' };
    const fixedColumnIds = new Set(['correcao_monetaria', 'juros', 'valor_correcao', 'valor_juros', 'valor_devido']);
    const dynamicColumns = existing.filter(function(item){
      return item && item.id !== 'valor' && !fixedColumnIds.has(String(item.id || ''));
    }).map(function(coluna){
      const normalized = coluna && coluna.tipo === 'indice' ? normalizeIndexColumn(coluna) : coluna;
      return normalizeColumnSummaryMeta(normalized);
    });

    lancamento.colunas = [normalizeColumnSummaryMeta(Object.assign({ id:'valor', nome:'Valor', tipo:'manual' }, valor))].concat(dynamicColumns);
    lancamento.colunas.forEach(function(coluna){
      if (coluna && coluna.tipo === 'formula') coluna.formula = convertFormulaToStableTokens(coluna.formula, lancamento);
    });
    lancamento.linhas = Array.isArray(lancamento.linhas) ? lancamento.linhas : [];
    lancamento.linhas = lancamento.linhas.map(function(linha){
      const novaLinha = Object.assign({ periodo: linha.periodo || '', valor: linha.valor || '' }, linha);
      lancamento.colunas.forEach(function(coluna, idx){
        const key = coluna.id || ('col_' + idx);
        if (key === 'valor') { if (novaLinha.valor === undefined) novaLinha.valor = ''; }
        else if (novaLinha[key] === undefined) novaLinha[key] = coluna.tipo === 'indice' ? 1 : (coluna.tipo === 'formula' ? 0 : '');
      });
      return novaLinha;
    });
    if (lancamento.indexConfig.mode !== 'factor_v9') {
      lancamento.linhas.forEach(function(linha){
        getIndexColumns(lancamento).forEach(function(coluna){
          const key = coluna.id;
          const raw = Number(String(linha[key] === undefined ? '' : linha[key]).replace(',', '.'));
          linha[key] = Number.isFinite(raw) ? (raw === 0 ? 1 : Number((1 + raw / 100).toFixed(7))) : 1;
        });
      });
      lancamento.indexConfig.mode = 'factor_v9';
    }
    if (lancamento && lancamento.summaryMapping) delete lancamento.summaryMapping;
    return lancamento;
  }

  function getNumericValue(linha, colunaId){
    const raw = colunaId === 'valor' ? linha.valor : linha[colunaId];
    const num = Number(String(raw === undefined ? '' : raw).replace(',', '.'));
    return Number.isFinite(num) ? num : 0;
  }

  function evaluateFormula(formula, valuesById, valuesByLetter){
    const byId = valuesById || {};
    const byLetter = valuesByLetter || {};
    const expression = String(formula || '')
      .replace(/\s+/g, '')
      .replace(/[xX]/g, '*')
      .replace(/,/g, '.')
      .replace(/\{\s*([a-zA-Z0-9_]+)\s*\}/g, function(match, tokenId){
        return Object.prototype.hasOwnProperty.call(byId, tokenId) ? '(' + byId[tokenId] + ')' : '(0)';
      })
      .replace(/\b([A-Z]{1,3})\b/g, function(match){
        const key = String(match || '').toUpperCase();
        return Object.prototype.hasOwnProperty.call(byLetter, key) ? '(' + byLetter[key] + ')' : '(0)';
      });
    if (!expression) return '';
    if (/[^0-9+\-*/().]/.test(expression)) return 'Fórmula inválida';
    try {
      const result = Function('return ' + expression)();
      if (!Number.isFinite(result)) return '';
      return Number(result.toFixed(2));
    } catch (error){
      return 'Fórmula inválida';
    }
  }

  function recalculateLaunch(lancamento){
    normalizeLaunch(lancamento);
    lancamento.linhas.forEach(function(linha){
      const valuesById = {};
      const valuesByLetter = { A: 0 };
      lancamento.colunas.forEach(function(coluna, idx){
        const letter = columnLetter(idx + 1);
        const key = coluna.id || (idx === 0 ? 'valor' : 'col_' + idx);
        if (coluna.tipo === 'formula') {
          linha[key] = evaluateFormula(coluna.formula, valuesById, valuesByLetter);
        }
        const rawValue = key === 'valor' ? linha.valor : linha[key];
        const numericValue = Number(String(rawValue === undefined ? '' : rawValue).replace(',', '.'));
        const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
        valuesByLetter[letter] = safeValue;
        valuesById[key] = safeValue;
      });
    });
    return lancamento;
  }

  function syncSelectedLaunch(){
    const exists = state.lancamentos.some(function(item){ return item.id === state.lancamentoSelecionadoId; });
    if (!exists) state.lancamentoSelecionadoId = state.lancamentos[0] ? state.lancamentos[0].id : '';
  }

  function getSelectedLaunchIndex(){
    syncSelectedLaunch();
    return state.lancamentos.findIndex(function(item){ return item.id === state.lancamentoSelecionadoId; });
  }

  function renderLaunchSelector(){
    syncSelectedLaunch();
    if (!state.lancamentos.length){
      launchSelector.innerHTML = '<option value="">Nenhum lançamento cadastrado</option>';
      launchSelector.value = '';
      $('btnRenomearLancamento').disabled = true;
      $('btnExcluirLancamentoSelecionado').disabled = true;
      return;
    }
    launchSelector.innerHTML = state.lancamentos.map(function(lancamento, index){
      const txt = (index + 1) + '. ' + lancamento.verba + ' — ' + formatDateBR(lancamento.dataInicial) + ' até ' + formatDateBR(lancamento.dataFinal);
      return '<option value="' + esc(lancamento.id) + '">' + esc(txt) + '</option>';
    }).join('');
    launchSelector.value = state.lancamentoSelecionadoId;
    $('btnRenomearLancamento').disabled = false;
    $('btnExcluirLancamentoSelecionado').disabled = false;
  }

  function buildIndexSegmentRowHtml(kind, segment){
    const opts = INDEX_SOURCE_OPTIONS[kind] || [];
    const source = segment && segment.source ? segment.source : defaultIndexSourceByKind(kind);
    const start = segment && segment.start ? segment.start : '';
    const end = segment && segment.end ? segment.end : '';
    return '' +
      '<div class="row js-index-segment-row" style="margin:0">' +
        '<div class="col-4"><label>Fonte complementar</label><select class="select js-index-segment-source">' + opts.map(function(opt){ return '<option value="' + esc(opt.value) + '"' + (opt.value === source ? ' selected' : '') + '>' + esc(opt.label) + '</option>'; }).join('') + '</select></div>' +
        '<div class="col-3"><label>Início</label><input class="js-index-segment-start" type="date" value="' + esc(start) + '"></div>' +
        '<div class="col-3"><label>Fim</label><input class="js-index-segment-end" type="date" value="' + esc(end) + '"></div>' +
        '<div class="col-2" style="display:flex;align-items:end"><button type="button" class="btn btn-danger js-remove-index-segment">Remover</button></div>' +
      '</div>';
  }

  function renderIndexSegmentList(host, kind, segments){
    if (!host) return;
    const rows = (segments || []).map(function(segment){ return buildIndexSegmentRowHtml(kind, segment); });
    host.innerHTML = rows.join('');
  }

  function collectExtraIndexSegments(host, kind){
    if (!host) return [];
    return Array.from(host.querySelectorAll('.js-index-segment-row')).map(function(row){
      const sourceEl = row.querySelector('.js-index-segment-source');
      const startEl = row.querySelector('.js-index-segment-start');
      const endEl = row.querySelector('.js-index-segment-end');
      return normalizeIndexSegment({
        source: sourceEl ? sourceEl.value : '',
        start: startEl ? startEl.value : '',
        end: endEl ? endEl.value : ''
      }, kind);
    });
  }

  function validateIndexComposition(composition){
    for (let i = 0; i < composition.length; i += 1){
      const item = composition[i];
      if (item.start && item.end && item.start > item.end) {
        return 'A faixa ' + (i + 1) + ' possui data inicial maior que a data final.';
      }
    }
    return '';
  }

  function openEditColumnModal(launchIndex, columnId){
    const lancamento = state.lancamentos[launchIndex];
    if (!lancamento) return;
    const coluna = lancamento.colunas.find(function(item){ return item.id === columnId; });
    if (!coluna) return;
    editModalLaunchIndex.value = String(launchIndex);
    editModalColumnId.value = columnId;
    editModalColumnName.value = coluna.nome || '';
    editModalColumnFormula.value = coluna.formula || '';
    editFormulaFieldWrap.style.display = coluna.tipo === 'formula' ? 'block' : 'none';
    editIndexFieldWrap.style.display = coluna.tipo === 'indice' ? 'block' : 'none';
    editModalColumnName.readOnly = !!coluna.locked;
    editModalColumnName.placeholder = coluna.locked ? 'Nome fixo da coluna padrão' : 'Ex.: Índice, Percentual, Resultado';
    const canAssignSummaryRole = canColumnUseSummaryRole(coluna) && !coluna.locked;
    if (editModalColumnSummaryRole) {
      editModalColumnSummaryRole.value = canAssignSummaryRole ? (coluna.summaryRole || 'none') : 'none';
      editModalColumnSummaryRole.disabled = !canAssignSummaryRole;
    }
    if (coluna.tipo === 'indice') {
      const opts = INDEX_SOURCE_OPTIONS[coluna.indexKind || 'correcao'] || [];
      const composition = getIndexComposition(coluna);
      const current = composition[0] ? composition[0].source : (coluna.indexSource || defaultIndexSourceByKind(coluna.indexKind || 'correcao'));
      editModalIndexSource.innerHTML = opts.map(function(opt){ return '<option value="' + esc(opt.value) + '"' + (opt.value === current ? ' selected' : '') + '>' + esc(opt.label) + '</option>'; }).join('');
      const first = composition[0] || { start:'', end:'' };
      editModalIndexStart.value = first.start || '';
      editModalIndexEnd.value = first.end || '';
      renderIndexSegmentList(editModalIndexSegments, coluna.indexKind || 'correcao', composition.slice(1));
    } else {
      editModalIndexSource.innerHTML = '';
      editModalIndexStart.value = '';
      editModalIndexEnd.value = '';
      renderIndexSegmentList(editModalIndexSegments, 'correcao', []);
    }
    editColumnModal.classList.add('open');
    editColumnModal.setAttribute('aria-hidden', 'false');
    setTimeout(function(){ (coluna.tipo === 'indice' ? editModalIndexSource : editModalColumnName).focus(); }, 30);
  }

  function closeEditColumnModal(){
    editColumnModal.classList.remove('open');
    editColumnModal.setAttribute('aria-hidden', 'true');
    editModalLaunchIndex.value = '';
    editModalColumnId.value = '';
    editModalColumnName.value = '';
    editModalColumnFormula.value = '';
    editModalColumnName.readOnly = false;
    if (editModalColumnSummaryRole) {
      editModalColumnSummaryRole.value = 'none';
      editModalColumnSummaryRole.disabled = false;
    }
    editFormulaFieldWrap.style.display = 'none';
    editIndexFieldWrap.style.display = 'none';
    editModalIndexSource.innerHTML = '';
    editModalIndexStart.value = '';
    editModalIndexEnd.value = '';
    renderIndexSegmentList(editModalIndexSegments, 'correcao', []);
  }

  function saveEditColumnModal(){
    const launchIndex = Number(editModalLaunchIndex.value);
    const columnId = editModalColumnId.value;
    const nome = editModalColumnName.value.trim();
    const formula = editModalColumnFormula.value.trim();
    const lancamento = state.lancamentos[launchIndex];
    if (!lancamento) return closeEditColumnModal();
    const coluna = lancamento.colunas.find(function(item){ return item.id === columnId; });
    if (!coluna) return closeEditColumnModal();
    if (coluna.tipo === 'indice') {
      if (!coluna.locked && nome) coluna.nome = nome;
      const kind = coluna.indexKind || 'correcao';
      const composition = [normalizeIndexSegment({
        source: editModalIndexSource.value || defaultIndexSourceByKind(kind),
        start: editModalIndexStart.value || '',
        end: editModalIndexEnd.value || ''
      }, kind)].concat(collectExtraIndexSegments(editModalIndexSegments, kind));
      const validationError = validateIndexComposition(composition);
      if (validationError) {
        alert(validationError);
        return;
      }
      coluna.indexComposition = composition;
      syncLegacyIndexFieldsFromComposition(coluna);
      normalizeColumnSummaryMeta(coluna);
      closeEditColumnModal();
      persistAndRefresh();
      updateIndicesForLaunch(launchIndex);
      return;
    }
    if (!nome){ alert('Informe o nome da coluna.'); editModalColumnName.focus(); return; }
    if (coluna.tipo === 'formula' && !formula){ alert('Informe a fórmula da coluna.'); editModalColumnFormula.focus(); return; }
    coluna.nome = nome;
    if (coluna.tipo === 'formula') coluna.formula = convertFormulaToStableTokens(formula, lancamento);
    if (canColumnUseSummaryRole(coluna) && !coluna.locked && editModalColumnSummaryRole) {
      coluna.summaryRole = editModalColumnSummaryRole.value || 'none';
    }
    normalizeColumnSummaryMeta(coluna);
    recalculateLaunch(lancamento);
    closeEditColumnModal();
    persistAndRefresh();
  }

  function removeColumn(launchIndex, columnId){
    const lancamento = state.lancamentos[launchIndex];
    if (!lancamento) return;
    const pos = lancamento.colunas.findIndex(function(item){ return item.id === columnId; });
    if (pos === -1) return;
    const coluna = lancamento.colunas[pos];
    if (coluna.id === 'valor'){ alert('A coluna Valor é obrigatória e não pode ser removida.'); return; }
    lancamento.colunas.splice(pos, 1);
    lancamento.linhas.forEach(function(linha){ delete linha[columnId]; });
    normalizeSummaryMapping(lancamento);
    recalculateLaunch(lancamento);
    persistAndRefresh();
  }

  function canMoveColumnTo(lancamento, fromIndex, toIndex){
    if (!lancamento || !Array.isArray(lancamento.colunas)) return false;
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= lancamento.colunas.length || toIndex >= lancamento.colunas.length) return false;
    const fromCol = lancamento.colunas[fromIndex];
    const toCol = lancamento.colunas[toIndex];
    if (!fromCol || !toCol) return false;
    if (fromIndex === toIndex) return false;
    if (isColumnFixedForReorder(fromCol) || isColumnFixedForReorder(toCol)) return false;
    return true;
  }

  function isColumnFixedForReorder(coluna){
    if (!coluna) return true;
    return !!coluna.locked;
  }

  function findReorderTargetIndex(lancamento, fromIndex, direction){
    if (!lancamento || !Array.isArray(lancamento.colunas)) return -1;
    const step = direction === 'left' ? -1 : 1;
    let cursor = fromIndex + step;
    while (cursor >= 0 && cursor < lancamento.colunas.length) {
      const candidate = lancamento.colunas[cursor];
      if (candidate && !isColumnFixedForReorder(candidate)) return cursor;
      cursor += step;
    }
    return -1;
  }

  function moveColumn(launchIndex, columnId, direction){
    const lancamento = state.lancamentos[launchIndex];
    if (!lancamento || !Array.isArray(lancamento.colunas)) return;
    const fromIndex = lancamento.colunas.findIndex(function(item){ return item.id === columnId; });
    if (fromIndex === -1) return;
    const toIndex = findReorderTargetIndex(lancamento, fromIndex, direction);
    if (!canMoveColumnTo(lancamento, fromIndex, toIndex)) return;
    const col = lancamento.colunas.splice(fromIndex, 1)[0];
    lancamento.colunas.splice(toIndex, 0, col);
    recalculateLaunch(lancamento);
    persistAndRefresh();
  }

  function openEditLaunchModal(){
    const launchIndex = getSelectedLaunchIndex();
    const lancamento = state.lancamentos[launchIndex];
    if (!lancamento) return;
    editLaunchIndex.value = String(launchIndex);
    editLaunchVerba.value = lancamento.verba || '';
    editLaunchDataInicial.value = lancamento.dataInicial || '';
    editLaunchDataFinal.value = lancamento.dataFinal || '';
    normalizeSummaryMapping(lancamento);
    const summaryOptions = getSummaryMappingEligibleColumns(lancamento);
    const valorCorrigidoSelected = lancamento.summaryMapping.valorCorrigidoColumnId;
    const jurosSelected = lancamento.summaryMapping.jurosColumnId;
    if (editLaunchSummaryValorCorrigido) {
      editLaunchSummaryValorCorrigido.innerHTML = summaryOptions.map(function(coluna){
        return '<option value="' + esc(coluna.id) + '"' + (coluna.id === valorCorrigidoSelected ? ' selected' : '') + '>' + esc(coluna.nome) + '</option>';
      }).join('');
    }
    if (editLaunchSummaryJuros) {
      editLaunchSummaryJuros.innerHTML = '<option value="">Sem juros no resumo</option>' + summaryOptions.map(function(coluna){
        return '<option value="' + esc(coluna.id) + '"' + (coluna.id === jurosSelected ? ' selected' : '') + '>' + esc(coluna.nome) + '</option>';
      }).join('');
    }
    editLaunchObservacao.value = lancamento.observacao || '';
    editLaunchModal.classList.add('open');
    editLaunchModal.setAttribute('aria-hidden', 'false');
    setTimeout(function(){ editLaunchVerba.focus(); }, 30);
  }

  function closeEditLaunchModal(){
    editLaunchModal.classList.remove('open');
    editLaunchModal.setAttribute('aria-hidden', 'true');
    editLaunchIndex.value = '';
    editLaunchVerba.value = '';
    editLaunchDataInicial.value = '';
    editLaunchDataFinal.value = '';
    if (editLaunchSummaryValorCorrigido) editLaunchSummaryValorCorrigido.innerHTML = '';
    if (editLaunchSummaryJuros) editLaunchSummaryJuros.innerHTML = '';
    editLaunchObservacao.value = '';
  }

  async function saveEditLaunchModal(){
    const launchIndex = Number(editLaunchIndex.value);
    const lancamento = state.lancamentos[launchIndex];
    if (!lancamento) return closeEditLaunchModal();
    const verba = editLaunchVerba.value.trim();
    const dataInicial = editLaunchDataInicial.value;
    const dataFinal = editLaunchDataFinal.value;
    const observacao = editLaunchObservacao.value.trim();
    if (!verba){ alert('Informe o nome da verba.'); editLaunchVerba.focus(); return; }
    if (!dataInicial){ alert('Informe a data inicial do cálculo.'); editLaunchDataInicial.focus(); return; }
    if (!dataFinal){ alert('Informe a data final do cálculo.'); editLaunchDataFinal.focus(); return; }
    if (dataInicial > dataFinal){ alert('A data inicial não pode ser maior que a data final.'); editLaunchDataFinal.focus(); return; }
    lancamento.verba = verba;
    lancamento.observacao = observacao;
    const mudouPeriodo = lancamento.dataInicial !== dataInicial || lancamento.dataFinal !== dataFinal;
    lancamento.dataInicial = dataInicial;
    lancamento.dataFinal = dataFinal;
    lancamento.summaryMapping = {
      valorCorrigidoColumnId: editLaunchSummaryValorCorrigido ? editLaunchSummaryValorCorrigido.value : '',
      jurosColumnId: editLaunchSummaryJuros ? editLaunchSummaryJuros.value : ''
    };
    if (mudouPeriodo){
      const rows = buildMonthlyRows(dataInicial, dataFinal);
      lancamento.linhas = rows.map(function(baseRow, idx){
        const existente = lancamento.linhas[idx] || {};
        const novaLinha = Object.assign({}, existente, { periodo: baseRow.periodo });
        if (novaLinha.valor === undefined) novaLinha.valor = '';
        lancamento.colunas.forEach(function(coluna){
          if (coluna.id !== 'valor' && novaLinha[coluna.id] === undefined) novaLinha[coluna.id] = '';
        });
        return novaLinha;
      });
    }
    normalizeSummaryMapping(lancamento);
    recalculateLaunch(lancamento);
    closeEditLaunchModal();
    persistAndRefresh();
    await updateIndicesForLaunch(launchIndex);
  }

  function removeSelectedLaunch(){
    const launchIndex = getSelectedLaunchIndex();
    if (launchIndex === -1) return;
    state.lancamentos.splice(launchIndex, 1);
    syncSelectedLaunch();
    persistAndRefresh();
  }

  function openColumnModal(launchIndex, tipo){
    modalLaunchIndex.value = String(launchIndex);
    modalColumnType.value = tipo;
    modalColumnName.value = '';
    modalColumnFormula.value = '';
    if (modalIndexStart) modalIndexStart.value = '';
    if (modalIndexEnd) modalIndexEnd.value = '';
    renderIndexSegmentList(modalIndexSegments, 'correcao', []);
    const isFormula = tipo === 'formula';
    const isIndex = tipo === 'indice';
    const isFlexibleManual = tipo === 'manual';
    columnModalTitle.textContent = isFormula ? 'Nova coluna com fórmula' : (isIndex ? 'Nova coluna de índice' : 'Nova coluna manual');
    columnModalSub.textContent = isFormula
      ? 'Crie uma coluna calculada com base nas letras das colunas já existentes.'
      : (isIndex ? 'Selecione o tipo de índice, a fonte e o limite opcional de aplicação.' : 'Crie uma coluna manual adicional. Se quiser, preencha a fórmula para gerar uma coluna calculada.');
    formulaFieldWrap.style.display = (isFormula || isFlexibleManual) ? 'block' : 'none';
    if (indexFieldWrap) indexFieldWrap.style.display = isIndex ? 'block' : 'none';
    if (modalColumnName) modalColumnName.style.display = isIndex ? 'none' : 'block';
    const nameLabel = document.querySelector('label[for="modalColumnName"]');
    if (nameLabel) nameLabel.style.display = isIndex ? 'none' : 'block';
    if (isIndex && modalIndexKind && modalIndexSource){
      modalIndexKind.value = 'correcao';
      const options = INDEX_SOURCE_OPTIONS.correcao || [];
      modalIndexSource.innerHTML = options.map(function(opt){ return '<option value="' + esc(opt.value) + '">' + esc(opt.label) + '</option>'; }).join('');
    }
    if (modalColumnSummaryRole) {
      modalColumnSummaryRole.value = 'none';
      modalColumnSummaryRole.disabled = isIndex;
    }
    columnModal.classList.add('open');
    columnModal.setAttribute('aria-hidden', 'false');
    setTimeout(function(){ (isIndex && modalIndexKind ? modalIndexKind : modalColumnName).focus(); }, 30);
  }

  function closeColumnModal(){
    columnModal.classList.remove('open');
    columnModal.setAttribute('aria-hidden', 'true');
    modalLaunchIndex.value = '';
    modalColumnType.value = '';
    modalColumnName.value = '';
    modalColumnFormula.value = '';
    if (modalColumnSummaryRole) {
      modalColumnSummaryRole.value = 'none';
      modalColumnSummaryRole.disabled = false;
    }
    if (indexFieldWrap) indexFieldWrap.style.display = 'none';
    if (modalColumnName) modalColumnName.style.display = 'block';
    const nameLabel = document.querySelector('label[for="modalColumnName"]');
    if (nameLabel) nameLabel.style.display = 'block';
    renderIndexSegmentList(modalIndexSegments, 'correcao', []);
  }

  function saveColumnFromModal(){
    const launchIndex = Number(modalLaunchIndex.value);
    const tipo = modalColumnType.value;
    const nome = modalColumnName.value.trim();
    const formula = modalColumnFormula.value.trim();
    if (!state.lancamentos[launchIndex]) return closeColumnModal();
    if (tipo !== 'indice' && !nome){ alert('Informe o nome da coluna.'); modalColumnName.focus(); return; }
    if (tipo === 'formula' && !formula){ alert('Informe a fórmula da coluna.'); modalColumnFormula.focus(); return; }
    const lancamento = state.lancamentos[launchIndex];
    const id = 'col_' + Date.now() + '_' + Math.random().toString(16).slice(2, 6);
    const selectedSummaryRole = modalColumnSummaryRole ? modalColumnSummaryRole.value : 'none';
    const summaryRole = (selectedSummaryRole === 'correcao' || selectedSummaryRole === 'juros') ? selectedSummaryRole : 'none';
    if (tipo === 'formula' || (tipo === 'manual' && formula)) {
      lancamento.colunas.push(normalizeColumnSummaryMeta({
        id: id,
        nome: nome,
        tipo: 'formula',
        formula: convertFormulaToStableTokens(formula, lancamento),
        summaryRole: summaryRole
      }));
      lancamento.linhas.forEach(function(linha){ linha[id] = ''; });
    } else if (tipo === 'indice') {
      const kind = modalIndexKind ? modalIndexKind.value : 'correcao';
      const source = modalIndexSource ? (modalIndexSource.value || defaultIndexSourceByKind(kind)) : defaultIndexSourceByKind(kind);
      const limitStart = modalIndexStart ? modalIndexStart.value : '';
      const limitEnd = modalIndexEnd ? modalIndexEnd.value : '';
      const composition = [normalizeIndexSegment({ source: source, start: limitStart, end: limitEnd }, kind)].concat(collectExtraIndexSegments(modalIndexSegments, kind));
      const validationError = validateIndexComposition(composition);
      if (validationError){ alert(validationError); return; }
      lancamento.colunas.push(normalizeColumnSummaryMeta(normalizeIndexColumn({
        id: id,
        nome: kind === 'juros' ? 'Juros (índice)' : 'Correção (índice)',
        tipo: 'indice',
        locked: false,
        indexKind: kind,
        indexComposition: composition
      })));
      lancamento.linhas.forEach(function(linha){ linha[id] = 1; });
    } else {
      lancamento.colunas.push(normalizeColumnSummaryMeta({
        id: id,
        nome: nome,
        tipo: 'manual',
        summaryRole: summaryRole
      }));
      lancamento.linhas.forEach(function(linha){ linha[id] = ''; });
    }
    recalculateLaunch(lancamento);
    closeColumnModal();
    persistAndRefresh();
    if (tipo === 'indice') updateIndicesForLaunch(launchIndex);
  }

  function renderLaunches(){
    state.lancamentos = normalizeLaunchListSafely(state.lancamentos);
    renderLaunchSelector();
    if (!state.lancamentos.length){
      launchesHost.innerHTML = '<div class="empty-state">Nenhum lançamento cadastrado ainda. Informe a verba e o período para gerar a tabela mensal do cálculo.</div>';
      return;
    }
    const index = getSelectedLaunchIndex();
    const lancamento = state.lancamentos[index];
    if (!lancamento){
      launchesHost.innerHTML = '<div class="empty-state">Selecione um lançamento para visualizar a respectiva tabela.</div>';
      return;
    }
    try {
      // Regra de apresentação da verba: alterar somente mapLaunchForView para refletir tela e relatório.
      const view = mapLaunchForView(lancamento, index);
      const headCols = ['<th class="col-data">Data</th>'].concat(view.columns.map(function(column, idx){
        const coluna = column.raw;
        const indiceMeta = coluna.tipo === 'indice'
          ? ('<span style="font-size:10px;color:#98a2b3">' + esc(summarizeIndexColumn(coluna).typeLabel + ' • ' + getIndexSourceLabel(coluna)) + '</span>')
          : '';
        const metaHtml = '<div class="th-col-meta"><span>' + esc(column.title) + '</span>' + (coluna.tipo === 'formula' ? '<span style="font-size:10px;color:#98a2b3">' + esc(column.formulaDisplay || '') + '</span>' : '') + indiceMeta + '</div>';
        let actions = '<div class="th-col-actions">';
        const leftTargetIndex = findReorderTargetIndex(lancamento, idx, 'left');
        const rightTargetIndex = findReorderTargetIndex(lancamento, idx, 'right');
        const canMoveLeft = canMoveColumnTo(lancamento, idx, leftTargetIndex);
        const canMoveRight = canMoveColumnTo(lancamento, idx, rightTargetIndex);
        actions += '<button type="button" class="th-icon-btn btnMoveColumn" data-direction="left" data-launch-index="' + index + '" data-column-id="' + esc(column.id) + '" title="Mover coluna para a esquerda (<)" aria-label="Mover coluna para a esquerda (<)"' + (canMoveLeft ? '' : ' disabled aria-disabled="true"') + '>&lt;</button>';
        actions += '<button type="button" class="th-icon-btn btnMoveColumn" data-direction="right" data-launch-index="' + index + '" data-column-id="' + esc(column.id) + '" title="Mover coluna para a direita (>)" aria-label="Mover coluna para a direita (>)"' + (canMoveRight ? '' : ' disabled aria-disabled="true"') + '>&gt;</button>';
        actions += '<button type="button" class="th-icon-btn btnEditColumn" data-launch-index="' + index + '" data-column-id="' + esc(column.id) + '" title="Editar coluna">✎</button>';
        if (coluna.id !== 'valor') {
          actions += '<button type="button" class="th-icon-btn danger btnDeleteColumn" data-launch-index="' + index + '" data-column-id="' + esc(column.id) + '" title="Remover coluna">×</button>';
        }
        actions += '</div>';
        return '<th><div class="th-col-head">' + metaHtml + actions + '</div></th>';
      })).join('');
      const rows = view.rows.map(function(row){
        const valueCells = row.cells.map(function(cell){
          if (cell.tipo === 'formula') return '<td><input type="text" readonly value="' + esc(cell.inputValue) + '" placeholder="Calculado automaticamente"></td>';
          if (cell.tipo === 'indice') return '<td><input type="text" readonly value="' + esc(cell.inputValue) + '" placeholder="1,0000000"></td>';
          return '<td><input type="text" inputmode="decimal" data-launch-index="' + index + '" data-row-index="' + cell.rowIndex + '" data-column-id="' + esc(cell.columnId) + '" class="valor-input" value="' + esc(cell.inputValue) + '" placeholder="0,00"></td>';
        }).join('');
        return '<tr><td>' + esc(row.periodo) + '</td>' + valueCells + '</tr>';
      }).join('');
      const badges = view.badges.map(function(label){
        return '<span class="mini-badge">' + esc(label) + '</span>';
      }).join('');
      const hasIndexColumn = (lancamento.colunas || []).some(function(coluna){ return coluna && coluna.tipo === 'indice'; });
      const indexSummaryRows = view.indexSummary.map(function(summary){
        return '' +
          '<div class="index-summary-row">' +
            '<strong>' + esc(summary.name) + '</strong>' +
            (summary.columnRef ? '<span class="index-summary-col-ref">Coluna: ' + esc(summary.columnRef) + '</span>' : '') +
            '<span>Fonte: ' + esc(summary.sourceLabel) + '</span>' +
            '<span>Série: ' + esc(summary.seriesLabel) + '</span>' +
            '<span>Unidade: ' + esc(summary.unitLabel) + '</span>' +
            '<span>Fórmula: ' + esc(summary.formulaLabel) + '</span>' +
            '<span>Intervalo: ' + esc(summary.intervalLabel) + ' / ' + esc(summary.limitLabel) + '</span>' +
            '<span>Fator final: ' + esc(summary.finalFactorLabel) + '</span>' +
            (summary.overlapLabel ? '<span style="color:#b54708">' + esc(summary.overlapLabel) + '</span>' : '') +
          '</div>';
      }).join('');
      const fallbackIndexSummaryRows = hasIndexColumn && !indexSummaryRows
        ? '<div class="index-summary-row"><strong>Índice</strong><span>Coluna: identificador indisponível</span><span>Fonte: não informada</span><span>Limitação: sem limite</span></div>'
        : '';
      const indexSummaryBlock = hasIndexColumn
        ? '<div class="index-summary" role="note" aria-label="Resumo dos índices aplicados">' + (indexSummaryRows || fallbackIndexSummaryRows) + '</div>'
        : '';
      launchesHost.innerHTML = buildLaunchEditorHtml(view, lancamento, index, headCols, rows, badges, indexSummaryBlock);
    } catch (error) {
      const launchContext = {
        launchIndex: index,
        lancamentoId: lancamento && lancamento.id,
        lancamentoVerba: lancamento && lancamento.verba
      };
      console.error('Falha ao renderizar lançamento em renderLaunches.', launchContext, error);
      const errorMessage = error && error.message ? error.message : String(error || '');
      const firstStackLine = error && error.stack ? String(error.stack).split('\n')[0] : '';
      const columnsJson = safeStringify(lancamento && lancamento.colunas);
      const rowLengthJson = safeStringify(lancamento && Array.isArray(lancamento.linhas) ? lancamento.linhas.length : null);
      launchesHost.innerHTML = '' +
        '<div class="empty-state">Não foi possível renderizar a tabela mensal deste lançamento. Revise os dados ou recrie a verba.</div>' +
        '<details class="empty-state" style="margin-top:8px">' +
          '<summary>Detalhes técnicos (diagnóstico temporário)</summary>' +
          '<div><strong>error.message:</strong> ' + esc(errorMessage) + '</div>' +
          '<div><strong>error.stack[0]:</strong> ' + esc(firstStackLine) + '</div>' +
          '<div><strong>lancamento.colunas:</strong> ' + esc(columnsJson) + '</div>' +
          '<div><strong>lancamento.linhas.length:</strong> ' + esc(rowLengthJson) + '</div>' +
        '</details>';
    }
  }

  function buildLaunchEditorHtml(view, lancamento, index, headCols, rows, badges, indexSummaryBlock){
    return '' +
      '<div class="launch-card">' +
        '<div class="launch-head">' +
          '<div>' +
            '<div class="launch-title">' + esc(view.title) + '</div>' +
            '<div class="launch-sub">' + esc(view.periodLabel) + ' — ' + view.competenciaCount + ' competência(s)</div>' +
            (view.observacao ? '<div class="launch-sub">Observação: ' + esc(view.observacao) + '</div>' : '') +
          '</div>' +
          '<div style="display:flex;gap:8px;align-items:flex-start;justify-content:flex-end;opacity:.85">' +
            '<button type="button" class="btn btn-ghost btnExportLaunchCsv" data-launch-index="' + index + '" style="padding:4px 8px;font-size:11px;line-height:1.2">CSV ↓</button>' +
            '<button type="button" class="btn btn-ghost btnImportLaunchCsv" data-launch-index="' + index + '" style="padding:4px 8px;font-size:11px;line-height:1.2">CSV ↑</button>' +
          '</div>' +
        '</div>' +
        '<div class="launch-actions">' +
          '<button type="button" class="btn btn-primary btnFetchIndices" data-launch-index="' + index + '"' + (indexLoadingState[index] ? ' disabled aria-busy="true"' : '') + '>' + (indexLoadingState[index] ? 'Buscando índices...' : 'Atualizar índices') + '</button>' +
          '<button type="button" class="btn btn-ghost btnAddColumn" data-launch-index="' + index + '">Adicional Coluna</button>' +
          '<button type="button" class="btn btn-ghost btnAddIndexCol" data-launch-index="' + index + '">Adicionar coluna de índice</button>' +
        '</div>' +
        '<div>' + badges + '</div>' +
        indexSummaryBlock +
        '<div class="table-wrap"><table class="editor-table"><thead><tr>' + headCols + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '</div>';
  }

  function getColumnById(lancamento, colunaId){
    return (lancamento.colunas || []).find(function(item){ return item.id === colunaId; }) || null;
  }

  const indexLoadingState = {};

  function setIndexLoading(launchIndex, isLoading){
    if (isLoading) indexLoadingState[launchIndex] = true;
    else delete indexLoadingState[launchIndex];
    document.querySelectorAll('.btnFetchIndices[data-launch-index="' + launchIndex + '"]').forEach(function(button){
      button.disabled = !!isLoading;
      button.setAttribute('aria-busy', isLoading ? 'true' : 'false');
      button.textContent = isLoading ? 'Buscando índices...' : 'Atualizar índices';
    });
  }

  async function updateIndicesForLaunch(launchIndex){
    const lancamento = state.lancamentos[launchIndex];
    if (!lancamento) return;
    if (indexLoadingState[launchIndex]) return;
    setIndexLoading(launchIndex, true);
    normalizeLaunch(lancamento);
    const config = Object.assign(defaultIndexConfig(), lancamento.indexConfig || {});
    const dataAtualizacao = fields.dataAtualizacao.value || new Date().toISOString().slice(0,10);
    const mesAtualizacao = monthKeyFromISO(dataAtualizacao);
    if (!mesAtualizacao){
      alert('Informe a data de atualização do cálculo.');
      return;
    }
    let indicesAtualizados = false;
    const payloadByColumnId = {};
    try {
      const indexColumns = getIndexColumns(lancamento);
      for (let idx = 0; idx < indexColumns.length; idx += 1){
        const coluna = indexColumns[idx];
        const limit = getIndexLimit(coluna);
        const fetchStart = coluna.indexKind === 'juros' && limit.start
          ? minISODate(lancamento.dataInicial, limit.start)
          : lancamento.dataInicial;
        const payload = await loadAutoIndices(coluna.indexSource || defaultIndexSourceByKind(coluna.indexKind), fetchStart, dataAtualizacao);
        payloadByColumnId[coluna.id] = payload;
        coluna.__lastFactor = 1;
        coluna.__lastNoOverlap = false;
      }
      lancamento.linhas.forEach(function(linha){
        const mesCompetencia = monthKeyFromPeriodo(linha.periodo);
        const inicioCompetenciaISO = mesCompetencia + '-01';
        indexColumns.forEach(function(coluna){
          const payload = payloadByColumnId[coluna.id] || makeIndexPayload('monthly', []);
          const monthMap = new Map((payload.monthlyRates || []).map(function(item){ return [item.month, item.value]; }));
          const limit = getIndexLimit(coluna);
          const mode = coluna.accumulationMode || sourceAccumulationMode(coluna.indexSource);
          const requestedStartISO = requestedStartISOForColumn(coluna, inicioCompetenciaISO);
          const requestedEndISO = String(dataAtualizacao);
          const effectivePeriod = clampPeriodByLimit(requestedStartISO, requestedEndISO, limit);
          coluna.__lastNoOverlap = !effectivePeriod;
          if (payload.calculationPath === 'daily_compound_exact' && payload.dailySeriesCode && effectivePeriod){
            const factorDaily = dailyCompoundExactFactor(payload.dailyRates, payload.dailySeriesCode, effectivePeriod.startISO, effectivePeriod.endISO);
            linha[coluna.id] = Number(factorDaily.toFixed(7));
            coluna.__lastFactor = linha[coluna.id];
            return;
          }
          const factorMonthly = accumulateIndexFactor(monthMap, mesCompetencia, mesAtualizacao, limit, mode, requestedStartISO, dataAtualizacao);
          linha[coluna.id] = Number(factorMonthly.toFixed(7));
          coluna.__lastFactor = linha[coluna.id];
        });
      });
      config.lastAutoRefresh = new Date().toISOString();
      lancamento.indexConfig = config;
      recalculateLaunch(lancamento);
      indicesAtualizados = true;
    } catch (error) {
      console.error('Falha ao buscar índices automáticos (módulo cível).', {
        launchIndex: launchIndex,
        lancamentoId: lancamento && lancamento.id,
        error: error,
        stack: error && error.stack
      });
      alert('Falha ao buscar índices automáticos. Detalhe: ' + (error && error.message ? error.message : 'erro inesperado.'));
      return;
    } finally {
      setIndexLoading(launchIndex, false);
    }
    if (indicesAtualizados){
      persistAndRefresh({
        reportErrorMessage: 'Índices atualizados, mas houve erro ao renderizar o relatório.',
        reportErrorContext: {
          launchIndex: launchIndex,
          lancamentoId: lancamento && lancamento.id
        }
      });
    }
  }

  function displayColumnValue(coluna, valor, options){
    const opts = options || {};
    if (coluna && coluna.formato === 'percentual') {
      if (opts.forInput) return formatNumberBR(valor || 0, 6, 6, true);
      return valor === '' || valor == null ? '—' : formatPercent(valor || 0);
    }
    if (coluna && coluna.formato === 'indice') {
      if (opts.forInput) return formatIndexFactor(valor || 1);
      return valor === '' || valor == null ? '—' : formatIndexFactor(valor || 1);
    }
    if (typeof valor === 'number') return formatCurrencyBR(valor || 0);
    if (valor !== '' && valor != null && !Number.isNaN(parseBRNumber(valor))) return formatCurrencyBR(valor || 0);
    return opts.fallbackDash && (valor === '' || valor == null) ? '—' : String(valor || '');
  }

  function mapLaunchForView(lancamento, launchIndex){
    normalizeLaunch(lancamento);
    recalculateLaunch(lancamento);
    const columns = (lancamento.colunas || []).map(function(coluna, idx){
      return {
        id: coluna.id,
        tipo: coluna.tipo,
        formato: coluna.formato,
        formula: coluna.formula || '',
        formulaDisplay: formatFormulaForDisplay(coluna.formula, lancamento),
        title: columnTitle(coluna, idx),
        raw: coluna
      };
    });
    const rows = (lancamento.linhas || []).map(function(linha, rowIndex){
      return {
        periodo: String(linha.periodo || ''),
        cells: columns.map(function(coluna){
          const key = coluna.id === 'valor' ? 'valor' : coluna.id;
          const rawValue = key === 'valor' ? linha.valor : linha[key];
          return {
            columnId: key,
            rowIndex: rowIndex,
            tipo: coluna.tipo,
            displayValue: displayColumnValue(coluna.raw, rawValue, { fallbackDash:true }),
            inputValue: formatInputValueByColumn(coluna.raw, rawValue),
            rawValue: rawValue
          };
        })
      };
    });
    return {
      launchIndex: launchIndex,
      launchId: String(lancamento.id || ''),
      title: String(lancamento.verba || 'Verba'),
      periodLabel: 'Período: ' + formatDateBR(lancamento.dataInicial) + ' até ' + formatDateBR(lancamento.dataFinal),
      observacao: String(lancamento.observacao || ''),
      competenciaCount: rows.length,
      columns: columns,
      rows: rows,
      badges: ['A = Data'].concat(columns.map(function(coluna){
        return coluna.title + (coluna.tipo === 'formula' ? ' [' + coluna.formulaDisplay + ']' : '');
      })),
      indexSummary: getIndexColumns(lancamento).map(function(coluna){
        const colIndex = (lancamento.colunas || []).findIndex(function(item){ return item && item.id === coluna.id; });
        const ref = colIndex >= 0 ? '(' + columnLetter(colIndex + 1) + ') ' + String(coluna.nome || 'Índice') : String(coluna.nome || 'Índice');
        return summarizeIndexColumn(coluna, ref);
      }),
      totalCells: columns.map(function(coluna){
        if (coluna.formato === 'percentual' || coluna.formato === 'indice') return '—';
        return formatCurrencyBR(totalLancamento(lancamento, coluna.id === 'valor' ? 'valor' : coluna.id));
      })
    };
  }

  function totalLancamento(lancamento, colunaId){
    const alvo = colunaId || 'valor';
    return lancamento.linhas.reduce(function(total, linha){
      return total + getNumericValue(linha, alvo);
    }, 0);
  }

  function buildLaunchSummary(lancamento){
    normalizeLaunch(lancamento);
    recalculateLaunch(lancamento);
    const roleTotals = getSummaryRoleTotals(lancamento);
    const valorCorrecao = roundMoney(roleTotals.correcao || 0);
    const juros = roundMoney(roleTotals.juros || 0);
    const valorCorrigido = roundMoney(valorCorrecao);
    const valorDevido = roundMoney(valorCorrigido + juros);
    return {
      id: String(lancamento.id || ''),
      verba: String(lancamento.verba || 'Verba'),
      valorCorrecao: valorCorrecao,
      valorCorrigido: valorCorrigido,
      juros: juros,
      valorDevido: valorDevido,
      hasCustomSummaryMapping: hasSummaryRoleConfigured(lancamento)
    };
  }

  function buildCalculationSummary(data){
    const source = data || {};
    const launchItems = (Array.isArray(source.lancamentos) ? source.lancamentos : state.lancamentos).map(buildLaunchSummary);
    const honorariosConfig = normalizeHonorarios(source.honorarios || state.honorarios);
    const validLaunchIds = new Set(launchItems.map(function(item){ return item.id; }));
    honorariosConfig.launchIds = honorariosConfig.launchIds.filter(function(id){ return validLaunchIds.has(String(id)); });
    const selectedSet = new Set(honorariosConfig.launchIds);
    const selectedLaunches = launchItems.filter(function(item){ return selectedSet.has(item.id); });
    const honorariosBase = roundMoney(selectedLaunches.reduce(function(total, item){ return total + item.valorDevido; }, 0));
    const honorariosValor = honorariosConfig.enabled ? roundMoney(honorariosBase * (honorariosConfig.percentual / 100)) : 0;
    const custasItems = (Array.isArray(source.custas) ? source.custas : state.custas).map(normalizeCusta);
    const rows = launchItems.map(function(item){
      return {
        kind: 'verba',
        id: item.id,
        verba: item.verba,
        note: item.hasCustomSummaryMapping
          ? 'Resumo com colunas configuradas no modal da coluna (Correção/Juros).'
          : '',
        valorCorrigido: item.valorCorrigido,
        juros: item.juros,
        valorDevido: item.valorDevido
      };
    });

    if (honorariosConfig.enabled) {
      const previewNames = selectedLaunches.slice(0, 3).map(function(item){ return item.verba; }).filter(Boolean);
      const extraCount = Math.max(selectedLaunches.length - previewNames.length, 0);
      rows.push({
        kind: 'honorarios',
        id: 'honorarios',
        verba: honorariosConfig.descricao + (honorariosConfig.percentual ? ' (' + formatNumberBR(honorariosConfig.percentual, 2, 4, true) + '%)' : ''),
        note: selectedLaunches.length
          ? ('Base composta por ' + String(selectedLaunches.length) + ' verba(s)' + (previewNames.length ? (': ' + previewNames.join('; ') + (extraCount ? ' e mais ' + String(extraCount) + '.' : '.')) : '.'))
          : 'Nenhuma verba selecionada para compor a base.',
        valorCorrigido: honorariosValor,
        juros: 0,
        valorDevido: honorariosValor
      });
    }

    custasItems.forEach(function(item, index){
      rows.push({
        kind: 'custas',
        id: item.id,
        verba: item.descricao || ('Custas ' + (index + 1)),
        note: 'Custas incluídas manualmente.',
        valorCorrigido: roundMoney(item.valor),
        juros: 0,
        valorDevido: roundMoney(item.valor)
      });
    });

    const totals = rows.reduce(function(acc, item){
      acc.valorCorrigido += roundMoney(item.valorCorrigido);
      acc.juros += roundMoney(item.juros);
      acc.valorDevido += roundMoney(item.valorDevido);
      return acc;
    }, { valorCorrigido:0, juros:0, valorDevido:0 });

    totals.valorCorrigido = roundMoney(totals.valorCorrigido);
    totals.juros = roundMoney(totals.juros);
    totals.valorDevido = roundMoney(totals.valorDevido);

    return {
      rows: rows,
      launchItems: launchItems,
      honorarios: {
        config: honorariosConfig,
        base: honorariosBase,
        valor: honorariosValor,
        selectedLaunches: selectedLaunches
      },
      custas: {
        items: custasItems,
        total: roundMoney(custasItems.reduce(function(total, item){ return total + roundMoney(item.valor); }, 0))
      },
      totals: totals
    };
  }

  function normalizeSearchText(value){
    let text = String(value || '');
    if (typeof text.normalize === 'function') text = text.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return text.toLowerCase().trim();
  }

  function renderSummaryTotals(summary){
    const summaryData = summary || buildCalculationSummary(collect());
    const summaryColumns = [
      { id:'valorCorrigido', nome:'Valor corrigido', className:'right' },
      { id:'juros', nome:'Juros', className:'right' },
      { id:'valorDevido', nome:'Valor devido', className:'right bold' }
    ];

    function getSummaryCellValue(row, columnId){
      if (columnId === 'valorCorrigido' && Number.isFinite(row.valorCorrigido)) return roundMoney(row.valorCorrigido);
      if (columnId === 'juros' && Number.isFinite(row.juros)) return roundMoney(row.juros);
      if (columnId === 'valorDevido' && Number.isFinite(row.valorDevido)) return roundMoney(row.valorDevido);
      return 0;
    }

    const summaryTotalsByColumn = summaryColumns.reduce(function(acc, coluna){
      acc[coluna.id] = roundMoney(summaryData.rows.reduce(function(total, row){ return total + getSummaryCellValue(row, coluna.id); }, 0));
      return acc;
    }, {});

    if (honorariosResumo) {
      if (!state.honorarios.enabled) {
        honorariosResumo.innerHTML = '<div class="summary-muted-copy">Honorários desativados.</div>';
      } else {
        honorariosResumo.innerHTML = '' +
          '<div class="summary-stats">' +
            '<div class="summary-stat"><span class="summary-stat-label">Verbas selecionadas</span><span class="summary-stat-value">' + String(summaryData.honorarios.selectedLaunches.length) + '</span></div>' +
            '<div class="summary-stat"><span class="summary-stat-label">Base</span><span class="summary-stat-value">' + esc(formatCurrencyBR(summaryData.honorarios.base)) + '</span></div>' +
            '<div class="summary-stat"><span class="summary-stat-label">Honorários</span><span class="summary-stat-value">' + esc(formatCurrencyBR(summaryData.honorarios.valor)) + '</span></div>' +
          '</div>' +
          '<div class="summary-inline-note">Descrição: <b>' + esc(summaryData.honorarios.config.descricao || 'Honorários') + '</b>' +
            (summaryData.honorarios.config.percentual ? ' &nbsp;•&nbsp; Percentual: <b>' + esc(formatNumberBR(summaryData.honorarios.config.percentual, 2, 4, true) + '%') + '</b>' : '') +
          '</div>';
      }
    }

    if (custasResumo) {
      custasResumo.innerHTML = '' +
        '<div class="summary-stats">' +
          '<div class="summary-stat"><span class="summary-stat-label">Itens lançados</span><span class="summary-stat-value">' + String(summaryData.custas.items.length) + '</span></div>' +
          '<div class="summary-stat"><span class="summary-stat-label">Total de custas</span><span class="summary-stat-value">' + esc(formatCurrencyBR(summaryData.custas.total)) + '</span></div>' +
        '</div>';
    }

    if (summaryTableHead) {
      summaryTableHead.innerHTML = '<tr><th>Verba</th>' + summaryColumns.map(function(coluna){
        return '<th class="' + esc(coluna.className) + '">' + esc(coluna.nome || coluna.id) + '</th>';
      }).join('') + '</tr>';
    }

    if (summaryTableBody) {
      summaryTableBody.innerHTML = summaryData.rows.length ? summaryData.rows.map(function(row){
        return '' +
          '<tr class="summary-row summary-row-' + esc(row.kind) + '">' +
            '<td>' + esc(row.verba || '—') + (row.note ? '<span class="summary-row-note">' + esc(row.note) + '</span>' : '') + '</td>' +
            summaryColumns.map(function(coluna){
              return '<td class="' + esc(coluna.className) + '">' + esc(formatCurrencyBR(getSummaryCellValue(row, coluna.id))) + '</td>';
            }).join('') +
          '</tr>';
      }).join('') : '<tr><td colspan="' + String(summaryColumns.length + 1) + '" class="center">Nenhum item resumido até o momento.</td></tr>';
    }

    if (summaryTableFoot) {
      summaryTableFoot.innerHTML = '' +
        '<tr>' +
          '<td>Total geral</td>' +
          summaryColumns.map(function(coluna){
            return '<td class="' + esc(coluna.className) + '">' + esc(formatCurrencyBR(summaryTotalsByColumn[coluna.id] || 0)) + '</td>';
          }).join('') +
        '</tr>';
    }

    return summaryData;
  }

  function renderHonorariosSelection(summary){
    const summaryData = summary || buildCalculationSummary(collect());
    const canSelect = !!(state.honorarios.enabled && state.lancamentos.length);
    const selectedLaunches = summaryData.honorarios.selectedLaunches || [];
    const selectedSet = new Set((state.honorarios.launchIds || []).map(String));
    const dueById = new Map(summaryData.launchItems.map(function(item){ return [String(item.id), item.valorDevido]; }));

    if (!canSelect) {
      honorariosSelectorOpen = false;
      honorariosSearchTerm = '';
    }

    if (btnToggleHonorariosSelector) {
      btnToggleHonorariosSelector.disabled = !canSelect;
      btnToggleHonorariosSelector.textContent = canSelect
        ? ((honorariosSelectorOpen ? 'Ocultar verbas' : 'Selecionar verbas') + ' (' + String(selectedLaunches.length) + ')')
        : 'Selecionar verbas';
    }

    if (honorariosSearch) {
      if (honorariosSearch.value !== honorariosSearchTerm) honorariosSearch.value = honorariosSearchTerm;
      honorariosSearch.disabled = !canSelect;
    }

    if (honorariosSelectorPanel) {
      honorariosSelectorPanel.classList.toggle('is-collapsed', !honorariosSelectorOpen || !canSelect);
    }

    if (honorariosSelectedHost) {
      if (!state.lancamentos.length) {
        honorariosSelectedHost.innerHTML = '<div class="summary-empty">Cadastre ao menos uma verba para selecionar a base dos honorários.</div>';
      } else if (!state.honorarios.enabled) {
        honorariosSelectedHost.innerHTML = '<div class="summary-empty">Ative os honorários para definir as verbas que compõem a base de cálculo.</div>';
      } else if (!selectedLaunches.length) {
        honorariosSelectedHost.innerHTML = '<div class="summary-empty">Nenhuma verba selecionada para compor a base.</div>';
      } else {
        const maxVisible = 6;
        const chips = selectedLaunches.slice(0, maxVisible).map(function(item){
          return '<span class="summary-chip"><span>' + esc(item.verba || 'Verba') + '</span><strong>' + esc(formatCurrencyBR(item.valorDevido || 0)) + '</strong></span>';
        }).join('');
        const extra = selectedLaunches.length > maxVisible
          ? '<span class="summary-chip-more">+' + String(selectedLaunches.length - maxVisible) + ' verba(s)</span>'
          : '';
        honorariosSelectedHost.innerHTML = chips + extra;
      }
    }

    if (honorariosLaunchesHost) {
      if (!state.lancamentos.length) {
        honorariosLaunchesHost.innerHTML = '<div class="summary-empty">Cadastre ao menos uma verba para selecionar a base dos honorários.</div>';
      } else if (!state.honorarios.enabled) {
        honorariosLaunchesHost.innerHTML = '<div class="summary-empty">Ative os honorários para liberar a seleção das verbas.</div>';
      } else {
        const searchTerm = normalizeSearchText(honorariosSearchTerm);
        const filteredLaunches = searchTerm
          ? state.lancamentos.filter(function(lancamento){ return normalizeSearchText(lancamento.verba || 'Verba').includes(searchTerm); })
          : state.lancamentos.slice();

        if (!filteredLaunches.length) {
          honorariosLaunchesHost.innerHTML = '<div class="summary-empty">Nenhuma verba encontrada para o filtro informado.</div>';
        } else {
          honorariosLaunchesHost.innerHTML = filteredLaunches.map(function(lancamento){
            return '' +
              '<label class="summary-checkitem">' +
                '<input type="checkbox" class="honorarios-launch-check" data-launch-id="' + esc(lancamento.id) + '"' + (selectedSet.has(String(lancamento.id)) ? ' checked' : '') + '>' +
                '<span>' +
                  '<span class="summary-checklabel">' + esc(lancamento.verba || 'Verba') + '</span>' +
                  '<span class="summary-checksub">Valor devido atual: ' + esc(formatCurrencyBR(dueById.get(String(lancamento.id)) || 0)) + '</span>' +
                '</span>' +
              '</label>';
          }).join('');
        }
      }
    }

    if (btnHonorariosSelectAll) btnHonorariosSelectAll.disabled = !canSelect;
    if (btnHonorariosClear) btnHonorariosClear.disabled = !canSelect;

    return summaryData;
  }

  function renderCustasEditor(){
    if (!custasHost) return;
    if (!state.custas.length) {
      custasHost.innerHTML = '<div class="summary-empty">Nenhuma custa cadastrada.</div>';
      return;
    }

    custasHost.innerHTML = state.custas.map(function(item, index){
      return '' +
        '<div class="custa-card" data-custa-id="' + esc(item.id) + '">' +
          '<div class="custa-card-head">' +
            '<div class="custa-card-title">Custa ' + String(index + 1) + '</div>' +
            '<button type="button" class="btn btn-ghost summary-remove-btn btnRemoveCusta" data-custa-id="' + esc(item.id) + '">Remover</button>' +
          '</div>' +
          '<div class="custa-grid">' +
            '<div><label>Descrição</label><input type="text" class="custa-desc" data-custa-id="' + esc(item.id) + '" value="' + esc(item.descricao || '') + '" placeholder="Ex.: Custas iniciais"></div>' +
            '<div><label>Valor</label><input type="text" class="custa-valor" data-custa-id="' + esc(item.id) + '" inputmode="decimal" value="' + esc(item.valor ? formatCurrencyBR(item.valor) : '') + '" placeholder="0,00"></div>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  function renderSummaryPanel(){
    sanitizeSummaryState();
    const summary = buildCalculationSummary(collect());

    if (honorariosEnabled) honorariosEnabled.checked = !!state.honorarios.enabled;
    if (honorariosDescricao) honorariosDescricao.value = state.honorarios.descricao || 'Honorários';
    if (honorariosPercentual) honorariosPercentual.value = state.honorarios.percentual ? formatNumberBR(state.honorarios.percentual, 2, 4, true) : '';

    renderHonorariosSelection(summary);
    renderCustasEditor();
    renderSummaryTotals(summary);
  }

  function buildReport(data){
    const summary = buildCalculationSummary(data);
    const branding = {
      header: { nome:'Leonardo G. Cristiano', tel:'(14) 99606-7654', email:'suporte@calculopro.com.br' },
      footer: { l1:'R. Mário Gonzaga Junqueira, 25-80', l2:'Jardim Viaduto, Bauru - SP, 17055-210', site:'www.calculopro.com.br', emp:'CalculoPro Ltda. 51.540.075/0001-04' }
    };

    const layout = CPPrintLayout.createLayout({
      root: reportRoot,
      title: 'RELATÓRIO INICIAL — CÁLCULOS CÍVEIS',
      meta: 'Estrutura inicial do módulo cível no sistema CalculoPro',
      branding: branding,
      contextName: 'calculos-civeis-print',
      documentTitle: 'Relatório - Cálculos Cíveis'
    });

    CPPrintLayout.appendSection(layout, {
      title: 'Identificação do cálculo',
      html: '<table class="report-table"><tbody>' +
        '<tr><td class="bold" style="width:34%">Requerente</td><td>' + esc(data.requerente || '—') + '</td></tr>' +
        '<tr><td class="bold">Requerido</td><td>' + esc(data.requerido || '—') + '</td></tr>' +
        '<tr><td class="bold">Número do processo</td><td>' + esc(data.processo || '—') + '</td></tr>' +
        '<tr><td class="bold">Data do ajuizamento</td><td>' + esc(formatDateBR(data.ajuizamento)) + '</td></tr>' +
        '<tr><td class="bold">Observações iniciais</td><td>' + esc(data.observacoes || 'Sem observações iniciais registradas.') + '</td></tr>' +
      '</tbody></table>'
    });

    CPPrintLayout.appendSection(layout, {
      title: 'Controle do módulo',
      html: '<table class="report-table"><tbody>' +
        '<tr><td class="bold" style="width:34%">Ferramenta</td><td>Cálculos Cíveis</td></tr>' +
        '<tr><td class="bold">Finalidade</td><td>Lançamentos mensais por verba, quadro de resumo, honorários e custas.</td></tr>' +
        '<tr><td class="bold">Quantidade de verbas</td><td>' + String(data.lancamentos.length) + '</td></tr>' +
        '<tr><td class="bold">Honorários</td><td>' + (summary.honorarios.config.enabled ? ('Ativados em ' + formatNumberBR(summary.honorarios.config.percentual, 2, 4, true) + '% sobre ' + String(summary.honorarios.selectedLaunches.length) + ' verba(s).') : 'Não incluídos.') + '</td></tr>' +
        '<tr><td class="bold">Custas lançadas</td><td>' + String(summary.custas.items.length) + ' item(ns) — total de ' + esc(formatCurrencyBR(summary.custas.total)) + '</td></tr>' +
        '<tr><td class="bold">Data-base de atualização</td><td>' + esc(formatDateBR(data.dataAtualizacao)) + '</td></tr>' +
        '<tr><td class="bold">Última atualização do relatório</td><td>' + esc(data.atualizadoEm || '—') + '</td></tr>' +
      '</tbody></table>'
    });

    const summaryRows = (summary.rows.length ? summary.rows : [{ verba:'Nenhum item resumido até o momento.', note:'', valorCorrigido:0, juros:0, valorDevido:0 }]).map(function(row){
      return '<tr>' +
        '<td>' + esc(row.verba || '—') + (row.note ? '<span class="summary-row-note">' + esc(row.note) + '</span>' : '') + '</td>' +
        '<td class="right">' + esc(formatCurrencyBR(row.valorCorrigido || 0)) + '</td>' +
        '<td class="right">' + esc(formatCurrencyBR(row.juros || 0)) + '</td>' +
        '<td class="bold right">' + esc(formatCurrencyBR(row.valorDevido || 0)) + '</td>' +
      '</tr>';
    });
    const summaryFooter = '<tr><td class="bold right">Total geral</td><td class="bold right">' + esc(formatCurrencyBR(summary.totals.valorCorrigido || 0)) + '</td><td class="bold right">' + esc(formatCurrencyBR(summary.totals.juros || 0)) + '</td><td class="bold right">' + esc(formatCurrencyBR(summary.totals.valorDevido || 0)) + '</td></tr>';
    CPPrintLayout.appendTable(layout, {
      title: 'Resumo do cálculo',
      columns: ['Verba', 'Valor corrigido', 'Juros', 'Valor devido'],
      rows: summaryRows,
      tfootHtml: summaryFooter,
      tableClass: 'report-table report-summary-table',
      continuationLabel: 'Resumo do cálculo (continuação)'
    });

    CPPrintLayout.appendSection(layout, { title:'Lançamentos por verba', html:'' });
    if (!data.lancamentos.length) {
      CPPrintLayout.appendSection(layout, { html:'<table class="report-table report-launch-table"><tbody><tr><td>Nenhuma verba lançada até o momento.</td></tr></tbody></table>' });
    } else {
      data.lancamentos.forEach(function(lancamento){
        const view = mapLaunchForView(lancamento, -1);
        const indexSummaryRows = view.indexSummary.map(function(summary){
          return '' +
            '<div class="report-index-summary-row">' +
              '<b>' + esc(summary.name) + '</b>' +
              (summary.columnRef ? '  Coluna: ' + esc(summary.columnRef) + '  ' : '  ') +
              'Fonte: ' + esc(summary.sourceLabel) + ' • Série: ' + esc(summary.seriesLabel) + ' • Unidade: ' + esc(summary.unitLabel) + ' • Fórmula: ' + esc(summary.formulaLabel) + ' • Intervalo: ' + esc(summary.intervalLabel) + ' / ' + esc(summary.limitLabel) + ' • Fator final: ' + esc(summary.finalFactorLabel) +
              '</div>';
        }).join('');
        const headers = ['Data'].concat(view.columns.map(function(coluna){ return coluna.title; }));
        const rows = view.rows.map(function(row){
          const cols = row.cells.map(function(cell){
            return '<td class="right">' + esc(cell.displayValue || '—') + '</td>';
          }).join('');
          return '<tr><td class="center">' + esc(row.periodo) + '</td>' + cols + '</tr>';
        });
        const totalCells = view.totalCells.map(function(totalValue){
          return '<td class="bold right">' + esc(totalValue) + '</td>';
        }).join('');
        CPPrintLayout.appendSection(layout, {
          html: '<div class="sec-title">' + esc(view.title) + '</div>' +
            '<div class="report-launch-head">' +
              '<div class="summary-row-note">' +
                esc(view.periodLabel) +
                (view.observacao ? '<br>Observação: ' + esc(view.observacao) : '') +
              '</div>' +
              (indexSummaryRows ? '<div class="report-index-summary" role="note" aria-label="Resumo de índices da verba"><div class="report-index-summary-title">Índices aplicados nesta verba</div>' + indexSummaryRows + '</div>' : '') +
            '</div>'
        });
        CPPrintLayout.appendTable(layout, {
          columns: headers,
          rows: rows,
          tfootHtml: '<tr><td class="bold right">Total da verba</td>' + totalCells + '</tr>',
          tableClass: 'report-table report-launch-table',
          continuationLabel: esc(view.title) + ' (continuação)'
        });
      });
    }

    CPPrintLayout.applyReportBranding(reportRoot, branding);
  }


  let reportRenderQueued = false;
  let reportRenderCallbacks = [];

  function renderReportDeferred(callback){
    if (typeof callback === 'function') reportRenderCallbacks.push(callback);
    if (reportRenderQueued) return;
    reportRenderQueued = true;
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        safeBuildReport(collect());
        reportRenderQueued = false;
        var callbacks = reportRenderCallbacks.slice();
        reportRenderCallbacks = [];
        callbacks.forEach(function(fn){
          try { fn(); } catch (e) {}
        });
      });
    });
  }

  function openReportTabAndRender(callback){
    switchTab('report');
    renderReportDeferred(callback);
  }


  function refreshSummaryOutputsOnly(){
    sanitizeSummaryState();
    const data = collect();
    save(data);
    renderSummaryTotals(buildCalculationSummary(data));
    safeBuildReport(data);
  }

  function safeBuildReport(data, options){
    const opts = options || {};
    try {
      buildReport(data);
      return true;
    } catch (error) {
      const context = Object.assign({
        source: opts.source || 'report-render'
      }, opts.context || {});
      console.error('Falha ao renderizar relatório (módulo cível).', {
        context: context,
        error: error,
        stack: error && error.stack
      });
      if (opts.alertMessage) {
        alert(opts.alertMessage + ' Detalhe: ' + (error && error.message ? error.message : 'erro inesperado.'));
      }
      return false;
    }
  }

  function persistAndRefresh(options){
    sanitizeSummaryState();
    const data = collect();
    save(data);
    renderLaunches();
    renderSummaryPanel();
    restorePendingGridFocus();
    const opts = options || {};
    safeBuildReport(data, {
      source: 'persistAndRefresh',
      context: opts.reportErrorContext || {},
      alertMessage: opts.reportErrorMessage || ''
    });
  }

  function clearLaunchForm(){
    fields.novaVerba.value = '';
    fields.periodoInicial.value = '';
    fields.periodoFinal.value = '';
    fields.novaVerbaObservacao.value = '';
  }

  $('btnCriarLancamento').addEventListener('click', async function(){
    const verba = fields.novaVerba.value.trim();
    const dataInicial = fields.periodoInicial.value;
    const dataFinal = fields.periodoFinal.value;
    const observacao = fields.novaVerbaObservacao.value.trim();
    if (!verba){ alert('Informe o nome da verba.'); fields.novaVerba.focus(); return; }
    if (!dataInicial){ alert('Informe a data inicial do cálculo.'); fields.periodoInicial.focus(); return; }
    if (!dataFinal){ alert('Informe a data final do cálculo.'); fields.periodoFinal.focus(); return; }
    if (dataInicial > dataFinal){ alert('A data inicial não pode ser maior que a data final.'); fields.periodoFinal.focus(); return; }
    state.lancamentos.push({
      id: 'lanc_' + Date.now() + '_' + Math.random().toString(16).slice(2),
      verba: verba,
      observacao: observacao,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
      colunas: buildDefaultColumns(),
      indexConfig: defaultIndexConfig(),
      linhas: buildMonthlyRows(dataInicial, dataFinal)
    });
    state.lancamentoSelecionadoId = state.lancamentos[state.lancamentos.length - 1].id;
    clearLaunchForm();
    persistAndRefresh();
    await updateIndicesForLaunch(state.lancamentos.length - 1);
  });

  let pendingGridFocus = null;

  function getEditableInputsForLaunch(launchIndex){
    return Array.from(launchesHost.querySelectorAll('.valor-input[data-launch-index="' + launchIndex + '"]'));
  }

  function moveGridFocusFrom(target, direction){
    const launchIndex = Number(target.getAttribute('data-launch-index'));
    const rowIndex = Number(target.getAttribute('data-row-index'));
    const inputs = getEditableInputsForLaunch(launchIndex);
    if (!inputs.length) return false;
    const rowMap = new Map();
    inputs.forEach(function(input){
      const r = Number(input.getAttribute('data-row-index'));
      const c = input.getAttribute('data-column-id') || 'valor';
      if (!rowMap.has(r)) rowMap.set(r, []);
      rowMap.get(r).push(c);
    });
    const rowKeys = Array.from(rowMap.keys()).sort(function(a, b){ return a - b; });
    const columns = rowMap.get(rowIndex) || [];
    const colIndex = columns.indexOf(target.getAttribute('data-column-id') || 'valor');
    let nextRow = rowIndex;
    let nextColIndex = colIndex;

    if (direction === 'right') {
      if (colIndex < columns.length - 1) nextColIndex = colIndex + 1;
      else {
        const rowPos = rowKeys.indexOf(rowIndex);
        if (rowPos >= 0 && rowPos < rowKeys.length - 1) {
          nextRow = rowKeys[rowPos + 1];
          nextColIndex = 0;
        } else return false;
      }
    } else if (direction === 'left') {
      if (colIndex > 0) nextColIndex = colIndex - 1;
      else {
        const rowPos = rowKeys.indexOf(rowIndex);
        if (rowPos > 0) {
          nextRow = rowKeys[rowPos - 1];
          nextColIndex = (rowMap.get(nextRow) || []).length - 1;
        } else return false;
      }
    } else if (direction === 'down') {
      const rowPos = rowKeys.indexOf(rowIndex);
      if (rowPos >= 0 && rowPos < rowKeys.length - 1) nextRow = rowKeys[rowPos + 1];
      else return false;
    } else if (direction === 'up') {
      const rowPos = rowKeys.indexOf(rowIndex);
      if (rowPos > 0) nextRow = rowKeys[rowPos - 1];
      else return false;
    }

    const nextColumns = rowMap.get(nextRow) || [];
    if (!nextColumns.length) return false;
    if (nextColIndex >= nextColumns.length) nextColIndex = nextColumns.length - 1;
    const nextColumnId = nextColumns[nextColIndex];
    pendingGridFocus = { launchIndex: launchIndex, rowIndex: nextRow, columnId: nextColumnId };
    target.blur();
    return true;
  }

  function restorePendingGridFocus(){
    if (!pendingGridFocus) return;
    const selector = '.valor-input[data-launch-index="' + pendingGridFocus.launchIndex + '"][data-row-index="' + pendingGridFocus.rowIndex + '"][data-column-id="' + pendingGridFocus.columnId + '"]';
    const next = launchesHost.querySelector(selector);
    pendingGridFocus = null;
    if (!next) return;
    requestAnimationFrame(function(){
      next.focus();
      next.select();
    });
  }

  launchesHost.addEventListener('input', function(event){
    const target = event.target;
    if (!target.classList.contains('valor-input')) return;
    const launchIndex = Number(target.getAttribute('data-launch-index'));
    const rowIndex = Number(target.getAttribute('data-row-index'));
    const columnId = target.getAttribute('data-column-id') || 'valor';
    if (!state.lancamentos[launchIndex] || !state.lancamentos[launchIndex].linhas[rowIndex]) return;
    const coluna = getColumnById(state.lancamentos[launchIndex], columnId);
    if (coluna && (coluna.tipo === 'formula' || coluna.tipo === 'indice')) return;
    const parsedValue = parseBRNumber(target.value);
    if (columnId === 'valor') state.lancamentos[launchIndex].linhas[rowIndex].valor = parsedValue;
    else state.lancamentos[launchIndex].linhas[rowIndex][columnId] = parsedValue;
  });

  launchesHost.addEventListener('focusout', function(event){
    const target = event.target;
    if (!target.classList.contains('valor-input')) return;
    const launchIndex = Number(target.getAttribute('data-launch-index'));
    if (!state.lancamentos[launchIndex]) return;
    target.value = formatCurrencyBR(target.value);
    recalculateLaunch(state.lancamentos[launchIndex]);
    persistAndRefresh();
  });

  launchesHost.addEventListener('keydown', function(event){
    const target = event.target;
    if (!target.classList.contains('valor-input')) return;
    if (event.key === 'Enter' || event.key === 'ArrowDown') {
      event.preventDefault();
      moveGridFocusFrom(target, 'down');
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveGridFocusFrom(target, 'up');
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      moveGridFocusFrom(target, event.shiftKey ? 'left' : 'right');
      return;
    }
    if (event.key === 'ArrowRight') {
      if (target.selectionStart === target.value.length && target.selectionEnd === target.value.length) {
        event.preventDefault();
        moveGridFocusFrom(target, 'right');
      }
      return;
    }
    if (event.key === 'ArrowLeft') {
      if (target.selectionStart === 0 && target.selectionEnd === 0) {
        event.preventDefault();
        moveGridFocusFrom(target, 'left');
      }
    }
  });

  launchesHost.addEventListener('focusin', function(event){
    const target = event.target;
    if (!target.classList.contains('valor-input')) return;
    target.value = formatEditableNumberBR(target.value);
    target.select();
  });

  launchesHost.addEventListener('paste', function(event){
    const target = event.target;
    if (!target.classList.contains('valor-input')) return;
    event.preventDefault();
    const pastedText = event.clipboardData ? event.clipboardData.getData('text') : '';
    const parsedValue = parseBRNumber(pastedText);
    target.value = formatEditableNumberBR(parsedValue);
    const launchIndex = Number(target.getAttribute('data-launch-index'));
    const rowIndex = Number(target.getAttribute('data-row-index'));
    const columnId = target.getAttribute('data-column-id') || 'valor';
    if (!state.lancamentos[launchIndex] || !state.lancamentos[launchIndex].linhas[rowIndex]) return;
    if (columnId === 'valor') state.lancamentos[launchIndex].linhas[rowIndex].valor = parsedValue;
    else state.lancamentos[launchIndex].linhas[rowIndex][columnId] = parsedValue;
    refreshSummaryOutputsOnly();
  });

  launchesHost.addEventListener('click', function(event){
    const target = event.target;
    const launchIndex = Number(target.getAttribute('data-launch-index'));
    if (!state.lancamentos[launchIndex]) return;
    if (target.classList.contains('btnAddColumn')){
      openColumnModal(launchIndex, 'manual');
      return;
    }
    if (target.classList.contains('btnAddIndexCol')){
      openColumnModal(launchIndex, 'indice');
      return;
    }
    if (target.classList.contains('btnFetchIndices')){
      updateIndicesForLaunch(launchIndex);
      return;
    }
    if (target.classList.contains('btnExportLaunchCsv')){
      exportLaunchesToCsv(launchIndex);
      return;
    }
    if (target.classList.contains('btnImportLaunchCsv')){
      triggerLaunchCsvImport(launchIndex);
      return;
    }
    if (target.classList.contains('btnEditColumn')){
      openEditColumnModal(launchIndex, target.getAttribute('data-column-id') || '');
      return;
    }
    if (target.classList.contains('btnMoveColumn')){
      moveColumn(launchIndex, target.getAttribute('data-column-id') || '', target.getAttribute('data-direction') === 'left' ? 'left' : 'right');
      return;
    }
    if (target.classList.contains('btnDeleteColumn')){
      removeColumn(launchIndex, target.getAttribute('data-column-id') || '');
    }
  });

  function getCustaIndexById(custaId){
    return (state.custas || []).findIndex(function(item){ return String(item.id) === String(custaId); });
  }

  if (honorariosEnabled) {
    honorariosEnabled.addEventListener('change', function(){
      state.honorarios = normalizeHonorarios(Object.assign({}, state.honorarios, { enabled: this.checked }));
      if (state.honorarios.enabled) ensureHonorariosDefaultSelection();
      persistAndRefresh();
    });
  }

  if (honorariosDescricao) {
    honorariosDescricao.addEventListener('input', function(){
      state.honorarios = normalizeHonorarios(Object.assign({}, state.honorarios, { descricao: this.value }));
      refreshSummaryOutputsOnly();
    });
    honorariosDescricao.addEventListener('focusout', function(){
      state.honorarios = normalizeHonorarios(Object.assign({}, state.honorarios, { descricao: this.value }));
      persistAndRefresh();
    });
  }

  if (honorariosPercentual) {
    honorariosPercentual.addEventListener('input', function(){
      state.honorarios = normalizeHonorarios(Object.assign({}, state.honorarios, { percentual: this.value }));
      refreshSummaryOutputsOnly();
    });
    honorariosPercentual.addEventListener('focusin', function(){
      this.value = formatEditableNumberBR(this.value);
      this.select();
    });
    honorariosPercentual.addEventListener('paste', function(event){
      event.preventDefault();
      const pastedText = event.clipboardData ? event.clipboardData.getData('text') : '';
      const parsedValue = parseBRNumber(pastedText);
      this.value = formatEditableNumberBR(parsedValue);
      state.honorarios = normalizeHonorarios(Object.assign({}, state.honorarios, { percentual: parsedValue }));
      refreshSummaryOutputsOnly();
    });
    honorariosPercentual.addEventListener('focusout', function(){
      this.value = formatCurrencyBR(this.value);
      state.honorarios = normalizeHonorarios(Object.assign({}, state.honorarios, { percentual: parseBRNumber(this.value) }));
      persistAndRefresh();
    });
  }

  if (btnToggleHonorariosSelector) btnToggleHonorariosSelector.addEventListener('click', function(){
    if (this.disabled) return;
    honorariosSelectorOpen = !honorariosSelectorOpen;
    renderSummaryPanel();
  });

  if (honorariosSearch) honorariosSearch.addEventListener('input', function(){
    honorariosSearchTerm = this.value || '';
    renderHonorariosSelection(buildCalculationSummary(collect()));
  });

  if (btnHonorariosSelectAll) btnHonorariosSelectAll.addEventListener('click', function(){
    state.honorarios = normalizeHonorarios(Object.assign({}, state.honorarios, { enabled:true, launchIds: state.lancamentos.map(function(lancamento){ return lancamento.id; }) }));
    honorariosSelectorOpen = true;
    if (honorariosEnabled) honorariosEnabled.checked = true;
    persistAndRefresh();
  });

  if (btnHonorariosClear) btnHonorariosClear.addEventListener('click', function(){
    state.honorarios = normalizeHonorarios(Object.assign({}, state.honorarios, { launchIds: [] }));
    honorariosSelectorOpen = true;
    persistAndRefresh();
  });

  if (honorariosLaunchesHost) honorariosLaunchesHost.addEventListener('change', function(event){
    const target = event.target;
    if (!target.classList.contains('honorarios-launch-check')) return;
    const launchId = String(target.getAttribute('data-launch-id') || '');
    const selected = new Set((state.honorarios.launchIds || []).map(String));
    if (target.checked) selected.add(launchId);
    else selected.delete(launchId);
    state.honorarios = normalizeHonorarios(Object.assign({}, state.honorarios, { launchIds: Array.from(selected) }));
    persistAndRefresh();
  });

  if (btnAddCusta) btnAddCusta.addEventListener('click', function(){
    state.custas = Array.isArray(state.custas) ? state.custas : [];
    state.custas.push(normalizeCusta({ id: uid('custa'), descricao:'Custas', valor:0 }));
    persistAndRefresh();
  });

  if (custasHost) {
    custasHost.addEventListener('input', function(event){
      const target = event.target;
      const custaId = target.getAttribute('data-custa-id');
      const index = getCustaIndexById(custaId);
      if (index < 0) return;
      if (target.classList.contains('custa-desc')) state.custas[index].descricao = target.value;
      if (target.classList.contains('custa-valor')) state.custas[index].valor = roundMoney(target.value);
      refreshSummaryOutputsOnly();
    });

    custasHost.addEventListener('focusout', function(event){
      const target = event.target;
      if (!target.classList.contains('custa-desc') && !target.classList.contains('custa-valor')) return;
      const custaId = target.getAttribute('data-custa-id');
      const index = getCustaIndexById(custaId);
      if (index < 0) return;
      if (target.classList.contains('custa-desc')) state.custas[index].descricao = String(target.value || '').trim() || 'Custas';
      if (target.classList.contains('custa-valor')) {
        state.custas[index].valor = roundMoney(target.value);
        target.value = formatCurrencyBR(state.custas[index].valor);
      }
      persistAndRefresh();
    });

    custasHost.addEventListener('focusin', function(event){
      const target = event.target;
      if (!target.classList.contains('custa-valor')) return;
      target.value = formatEditableNumberBR(target.value);
      target.select();
    });

    custasHost.addEventListener('paste', function(event){
      const target = event.target;
      if (!target.classList.contains('custa-valor')) return;
      event.preventDefault();
      const pastedText = event.clipboardData ? event.clipboardData.getData('text') : '';
      const parsedValue = roundMoney(pastedText);
      target.value = formatEditableNumberBR(parsedValue);
      const custaId = target.getAttribute('data-custa-id');
      const index = getCustaIndexById(custaId);
      if (index < 0) return;
      state.custas[index].valor = parsedValue;
      refreshSummaryOutputsOnly();
    });

    custasHost.addEventListener('click', function(event){
      const target = event.target;
      if (!target.classList.contains('btnRemoveCusta')) return;
      const custaId = target.getAttribute('data-custa-id');
      const index = getCustaIndexById(custaId);
      if (index < 0) return;
      state.custas.splice(index, 1);
      persistAndRefresh();
    });
  }

  launchSelector.addEventListener('change', function(){
    state.lancamentoSelecionadoId = this.value || '';
    save(collect());
    renderLaunches();
  });

  $('btnRenomearLancamento').addEventListener('click', openEditLaunchModal);
  $('btnExcluirLancamentoSelecionado').addEventListener('click', removeSelectedLaunch);

  async function refreshAllIndices(){
    for (let index = 0; index < state.lancamentos.length; index += 1){
      await updateIndicesForLaunch(index);
    }
  }

  $('btnAtualizar').addEventListener('click', async function(){
    await refreshAllIndices();
    persistAndRefresh();
    switchTab('report');
  });

  $('btnImprimir').addEventListener('click', function(){
    persistAndRefresh();
    openReportTabAndRender(function(){
      requestAnimationFrame(function(){
        CPPrintLayout.printRootInHost(reportRoot, 'calculos-civeis-print', 'Relatório - Cálculos Cíveis');
      });
    });
  });

  $('btnLimpar').addEventListener('click', function(){
    fields.requerente.value = '';
    fields.requerido.value = '';
    fields.processo.value = '';
    fields.ajuizamento.value = '';
    fields.dataAtualizacao.value = new Date().toISOString().slice(0,10);
    fields.observacoes.value = '';
    clearLaunchForm();
    state.lancamentos = [];
    state.honorarios = defaultHonorariosConfig();
    state.custas = [];
    persistAndRefresh();
  });

  function downloadJsonFile(filename, content){
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function downloadTextFile(filename, content, mimeType){
    const blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportCalculationToJson(){
    const data = collect();
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadJsonFile('calculo-civel-' + stamp + '.json', JSON.stringify(data, null, 2));
  }

  function csvEscape(value){
    const text = String(value == null ? '' : value);
    if (!/[;"\n\r]/.test(text)) return text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function toCsvRow(values){
    return values.map(csvEscape).join(';');
  }

  function parseCsvText(content){
    const rows = [];
    let row = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < content.length; i += 1){
      const char = content[i];
      const next = content[i + 1];
      if (quoted){
        if (char === '"' && next === '"'){
          current += '"';
          i += 1;
        } else if (char === '"'){
          quoted = false;
        } else {
          current += char;
        }
      } else if (char === '"'){
        quoted = true;
      } else if (char === ';'){
        row.push(current);
        current = '';
      } else if (char === '\n'){
        row.push(current);
        rows.push(row);
        row = [];
        current = '';
      } else if (char !== '\r'){
        current += char;
      }
    }
    row.push(current);
    if (row.some(function(cell){ return String(cell || '').trim() !== ''; })) rows.push(row);
    return rows;
  }

  function getActiveLaunch(){
    const launchIndex = getSelectedLaunchIndex();
    if (launchIndex < 0) return { launchIndex: -1, lancamento: null };
    return { launchIndex: launchIndex, lancamento: state.lancamentos[launchIndex] || null };
  }

  function exportActiveLaunchToCsv(){
    const active = getActiveLaunch();
    const lancamento = active.lancamento;
    if (!lancamento) return alert('Selecione uma verba para exportar.');
    const columns = (lancamento.colunas || []).slice();
    const header = ['Período'].concat(columns.map(function(coluna){ return coluna.nome || coluna.id; }));
    const dataRows = (lancamento.linhas || []).map(function(linha){
      const row = [linha.periodo || ''];
      columns.forEach(function(coluna){
        row.push(displayColumnValue(coluna, linha[coluna.id], { forInput: false }));
      });
      return row;
    });
    const csv = [toCsvRow(header)].concat(dataRows.map(toCsvRow)).join('\n');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const safeName = String(lancamento.verba || 'verba').replace(/[^\w\-]+/g, '_').slice(0, 40) || 'verba';
    downloadTextFile('lancamento_' + safeName + '_' + stamp + '.csv', csv, 'text/csv;charset=utf-8');
  }

  function importCsvIntoActiveLaunch(file){
    const active = getActiveLaunch();
    const launchIndex = active.launchIndex;
    const lancamento = active.lancamento;
    if (!lancamento) return alert('Selecione uma verba para importar o CSV.');
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(){
      try {
        const rows = parseCsvText(String(reader.result || ''));
        if (rows.length < 2) throw new Error('CSV sem linhas de dados.');
        const header = rows[0].map(function(cell){ return String(cell || '').trim(); });
        const headerMap = new Map(header.map(function(cell, index){ return [cell.toLowerCase(), index]; }));
        const periodIndex = headerMap.has('período') ? headerMap.get('período') : headerMap.get('periodo');
        if (periodIndex == null) throw new Error('Cabeçalho "Período" não encontrado.');
        const importableCols = (lancamento.colunas || []).filter(function(coluna){
          return coluna && coluna.tipo !== 'indice' && coluna.tipo !== 'formula';
        });
        const colIndexById = {};
        importableCols.forEach(function(coluna){
          const idx = headerMap.get(String(coluna.nome || '').trim().toLowerCase());
          if (idx != null) colIndexById[coluna.id] = idx;
        });
        const rowMap = new Map((lancamento.linhas || []).map(function(item){ return [String(item.periodo || ''), item]; }));
        for (let r = 1; r < rows.length; r += 1){
          const cells = rows[r];
          const periodo = String(cells[periodIndex] || '').trim();
          if (!periodo) continue;
          const linha = rowMap.get(periodo);
          if (!linha) continue;
          importableCols.forEach(function(coluna){
            const cellIndex = colIndexById[coluna.id];
            if (cellIndex == null) return;
            linha[coluna.id] = String(cells[cellIndex] == null ? '' : cells[cellIndex]).trim();
          });
        }
        recalculateLaunch(lancamento);
        persistAndRefresh();
        updateIndicesForLaunch(launchIndex);
        alert('CSV importado para a verba ativa com sucesso.');
      } catch (error) {
        alert('Falha ao importar CSV da verba ativa: ' + (error && error.message ? error.message : 'erro inesperado.'));
      }
    };
    reader.onerror = function(){
      alert('Não foi possível ler o CSV selecionado.');
    };
    reader.readAsText(file, 'utf-8');
  }

  function importCalculationFromJson(file){
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(){
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        fill(parsed);
        persistAndRefresh();
        alert('Arquivo importado com sucesso.');
      } catch (error) {
        alert('Não foi possível importar o arquivo JSON informado.');
      }
    };
    reader.onerror = function(){
      alert('Falha ao ler o arquivo JSON selecionado.');
    };
    reader.readAsText(file, 'utf-8');
  }

  function importLaunchesFromCsv(file, launchIndex){
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(){
      try {
        const rows = parseCsvRows(String(reader.result || ''));
        if (rows.length < 2) throw new Error('Arquivo CSV vazio.');
        const header = rows[0].map(function(cell){ return String(cell || '').trim().toLowerCase(); });
        const idxLaunchId = header.indexOf('lancamento_id');
        const idxPeriodo = header.indexOf('periodo');
        const idxColumnId = header.indexOf('coluna_id');
        const idxValor = header.indexOf('valor');
        if (idxLaunchId < 0 || idxPeriodo < 0 || idxColumnId < 0 || idxValor < 0) {
          throw new Error('Cabeçalho inválido. Use o CSV gerado pelo sistema.');
        }
        const allowedIds = new Set(typeof launchIndex === 'number' && state.lancamentos[launchIndex]
          ? [String(state.lancamentos[launchIndex].id || '')]
          : state.lancamentos.map(function(lancamento){ return String(lancamento.id || ''); }));
        const launchById = new Map(state.lancamentos.map(function(lancamento){ return [String(lancamento.id || ''), lancamento]; }));
        const touchedLaunches = new Set();
        let updatedCells = 0;
        rows.slice(1).forEach(function(cols){
          const launchId = String(cols[idxLaunchId] || '').trim();
          const periodo = String(cols[idxPeriodo] || '').trim();
          const columnId = String(cols[idxColumnId] || '').trim();
          const value = cols[idxValor];
          if (!launchId || !periodo || !columnId) return;
          if (!allowedIds.has(launchId)) return;
          const lancamento = launchById.get(launchId);
          if (!lancamento) return;
          if (!findEditableColumn(lancamento, columnId)) return;
          const linha = (lancamento.linhas || []).find(function(item){ return String(item.periodo || '') === periodo; });
          if (!linha) return;
          const parsedValue = roundMoney(value);
          if (columnId === 'valor') linha.valor = parsedValue;
          else linha[columnId] = parsedValue;
          touchedLaunches.add(launchId);
          updatedCells += 1;
        });
        touchedLaunches.forEach(function(launchId){
          const lancamento = launchById.get(launchId);
          if (lancamento) recalculateLaunch(lancamento);
        });
        if (!updatedCells) throw new Error('Nenhum valor foi atualizado. Revise o conteúdo do CSV.');
        persistAndRefresh();
        alert('Importação concluída com sucesso. ' + String(updatedCells) + ' célula(s) atualizada(s) em ' + String(touchedLaunches.size) + ' verba(s).');
      } catch (error) {
        alert('Não foi possível importar o arquivo CSV informado. ' + String(error && error.message || ''));
      }
    };
    reader.onerror = function(){
      alert('Falha ao ler o arquivo CSV selecionado.');
    };
    reader.readAsText(file, 'utf-8');
  }

  function triggerLaunchCsvImport(launchIndex){
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.style.display = 'none';
    input.addEventListener('change', function(){
      const file = this.files && this.files[0] ? this.files[0] : null;
      if (file) importLaunchesFromCsv(file, launchIndex);
      document.body.removeChild(input);
    }, { once:true });
    document.body.appendChild(input);
    input.click();
  }

  const btnExportJson = $('btnExportJson');
  const btnImportJson = $('btnImportJson');
  const importJsonInput = $('importJsonInput');
  const btnExportCsvLaunches = $('btnExportCsvLaunches');
  const btnImportCsvLaunches = $('btnImportCsvLaunches');
  const importCsvLaunchesInput = $('importCsvLaunchesInput');

  if (btnExportJson) btnExportJson.addEventListener('click', exportCalculationToJson);
  if (btnImportJson && importJsonInput) btnImportJson.addEventListener('click', function(){ importJsonInput.click(); });
  if (importJsonInput) importJsonInput.addEventListener('change', function(){
    const file = this.files && this.files[0] ? this.files[0] : null;
    if (file) importCalculationFromJson(file);
    this.value = '';
  });
  if (btnExportCsvLaunches) {
    btnExportCsvLaunches.style.display = 'none';
    btnExportCsvLaunches.setAttribute('aria-hidden', 'true');
    btnExportCsvLaunches.addEventListener('click', exportActiveLaunchToCsv);
  }
  if (btnImportCsvLaunches) {
    btnImportCsvLaunches.style.display = 'none';
    btnImportCsvLaunches.setAttribute('aria-hidden', 'true');
    if (importCsvLaunchesInput) {
      btnImportCsvLaunches.addEventListener('click', function(){ importCsvLaunchesInput.click(); });
    }
  }
  if (importCsvLaunchesInput) importCsvLaunchesInput.addEventListener('change', function(){
    const file = this.files && this.files[0] ? this.files[0] : null;
    if (file) importCsvIntoActiveLaunch(file);
    this.value = '';
  });

  $('btnCloseColumnModal').addEventListener('click', closeColumnModal);
  $('btnCloseEditColumnModal').addEventListener('click', closeEditColumnModal);
  $('btnCancelEditColumnModal').addEventListener('click', closeEditColumnModal);
  $('btnSaveEditColumnModal').addEventListener('click', saveEditColumnModal);
  $('btnCloseEditLaunchModal').addEventListener('click', closeEditLaunchModal);
  $('btnCancelEditLaunchModal').addEventListener('click', closeEditLaunchModal);
  $('btnSaveEditLaunchModal').addEventListener('click', saveEditLaunchModal);
  $('btnCancelColumnModal').addEventListener('click', closeColumnModal);
  $('btnSaveColumnModal').addEventListener('click', saveColumnFromModal);
  if (modalIndexKind && modalIndexSource) {
    modalIndexKind.addEventListener('change', function(){
      const previousRows = collectExtraIndexSegments(modalIndexSegments, this.value || 'correcao');
      const options = INDEX_SOURCE_OPTIONS[this.value || 'correcao'] || [];
      modalIndexSource.innerHTML = options.map(function(opt){ return '<option value="' + esc(opt.value) + '">' + esc(opt.label) + '</option>'; }).join('');
      renderIndexSegmentList(modalIndexSegments, this.value || 'correcao', previousRows);
    });
  }
  if (btnAddModalIndexSegment && modalIndexKind) {
    btnAddModalIndexSegment.addEventListener('click', function(){
      const kind = modalIndexKind.value || 'correcao';
      const rows = collectExtraIndexSegments(modalIndexSegments, kind);
      rows.push(normalizeIndexSegment({}, kind));
      renderIndexSegmentList(modalIndexSegments, kind, rows);
    });
  }
  if (btnAddEditIndexSegment) {
    btnAddEditIndexSegment.addEventListener('click', function(){
      const launchIndex = Number(editModalLaunchIndex.value);
      const columnId = editModalColumnId.value;
      const lancamento = state.lancamentos[launchIndex];
      const coluna = lancamento ? lancamento.colunas.find(function(item){ return item.id === columnId; }) : null;
      const kind = coluna && coluna.indexKind ? coluna.indexKind : 'correcao';
      const rows = collectExtraIndexSegments(editModalIndexSegments, kind);
      rows.push(normalizeIndexSegment({}, kind));
      renderIndexSegmentList(editModalIndexSegments, kind, rows);
    });
  }
  document.addEventListener('click', function(event){
    const target = event.target;
    if (!target || !target.classList || !target.classList.contains('js-remove-index-segment')) return;
    const row = target.closest('.js-index-segment-row');
    if (row && row.parentNode) row.parentNode.removeChild(row);
  });

  columnModal.addEventListener('click', function(event){
    if (event.target === columnModal) closeColumnModal();
  });
  editColumnModal.addEventListener('click', function(event){
    if (event.target === editColumnModal) closeEditColumnModal();
  });
  editLaunchModal.addEventListener('click', function(event){
    if (event.target === editLaunchModal) closeEditLaunchModal();
  });

  document.addEventListener('keydown', function(event){
    if (event.key === 'Escape' && columnModal.classList.contains('open')) closeColumnModal();
    if (event.key === 'Escape' && editColumnModal.classList.contains('open')) closeEditColumnModal();
    if (event.key === 'Escape' && editLaunchModal.classList.contains('open')) closeEditLaunchModal();
    if (event.key === 'Enter' && columnModal.classList.contains('open') && (event.target === modalColumnName || event.target === modalColumnFormula || event.target === modalIndexKind || event.target === modalIndexSource || event.target === modalIndexStart || event.target === modalIndexEnd)) {
      event.preventDefault();
      saveColumnFromModal();
    }
    if (event.key === 'Enter' && editColumnModal.classList.contains('open') && (event.target === editModalColumnName || event.target === editModalColumnFormula || event.target === editModalIndexSource || event.target === editModalIndexStart || event.target === editModalIndexEnd)) {
      event.preventDefault();
      saveEditColumnModal();
    }
    if (event.key === 'Enter' && editLaunchModal.classList.contains('open') && (event.target === editLaunchVerba || event.target === editLaunchDataInicial || event.target === editLaunchDataFinal || event.target === editLaunchObservacao)) {
      event.preventDefault();
      saveEditLaunchModal();
    }
  });

  const btnBack = $('btnBack');
  if (btnBack) btnBack.addEventListener('click', function(){ location.href = 'index.html'; });

  ['tabBtnDados','tabBtnReport'].forEach(function(id){
    $(id).addEventListener('click', function(){
      const tab = this.getAttribute('data-tab');
      if (tab === 'report') openReportTabAndRender();
      else switchTab(tab);
    });
  });

  [fields.requerente, fields.requerido, fields.processo, fields.ajuizamento, fields.dataAtualizacao, fields.observacoes].forEach(function(field){
    field.addEventListener('input', function(){
      save(collect());
      if (field === fields.dataAtualizacao) refreshAllIndices();
      buildReport(collect());
    });
  });
  const initial = load();
  fill(initial);
  state.lancamentos = normalizeLaunchListSafely(state.lancamentos);
  renderLaunches();
  renderSummaryPanel();
  buildReport(collect());
  if ($('tab-report') && $('tab-report').classList.contains('active')) renderReportDeferred();
  setTimeout(function(){
    state.lancamentos.forEach(function(lancamento, index){
      if (!(launchNeedsIndexRefresh(lancamento) || !(lancamento.indexConfig && lancamento.indexConfig.lastAutoRefresh))) return;
      Promise.resolve().then(function(){ return updateIndicesForLaunch(index); }).catch(function(){ });
    });
  }, 0);
})();
