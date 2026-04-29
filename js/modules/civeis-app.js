/** arquivo único autorizado para manutenção do cível */

(function(){
  const STORAGE_KEY = 'cp_civeis_inicial_v6';
  const LEGACY_STORAGE_KEYS = ['cp_civeis_inicial_v5', 'cp_civeis_inicial_v3'];
  const EXPORT_SCHEMA_VERSION = 2;
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
  let btnExportIndexTemplateModal = $('btnExportIndexTemplateModal');
  let btnImportIndexTableModal = $('btnImportIndexTableModal');
  let btnCreateFixedIndexTableModal = $('btnCreateFixedIndexTableModal');
  let fixedIndexGeneratorWrap = $('fixedIndexGeneratorWrap');
  let fixedTableName = $('fixedTableName');
  let fixedMonthlyRate = $('fixedMonthlyRate');
  let fixedStartMonth = $('fixedStartMonth');
  let fixedEndMonth = $('fixedEndMonth');
  let fixedEntryMode = $('fixedEntryMode');
  let btnSubmitFixedIndexTableModal = $('btnSubmitFixedIndexTableModal');
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
  const btnExportIndexTemplateEdit = $('btnExportIndexTemplateEdit');
  const btnImportIndexTableEdit = $('btnImportIndexTableEdit');
  const btnCreateFixedIndexTableEdit = $('btnCreateFixedIndexTableEdit');
  const editFixedIndexGeneratorWrap = $('editFixedIndexGeneratorWrap');
  const editFixedTableName = $('editFixedTableName');
  const editFixedMonthlyRate = $('editFixedMonthlyRate');
  const editFixedStartMonth = $('editFixedStartMonth');
  const editFixedEndMonth = $('editFixedEndMonth');
  const editFixedEntryMode = $('editFixedEntryMode');
  const btnSubmitFixedIndexTableEdit = $('btnSubmitFixedIndexTableEdit');
  const editLaunchModal = $('editLaunchModal');
  const editLaunchIndex = $('editLaunchIndex');
  const editLaunchVerba = $('editLaunchVerba');
  const editLaunchDataInicial = $('editLaunchDataInicial');
  const editLaunchDataFinal = $('editLaunchDataFinal');
  const editLaunchSummaryValorCorrigido = $('editLaunchSummaryValorCorrigido');
  const editLaunchSummaryJuros = $('editLaunchSummaryJuros');
  const editLaunchObservacao = $('editLaunchObservacao');
  const btnAddHonorario = $('btnAddHonorario');
  const honorariosHost = $('honorariosHost');
  const honorariosResumo = $('honorariosResumo');
  const custasHost = $('custasHost');
  const custasResumo = $('custasResumo');
  const btnAddCusta = $('btnAddCusta');
  const summaryTableHead = $('summaryTableHead');
  const summaryTableBody = $('summaryTableBody');
  const summaryTableFoot = $('summaryTableFoot');
  const editHonorarioModal = $('editHonorarioModal');
  const editHonorarioId = $('editHonorarioId');
  const editHonorarioTipo = $('editHonorarioTipo');
  const editHonorarioOperacao = $('editHonorarioOperacao');
  const editHonorarioSeparate = $('editHonorarioSeparate');
  const btnDeleteHonorarioModal = $('btnDeleteHonorarioModal');
  const editCustaModal = $('editCustaModal');
  const editCustaId = $('editCustaId');
  const editCustaOperacao = $('editCustaOperacao');
  const editCustaSeparate = $('editCustaSeparate');
  const btnDeleteCustaModal = $('btnDeleteCustaModal');
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
  const CUSTOM_INDEX_SOURCE_PREFIX = 'custom_table:';
  const DEFAULT_INDEX_COLUMNS = Object.freeze([
    { id:'correcao_monetaria', nome:'Correção Monetária', tipo:'indice', locked:true, formato:'indice', indexKind:'correcao', indexSource:'ipca', indexLimit:{ start:'', end:'' }, accumulationMode:'compound' },
    { id:'juros', nome:'Juros', tipo:'indice', locked:true, formato:'indice', indexKind:'juros', indexSource:'selic', indexLimit:{ start:'', end:'' }, accumulationMode:'compound' }
  ]);
  const DEFAULT_RESULT_COLUMNS = Object.freeze([
    { id:'valor_correcao', nome:'Valor da Correção', tipo:'formula', formato:'moeda', formula:'', includeInSummary:true },
    { id:'valor_juros', nome:'Valor dos Juros', tipo:'formula', formato:'moeda', formula:'', includeInSummary:true },
    { id:'valor_devido', nome:'Valor Devido', tipo:'formula', formato:'moeda', formula:'', includeInSummary:true }
  ]);
  let state = { lancamentos: [], lancamentoSelecionadoId: '', honorarios: defaultHonorariosConfig(), custas: [], indexTables: [] };
  const civeisModules = window.CPCiveisModules || {};
  const civeisStateCompat = civeisModules.state && typeof civeisModules.state.loadSnapshot === 'function' && typeof civeisModules.state.saveSnapshot === 'function'
    ? civeisModules.state
    : null;

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
      '<div class="index-source-head">' +
        '<label for="modalIndexSource">Fonte do índice</label>' +
        '<div class="index-source-actions">' +
          '<button type="button" class="btn-subtle" id="btnExportIndexTemplateModal">Modelo CSV</button>' +
          '<button type="button" class="btn-subtle" id="btnImportIndexTableModal">Importar CSV</button>' +
          '<button type="button" class="btn-subtle" id="btnCreateFixedIndexTableModal">Criar tabela fixa</button>' +
        '</div>' +
      '</div>' +
      '<div class="index-source-select-row"><select id="modalIndexSource" class="select"></select></div>' +
      '<div id="fixedIndexGeneratorWrap" style="display:none;margin-top:8px;padding:10px;border:1px solid var(--line,#d9d9d9);border-radius:10px">' +
        '<label for="fixedTableName">Nome da tabela</label>' +
        '<input id="fixedTableName" type="text" placeholder="Ex.: Juros Simples 0,3333% a.m.">' +
        '<div class="row" style="margin-top:8px">' +
          '<div class="col-6"><label for="fixedMonthlyRate">Taxa mensal (%)</label><input id="fixedMonthlyRate" type="text" inputmode="decimal" placeholder="0,3333"></div>' +
          '<div class="col-6"><label for="fixedEntryMode">Modo da entrada</label><select id="fixedEntryMode" class="select"><option value="percent">Percentual</option><option value="factor">Fator</option></select></div>' +
          '<div class="col-6"><label for="fixedStartMonth">Competência inicial</label><input id="fixedStartMonth" type="date"></div>' +
          '<div class="col-6"><label for="fixedEndMonth">Competência final</label><input id="fixedEndMonth" type="date"></div>' +
        '</div>' +
        '<div class="btn-row" style="margin-top:8px">' +
          '<button type="button" class="btn btn-ghost" id="btnSubmitFixedIndexTableModal">Gerar tabela</button>' +
        '</div>' +
      '</div>' +
      '<div class="row" style="margin-top:8px">' +
        '<div class="col-6"><label for="modalIndexStart">Aplicar a partir de</label><input id="modalIndexStart" type="date"></div>' +
        '<div class="col-6"><label for="modalIndexEnd">Aplicar até</label><input id="modalIndexEnd" type="date"></div>' +
      '</div>' +
      '<div id="modalIndexSegments" style="display:grid;gap:8px;margin-top:8px"></div>' +
      '<div class="btn-row" style="margin-top:8px">' +
        '<button type="button" class="btn btn-ghost" id="btnAddModalIndexSegment">Adicionar tabela por período</button>' +
      '</div>' +
      '<div class="formula-help">Defina fonte e limites opcionais para acumular o fator do índice.</div>';
    modalBody.appendChild(wrap);
    indexFieldWrap = $('indexFieldWrap');
    modalIndexKind = $('modalIndexKind');
    modalIndexSource = $('modalIndexSource');
    modalIndexStart = $('modalIndexStart');
    modalIndexEnd = $('modalIndexEnd');
    modalIndexSegments = $('modalIndexSegments');
    btnAddModalIndexSegment = $('btnAddModalIndexSegment');
    btnExportIndexTemplateModal = $('btnExportIndexTemplateModal');
    btnImportIndexTableModal = $('btnImportIndexTableModal');
    btnCreateFixedIndexTableModal = $('btnCreateFixedIndexTableModal');
    fixedIndexGeneratorWrap = $('fixedIndexGeneratorWrap');
    fixedTableName = $('fixedTableName');
    fixedMonthlyRate = $('fixedMonthlyRate');
    fixedStartMonth = $('fixedStartMonth');
    fixedEndMonth = $('fixedEndMonth');
    fixedEntryMode = $('fixedEntryMode');
    btnSubmitFixedIndexTableModal = $('btnSubmitFixedIndexTableModal');
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

  function isCustomIndexSource(sourceType){
    return String(sourceType || '').indexOf(CUSTOM_INDEX_SOURCE_PREFIX) === 0;
  }

  function getCustomIndexTableIdFromSource(sourceType){
    const raw = String(sourceType || '');
    return isCustomIndexSource(raw) ? raw.slice(CUSTOM_INDEX_SOURCE_PREFIX.length) : '';
  }

  function removeCustomIndexTableById(tableId){
    const id = normalizeIndexTableId(tableId);
    const before = Array.isArray(state.indexTables) ? state.indexTables.length : 0;
    state.indexTables = (state.indexTables || []).filter(function(table){
      return normalizeIndexTableId(table && table.id) !== id;
    });
    return before !== state.indexTables.length;
  }

  function normalizeIndexTableId(value){
    const raw = String(value || '').trim().toLowerCase();
    return raw.replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || ('tabela-' + Math.random().toString(16).slice(2, 8));
  }

  function getIndexSourceOptions(kind){
    const base = (INDEX_SOURCE_OPTIONS[kind] || []).slice();
    const custom = (Array.isArray(state.indexTables) ? state.indexTables : []).map(function(table){
      return {
        value: CUSTOM_INDEX_SOURCE_PREFIX + table.id,
        label: 'Tabela importada: ' + (table.name || table.id)
      };
    });
    return base.concat(custom);
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
    return (getIndexSourceOptions(kind).find(function(opt){ return opt.value === source; }) || {}).label || source || '—';
  }

  function getIndexSourceOptionLabel(kind, source){
    return (getIndexSourceOptions(kind).find(function(opt){ return opt.value === source; }) || {}).label || source || '—';
  }

  function describeIndexCompositionDetails(coluna){
    const kind = coluna && coluna.indexKind === 'juros' ? 'juros' : 'correcao';
    const summaryFactors = (coluna && Array.isArray(coluna.__summarySegmentFactors)) ? coluna.__summarySegmentFactors : coluna && Array.isArray(coluna.__lastSegmentFactors) ? coluna.__lastSegmentFactors : [];
    const factorByPosition = new Map(summaryFactors.map(function(item){
      return [Number(item.position), Number(item.factor)];
    }));
    return getIndexComposition(coluna).map(function(segment, index){
      const sourceRule = window.CPBCBRates && typeof window.CPBCBRates.describeSourceRule === 'function'
        ? window.CPBCBRates.describeSourceRule(segment.source)
        : null;
      const position = index + 1;
      const factorValue = factorByPosition.has(position) ? factorByPosition.get(position) : 1;
      return {
        position: position,
        sourceLabel: getIndexSourceOptionLabel(kind, segment.source),
        seriesLabel: sourceRule ? sourceRule.seriesLabel : 'Manual/sem série',
        unitLabel: sourceRule ? sourceRule.unitLabel : '—',
        formulaLabel: sourceRule ? sourceRule.formulaLabel : '—',
        intervalLabel: joinIndexIntervals(sourceRule ? sourceRule.intervalLabel : '', formatLimitInterval(segment.start || '', segment.end || '')),
        factorLabel: formatIndexFactor(factorValue)
      };
    });
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
    const compositionDetails = describeIndexCompositionDetails(coluna);
    return {
      name: String(coluna && coluna.nome || 'Índice'),
      columnRef: String(columnRef || ''),
      typeLabel: kind === 'juros' ? 'Juros' : 'Correção',
      sourceLabel: getIndexSourceLabel(coluna),
      limitLabel: formatLimitInterval(limit.start, limit.end),
      seriesLabel: sourceRule ? sourceRule.seriesLabel : 'Manual/sem série',
      unitLabel: sourceRule ? sourceRule.unitLabel : '—',
      formulaLabel: sourceRule ? sourceRule.formulaLabel : '—',
      intervalLabel: sourceRule ? sourceRule.intervalLabel : '',
      finalFactorLabel: formatIndexFactor(Number(coluna && (coluna.__summaryFactor || coluna.__lastFactor) || 1)),
      overlapLabel: (noOverlap && hasLimit) ? 'Sem incidência no período atual (limite fora da competência/data de atualização).' : '',
      compositionDetails: compositionDetails
    };
  }

  function joinIndexIntervals(intervalLabel, limitLabel){
    const base = String(intervalLabel || '').trim();
    const limit = String(limitLabel || '').trim();
    if (base && limit && base !== limit) return base + ' / ' + limit;
    return base || limit || '—';
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

  function parseStrictBRNumber(value){
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const normalized = normalizeLooseNumericText(value);
    if (!normalized || normalized === '-' || normalized === '.') return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeMonthKey(value){
    const raw = String(value || '').trim();
    if (!raw) return '';
    const match = raw.match(/^(\d{4})[-\/](\d{1,2})$/);
    if (!match) return '';
    const month = Number(match[2]);
    if (!Number.isInteger(month) || month < 1 || month > 12) return '';
    return match[1] + '-' + String(month).padStart(2, '0');
  }

  function getIndicesHelpers(){
    const helpers = window.CPCiveisModules && window.CPCiveisModules.indices ? window.CPCiveisModules.indices : null;
    return {
      normalizeMonthKey: helpers && typeof helpers.normalizeMonthKey === 'function' ? helpers.normalizeMonthKey : normalizeMonthKey,
      monthRange: helpers && typeof helpers.monthRange === 'function' ? helpers.monthRange : monthRange
    };
  }

  function buildFixedIndexEntriesByMonth(config){
    const helpers = getIndicesHelpers();
    const normalizeMonth = helpers.normalizeMonthKey;
    const toMonthRange = helpers.monthRange;
    const startMonth = normalizeMonth(config && config.startMonth);
    const endMonth = normalizeMonth(config && config.endMonth);
    const rawMode = String(config && config.mode || 'percent').trim().toLowerCase();
    const mode = rawMode === 'factor' ? 'factor' : 'percent';
    const value = parseBRNumber(config && config.value);
    if (!startMonth || !endMonth || startMonth > endMonth || !Number.isFinite(value)) return [];
    return toMonthRange(startMonth, endMonth).map(function(month){
      return { month: month, value: Number(value), mode: mode };
    });
  }

  function normalizeCompetenciaInput(value){
    const raw = String(value || '').trim();
    if (!raw) return '';
    return normalizeMonthKey(raw) || monthKeyFromISO(raw);
  }

  function resolveFixedIndexPeriodBounds(startInput, endInput){
    const explicitStart = normalizeCompetenciaInput(startInput);
    const explicitEnd = normalizeCompetenciaInput(endInput);
    let minMonth = '';
    let maxMonth = '';
    (state.lancamentos || []).forEach(function(lancamento){
      (lancamento && Array.isArray(lancamento.linhas) ? lancamento.linhas : []).forEach(function(linha){
        const month = monthKeyFromPeriodo(linha && linha.periodo);
        if (!month) return;
        if (!minMonth || month < minMonth) minMonth = month;
        if (!maxMonth || month > maxMonth) maxMonth = month;
      });
      const launchStart = monthKeyFromISO(lancamento && lancamento.dataInicial);
      const launchEnd = monthKeyFromISO(lancamento && lancamento.dataFinal);
      if (launchStart && (!minMonth || launchStart < minMonth)) minMonth = launchStart;
      if (launchEnd && (!maxMonth || launchEnd > maxMonth)) maxMonth = launchEnd;
    });
    const updateMonth = monthKeyFromISO(fields.dataAtualizacao && fields.dataAtualizacao.value || state.dataAtualizacao);
    if (updateMonth && (!maxMonth || updateMonth > maxMonth)) maxMonth = updateMonth;
    return {
      startMonth: explicitStart || minMonth,
      endMonth: explicitEnd || maxMonth
    };
  }

  function upsertFixedIndexTable(payload){
    const name = String(payload && payload.name || '').trim();
    const rateValue = parseStrictBRNumber(payload && payload.rate);
    const bounds = resolveFixedIndexPeriodBounds(payload && payload.startMonth, payload && payload.endMonth);
    const startMonth = bounds.startMonth;
    const endMonth = bounds.endMonth;
    const mode = String(payload && payload.mode || 'percent').trim().toLowerCase() === 'factor' ? 'factor' : 'percent';
    if (!name) {
      alert('Informe o nome da tabela.');
      return '';
    }
    if (!Number.isFinite(rateValue)) {
      alert('Informe uma taxa mensal numérica válida.');
      return '';
    }
    if (!startMonth || !endMonth) {
      alert('Não foi possível identificar o período completo. Informe ao menos uma competência.');
      return '';
    }
    if (startMonth > endMonth) {
      alert('A competência inicial deve ser menor ou igual à final.');
      return '';
    }
    const entries = buildFixedIndexEntriesByMonth({
      startMonth: startMonth,
      endMonth: endMonth,
      value: rateValue,
      mode: mode
    });
    if (!entries.length) {
      alert('Não foi possível gerar entradas para a faixa informada.');
      return '';
    }
    const normalizedId = normalizeIndexTableId(payload && payload.id || name);
    const grouped = new Map((state.indexTables || []).map(function(table){
      return [table.id, { id: table.id, name: table.name, entriesByMonth: new Map((table.entries || []).map(function(entry){
        return [entry.month, { value: Number(entry.value) || 0, mode: String(entry.mode || entry.valueMode || 'percent').trim().toLowerCase() === 'factor' ? 'factor' : 'percent' }];
      })) }];
    }));
    const current = grouped.get(normalizedId) || { id: normalizedId, name: name, entriesByMonth: new Map() };
    current.name = name;
    entries.forEach(function(entry){
      current.entriesByMonth.set(entry.month, { value: Number(entry.value), mode: mode });
    });
    grouped.set(normalizedId, current);
    state.indexTables = Array.from(grouped.values()).map(function(item){
      return {
        id: item.id,
        name: item.name,
        entries: Array.from(item.entriesByMonth.entries()).map(function(row){
          return { month: row[0], value: Number(row[1].value), mode: row[1].mode === 'factor' ? 'factor' : 'percent' };
        }).sort(function(a, b){ return compareMonth(a.month, b.month); })
      };
    }).sort(function(a, b){ return String(a.name || '').localeCompare(String(b.name || '')); });
    const preferredSource = CUSTOM_INDEX_SOURCE_PREFIX + normalizedId;
    persistAndRefresh();
    refreshOpenIndexSourceSelectors(preferredSource);
    return preferredSource;
  }

  function toggleFixedIndexGenerator(wrap){
    if (!wrap) return;
    wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
  }

  function normalizeIndexTables(list){
    const grouped = new Map();
    (Array.isArray(list) ? list : []).forEach(function(item){
      if (!item || typeof item !== 'object') return;
      const name = String(item.name || item.nome || '').trim();
      const entries = Array.isArray(item.entries) ? item.entries : [];
      if (!name || !entries.length) return;
      const normalizedId = normalizeIndexTableId(item.id || name);
      const existing = grouped.get(normalizedId) || { id: normalizedId, name: name, entriesByMonth: new Map() };
      existing.name = existing.name || name;
      entries.forEach(function(entry){
        const month = normalizeMonthKey(entry.month || entry.competencia);
        const value = Number(entry.value);
        const mode = String(entry.mode || entry.valueMode || 'percent').trim().toLowerCase() === 'factor' ? 'factor' : 'percent';
        if (!month || !Number.isFinite(value)) return;
        existing.entriesByMonth.set(month, { value: value, mode: mode });
      });
      grouped.set(normalizedId, existing);
    });
    return Array.from(grouped.values()).map(function(item){
      return {
        id: item.id,
        name: item.name,
        entries: Array.from(item.entriesByMonth.entries()).map(function(entry){
          const payload = entry[1] && typeof entry[1] === 'object' ? entry[1] : { value: entry[1], mode: 'percent' };
          return {
            month: entry[0],
            value: Number(payload.value),
            mode: String(payload.mode || 'percent').trim().toLowerCase() === 'factor' ? 'factor' : 'percent'
          };
        }).sort(function(a, b){ return compareMonth(a.month, b.month); })
      };
    }).filter(function(item){ return item.entries.length > 0; });
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

  function formatCsvDateAsText(value){
    const iso = parseDateInputValue(value);
    if (!iso) return '';
    return '="' + iso + '"';
  }

  function parseDateInputValue(value){
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return parseISODateUTC(raw) ? raw : '';
    const brMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (!brMatch) return '';
    const iso = brMatch[3] + '-' + String(brMatch[2]).padStart(2, '0') + '-' + String(brMatch[1]).padStart(2, '0');
    return parseISODateUTC(iso) ? iso : '';
  }

  function dateToEpochDays(value){
    const iso = parseDateInputValue(value);
    const date = parseISODateUTC(iso);
    if (!date) return 0;
    return Math.floor(date.getTime() / 86400000);
  }

  function monthLabel(year, monthIndex){
    const month = String(monthIndex + 1).padStart(2, '0');
    return month + '/' + year;
  }

  function isValidMonthNumber(month){
    return /^\d{2}$/.test(month) && Number(month) >= 1 && Number(month) <= 12;
  }

  function periodToMonthKey(periodo){
    const raw = String(periodo || '').trim();
    if (!raw) return '';
    let match = raw.match(/^(\d{2})-(\d{4})$/);
    if (match) return isValidMonthNumber(match[1]) ? (match[2] + '-' + match[1]) : '';
    match = raw.match(/^(\d{4})-(\d{2})$/);
    if (match) return isValidMonthNumber(match[2]) ? raw : '';
    match = raw.match(/^(\d{2})\/(\d{4})$/);
    if (match) return isValidMonthNumber(match[1]) ? (match[2] + '-' + match[1]) : '';
    match = raw.match(/^(\d{2})[\/\-](\d{2})$/);
    if (match) return isValidMonthNumber(match[1]) ? (('20' + match[2]) + '-' + match[1]) : '';
    match = raw.match(/^([a-zç]{3})\/(\d{2,4})$/i);
    if (match) {
      const monthAlias = String(match[1] || '').toLowerCase();
      const monthMap = { jan:'01', fev:'02', mar:'03', abr:'04', mai:'05', jun:'06', jul:'07', ago:'08', set:'09', out:'10', nov:'11', dez:'12' };
      const month = monthMap[monthAlias];
      const yearRaw = String(match[2] || '');
      if (!month || !isValidMonthNumber(month)) return '';
      const year = yearRaw.length === 2 ? ('20' + yearRaw) : yearRaw;
      return /^\d{4}$/.test(year) ? (year + '-' + month) : '';
    }
    return '';
  }

  function formatPeriodoMonthYear(periodo){
    const monthKey = periodToMonthKey(periodo);
    if (!monthKey) return '';
    const parts = monthKey.split('-');
    return parts.length === 2 && isValidMonthNumber(parts[1]) ? (parts[1] + '-' + parts[0]) : '';
  }

  function parseCsvCompetenciaToMonthKey(value){
    const raw = String(value || '').replace(/^\ufeff/, '').trim();
    if (!raw) return { monthKey: '', error: 'competência vazia' };
    let match = raw.match(/^(\d{2})-(\d{4})$/);
    if (match) {
      if (!isValidMonthNumber(match[1])) return { monthKey: '', error: 'mês inválido "' + match[1] + '" (use 01..12)' };
      return { monthKey: match[2] + '-' + match[1], error: '' };
    }
    match = raw.match(/^(\d{2})\/(\d{4})$/);
    if (match) {
      if (!isValidMonthNumber(match[1])) return { monthKey: '', error: 'mês inválido "' + match[1] + '" (use 01..12)' };
      return { monthKey: match[2] + '-' + match[1], error: '' };
    }
    match = raw.match(/^([a-zç]{3})\/(\d{2})$/i);
    if (match) {
      const monthAliasRaw = String(match[1] || '').toLowerCase();
      const monthAlias = typeof monthAliasRaw.normalize === 'function'
        ? monthAliasRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        : monthAliasRaw;
      const monthMap = { jan:'01', fev:'02', mar:'03', abr:'04', mai:'05', jun:'06', jul:'07', ago:'08', set:'09', out:'10', nov:'11', dez:'12' };
      const month = monthMap[monthAlias];
      if (!month || !isValidMonthNumber(month)) return { monthKey: '', error: 'mês textual inválido "' + monthAlias + '"' };
      return { monthKey: ('20' + match[2]) + '-' + month, error: '' };
    }
    return { monthKey: '', error: 'formato inválido "' + raw + '" (use preferencialmente mm-aaaa)' };
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
  function sourceAccumulationMode(sourceType){
    return sourceType === 'taxa_legal' || sourceType === 'juros_1am' ? 'simple' : 'compound';
  }
  function makeIndexPayload(path, monthlyRates, dailyRates, dailySeriesCode){ return { calculationPath: path || 'monthly', monthlyRates: Array.isArray(monthlyRates) ? monthlyRates : [], dailyRates: Array.isArray(dailyRates) ? dailyRates : [], dailySeriesCode: dailySeriesCode || null }; }
  async function loadAutoIndices(sourceType, startDate, endDate){
    if (!startDate || !endDate || sourceType === 'none') return makeIndexPayload('monthly', []);
    if (isCustomIndexSource(sourceType)) {
      const tableId = getCustomIndexTableIdFromSource(sourceType);
      const table = (Array.isArray(state.indexTables) ? state.indexTables : []).find(function(item){
        return item && item.id === tableId;
      });
      const startMonth = monthKeyFromISO(startDate);
      const endMonth = monthKeyFromISO(endDate);
      const normalizedEntries = Array.isArray(table && table.entries)
        ? table.entries
          .map(function(entry){
            return {
              month: normalizeMonthKey(entry && entry.month),
              value: Number(entry && entry.value),
              mode: String(entry && (entry.mode || entry.valueMode) || 'percent').trim().toLowerCase() === 'factor' ? 'factor' : 'percent'
            };
          })
          .filter(function(entry){
            return entry.month && Number.isFinite(entry.value) && (!startMonth || entry.month >= startMonth) && (!endMonth || entry.month <= endMonth);
          })
          .sort(compareMonth)
        : [];
      const hasFactorRows = normalizedEntries.some(function(entry){ return entry.mode === 'factor'; });
      if (hasFactorRows) {
        return makeIndexPayload('monthly_factor_lookup', normalizedEntries.map(function(entry){
          return { month: entry.month, value: entry.mode === 'factor' ? entry.value : (1 + entry.value / 100) };
        }));
      }
      return makeIndexPayload('monthly', normalizedEntries.map(function(entry){ return { month: entry.month, value: entry.value }; }));
    }
    if (sourceType === 'ipca') return makeIndexPayload('monthly', Array.from(monthlyMapFromBCB(await fetchSeries(433, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth));
    if (sourceType === 'ipcae') return makeIndexPayload('monthly', Array.from(monthlyMapFromBCB(await fetchSeries(10764, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth));
    if (sourceType === 'inpc') return makeIndexPayload('monthly', Array.from(monthlyMapFromBCB(await fetchSeries(188, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth));
    if (sourceType === 'igpm') return makeIndexPayload('monthly', Array.from(monthlyMapFromBCB(await fetchSeries(189, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth));
    if (sourceType === 'igpdi') return makeIndexPayload('monthly', Array.from(monthlyMapFromBCB(await fetchSeries(190, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth));
    if (sourceType === 'tr') return makeIndexPayload('monthly', Array.from(monthlyMapFromBCB(await fetchSeries(7811, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth));
    if (sourceType === 'cdi') {
      const raw = await fetchSeries(4389, startDate, endDate);
      return makeIndexPayload('daily_compound_exact', dailyToMonthlyEffective(raw, 4389), raw, 4389);
    }
    if (sourceType === 'selic') {
      const rawSelic = await fetchSeries(11, startDate, endDate);
      return makeIndexPayload('daily_compound_exact', dailyToMonthlyEffective(rawSelic, 11), rawSelic, 11);
    }
    if (sourceType === 'taxa_legal') {
      try {
        return makeIndexPayload('monthly', Array.from(monthlyMapFromBCB(await fetchSeries(29543, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth));
      } catch (error) {
        const taxaLegalStart = previousMonthKey(monthKeyFromISO(startDate));
        const taxaLegalStartISO = taxaLegalStart ? (taxaLegalStart + '-01') : startDate;
        return makeIndexPayload('monthly', buildTaxaLegalMonthly(await fetchSeries(11, taxaLegalStartISO, endDate), await fetchSeries(7478, taxaLegalStartISO, endDate)));
      }
    }
    if (sourceType === 'ec113_2021') return makeIndexPayload('monthly', buildEc113Monthly(await fetchSeries(10764, startDate, endDate), await fetchSeries(11, startDate, endDate)));
    if (sourceType === 'poupanca_auto') return makeIndexPayload('monthly', buildPoupancaMonthly(await fetchSeries(7811, startDate, endDate), await fetchSeries(432, startDate, endDate)));
    if (sourceType === 'juros_1am') return makeIndexPayload('monthly', buildFixedMonthlyRate(startDate, endDate, 1));
    if (sourceType === 'jam_auto') return makeIndexPayload('monthly', buildJamMonthly(await fetchSeries(7811, startDate, endDate)));
    return makeIndexPayload('monthly', []);
  }
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

  function defaultHonorarioItem(){
    return {
      id: uid('honorario'),
      enabled: true,
      separateInSummary: false,
      descricao: 'Honorários',
      tipo: 'percentual',
      percentual: 10,
      multiplicador: 1,
      launchIds: [],
      operacao: 'acrescer',
      valorFixo: 0,
      dataBase: '',
      indexSource: 'none',
      fatorCorrecao: 1
    };
  }

  function normalizeHonorarioItem(item){
    const base = Object.assign(defaultHonorarioItem(), item || {});
    const tipo = base.tipo === 'fixo' ? 'fixo' : 'percentual';
    const operacao = base.operacao === 'deduzir' ? 'deduzir' : 'acrescer';
    return {
      id: String(base.id || uid('honorario')),
      enabled: true,
      separateInSummary: !!base.separateInSummary,
      descricao: String(base.descricao || 'Honorários').trim() || 'Honorários',
      tipo: tipo,
      percentual: parseBRNumber(base.percentual || 0),
      multiplicador: parseBRNumber(base.multiplicador || 1) || 1,
      launchIds: Array.isArray(base.launchIds) ? base.launchIds.map(String).filter(Boolean) : [],
      operacao: operacao,
      valorFixo: roundMoney(base.valorFixo || 0),
      dataBase: String(base.dataBase || ''),
      indexSource: String(base.indexSource || 'none'),
      fatorCorrecao: Number.isFinite(Number(base.fatorCorrecao)) && Number(base.fatorCorrecao) > 0 ? Number(base.fatorCorrecao) : 1
    };
  }

  function defaultHonorariosConfig(){
    return { items: [] };
  }

  function normalizeHonorarios(config){
    const source = config || {};
    if (Array.isArray(source)) {
      const list = source.map(normalizeHonorarioItem).filter(Boolean);
      return { items: list };
    }
    const legacyShape = Object.prototype.hasOwnProperty.call(source, 'enabled') || Object.prototype.hasOwnProperty.call(source, 'percentual');
    const items = legacyShape
      ? [normalizeHonorarioItem(source)]
      : (Array.isArray(source.items) ? source.items.map(normalizeHonorarioItem) : []);
    return { items: items };
  }

  function normalizeCusta(item){
    const source = Object.assign({}, item || {});
    const separateInSummary = !!source.separateInSummary;
    const operacao = source.operacao === 'deduzir' ? 'deduzir' : 'acrescer';
    const includeInGrandTotal = typeof source.includeInGrandTotal === 'boolean'
      ? source.includeInGrandTotal
      : !separateInSummary;
    const normalized = {
      id: String(source.id || uid('custa')),
      descricao: String(source.descricao || 'Custas').trim() || 'Custas',
      valor: roundMoney(source.valor || 0),
      multiplicador: parseBRNumber(source.multiplicador || 1) || 1,
      operacao: operacao,
      separateInSummary: separateInSummary,
      includeInGrandTotal: includeInGrandTotal
    };
    return Object.assign({}, source, normalized);
  }

  function pickFirstDefined(){
    for (let index = 0; index < arguments.length; index += 1){
      if (typeof arguments[index] !== 'undefined') return arguments[index];
    }
    return undefined;
  }

  function normalizeCustasCollection(rawCustas){
    if (Array.isArray(rawCustas)) return rawCustas.map(normalizeCusta);
    if (!rawCustas || typeof rawCustas !== 'object') return [];
    if (Array.isArray(rawCustas.items)) return rawCustas.items.map(normalizeCusta);
    if (Array.isArray(rawCustas.custas)) return rawCustas.custas.map(normalizeCusta);
    const legacySingleItem = Object.prototype.hasOwnProperty.call(rawCustas, 'descricao')
      || Object.prototype.hasOwnProperty.call(rawCustas, 'valor')
      || Object.prototype.hasOwnProperty.call(rawCustas, 'multiplicador');
    return legacySingleItem ? [normalizeCusta(rawCustas)] : [];
  }

  function sanitizeSummaryState(){
    state.lancamentos = Array.isArray(state.lancamentos) ? state.lancamentos : [];
    state.lancamentoSelecionadoId = String(state.lancamentoSelecionadoId || '');
    state.lancamentos.forEach(normalizeSummaryMapping);
    state.honorarios = normalizeHonorarios(state.honorarios);
    if (!Array.isArray(state.honorarios.items)) state.honorarios.items = [];
    const validLaunchIds = new Set((state.lancamentos || []).map(function(lancamento){ return String(lancamento.id || ''); }).filter(Boolean));
    state.honorarios.items = (state.honorarios.items || []).map(function(item){
      const normalized = normalizeHonorarioItem(item);
      normalized.launchIds = normalized.launchIds.filter(function(id){ return validLaunchIds.has(String(id)); });
      return normalized;
    });
    state.custas = normalizeCustasCollection(state.custas);
    state.indexTables = normalizeIndexTables(state.indexTables);
  }

  function ensureHonorariosDefaultSelection(){
    state.honorarios = normalizeHonorarios(state.honorarios);
    if (!(state.lancamentos || []).length) return;
    state.honorarios.items = state.honorarios.items.map(function(item){
      const normalized = normalizeHonorarioItem(item);
      if (!normalized.enabled || normalized.tipo !== 'percentual' || normalized.launchIds.length) return normalized;
      normalized.launchIds = state.lancamentos.map(function(lancamento){ return lancamento.id; });
      return normalized;
    });
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
    return periodToMonthKey(periodo);
  }

  const monthRangeCache = new Map();

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

  function monthRangeCached(startMonthKey, endMonthKey){
    const key = String(startMonthKey || '') + '|' + String(endMonthKey || '');
    if (monthRangeCache.has(key)) return monthRangeCache.get(key);
    const computed = monthRange(startMonthKey, endMonthKey);
    monthRangeCache.set(key, computed);
    return computed;
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
    return monthRangeCached(clampedStart, clampedEnd).reduce(function(factor, monthKey){
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
      schemaVersion: EXPORT_SCHEMA_VERSION,
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
      indexTables: state.indexTables,
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
    state.honorarios = normalizeHonorarios(pickFirstDefined(source.honorarios, source.honorariosConfig, source.honorario, source.honorariosItens));
    state.custas = normalizeCustasCollection(pickFirstDefined(source.custas, source.custasConfig, source.custa, source.custasItens));
    state.indexTables = normalizeIndexTables(source.indexTables);
    sanitizeSummaryState();
  }

  function save(data){
    if (civeisStateCompat) {
      civeisStateCompat.saveSnapshot(window.localStorage, STORAGE_KEY, data);
      return;
    }
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
    if (civeisStateCompat) {
      return civeisStateCompat.loadSnapshot(window.localStorage, STORAGE_KEY, LEGACY_STORAGE_KEYS);
    }
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
    if (coluna.formato === 'indice' || coluna.formato === 'percentual' || coluna.formato === 'data') return false;
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

  function getSummaryMappingEligibleColumns(lancamento){
    return (lancamento && Array.isArray(lancamento.colunas) ? lancamento.colunas : []).filter(function(coluna){
      if (!coluna || !canColumnUseSummaryRole(coluna)) return false;
      return String(coluna.id || '') !== 'valor';
    });
  }

  function normalizeSummaryMapping(lancamento){
    if (!lancamento || !Array.isArray(lancamento.colunas)) {
      return defaultSummaryMapping();
    }
    const eligibleColumns = getSummaryMappingEligibleColumns(lancamento);
    const eligibleIds = new Set(eligibleColumns.map(function(coluna){ return String(coluna.id || ''); }).filter(Boolean));
    const defaults = defaultSummaryMapping();
    const roleBased = eligibleColumns.reduce(function(acc, coluna){
      const role = coluna && coluna.summaryRole;
      if (role === 'correcao' && !acc.valorCorrigidoColumnId) acc.valorCorrigidoColumnId = String(coluna.id || '');
      if (role === 'juros' && !acc.jurosColumnId) acc.jurosColumnId = String(coluna.id || '');
      return acc;
    }, { valorCorrigidoColumnId:'', jurosColumnId:'' });
    const current = Object.assign({}, defaults, lancamento.summaryMapping || {});
    const firstEligibleId = eligibleColumns[0] ? String(eligibleColumns[0].id || '') : '';
    const fallbackCorrecao = (eligibleIds.has(defaults.valorCorrigidoColumnId) ? defaults.valorCorrigidoColumnId : firstEligibleId);
    const fallbackJuros = eligibleIds.has(defaults.jurosColumnId) ? defaults.jurosColumnId : '';
    let valorCorrigidoColumnId = String(current.valorCorrigidoColumnId || '').trim();
    let jurosColumnId = String(current.jurosColumnId || '').trim();

    if (!eligibleIds.has(valorCorrigidoColumnId)) valorCorrigidoColumnId = roleBased.valorCorrigidoColumnId || fallbackCorrecao;
    if (!eligibleIds.has(jurosColumnId)) jurosColumnId = roleBased.jurosColumnId || fallbackJuros;
    if (jurosColumnId === valorCorrigidoColumnId) jurosColumnId = '';

    eligibleColumns.forEach(function(coluna){
      const id = String(coluna.id || '');
      if (id === valorCorrigidoColumnId) coluna.summaryRole = 'correcao';
      else if (id === jurosColumnId) coluna.summaryRole = 'juros';
      else coluna.summaryRole = 'none';
      normalizeColumnSummaryMeta(coluna);
    });
    lancamento.summaryMapping = {
      valorCorrigidoColumnId: valorCorrigidoColumnId,
      jurosColumnId: jurosColumnId
    };
    return lancamento.summaryMapping;
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
    const protectedText = text
      .replace(/\[\s*([a-zA-Z0-9_-]+)\s*\]/g, function(match, tokenId){
        return formulaTokenByColumnId(tokenId);
      })
      .replace(/\{\s*([a-zA-Z0-9_-]+)\s*\}/g, function(match, tokenId){
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
    return text.replace(/\{\s*([a-zA-Z0-9_-]+)\s*\}/g, function(match, tokenId){
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
    normalizeSummaryMapping(lancamento);
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
      .replace(/\[\s*([a-zA-Z0-9_-]+)\s*\]/g, function(match, tokenId){
        return Object.prototype.hasOwnProperty.call(byId, tokenId) ? '(' + byId[tokenId] + ')' : '(0)';
      })
      .replace(/\{\s*([a-zA-Z0-9_-]+)\s*\}/g, function(match, tokenId){
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
        const safeValue = coluna.formato === 'data'
          ? dateToEpochDays(rawValue)
          : (function(){
              const numericValue = Number(String(rawValue === undefined ? '' : rawValue).replace(',', '.'));
              return Number.isFinite(numericValue) ? numericValue : 0;
            })();
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


  function resolveActiveLaunchIndex(fallbackIndex){
    const selectedIndex = getSelectedLaunchIndex();
    if (selectedIndex >= 0 && state.lancamentos[selectedIndex]) return selectedIndex;
    if (typeof fallbackIndex === 'number' && fallbackIndex >= 0 && state.lancamentos[fallbackIndex]) return fallbackIndex;
    return -1;
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
    const opts = getIndexSourceOptions(kind);
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

  function fillIndexSourceSelect(selectEl, kind, selectedValue){
    if (!selectEl) return;
    const options = getIndexSourceOptions(kind);
    const preferred = selectedValue || defaultIndexSourceByKind(kind);
    const hasPreferred = options.some(function(opt){ return opt.value === preferred; });
    const finalValue = hasPreferred ? preferred : (options[0] ? options[0].value : defaultIndexSourceByKind(kind));
    selectEl.innerHTML = options.map(function(opt){
      return '<option value="' + esc(opt.value) + '"' + (opt.value === finalValue ? ' selected' : '') + '>' + esc(opt.label) + '</option>';
    }).join('');
  }

  function renderIndexSourceDropdownWithDelete(selectEl, kind, selectedValue){
    if (!selectEl) return;
    fillIndexSourceSelect(selectEl, kind, selectedValue);
    const wrap = selectEl.parentNode;
    const existing = wrap ? wrap.querySelector('.js-index-source-delete') : null;
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    const value = selectEl.value || '';
    if (!isCustomIndexSource(value) || !wrap) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-subtle subtle-x js-index-source-delete';
    button.textContent = '✕';
    button.title = 'Excluir tabela personalizada selecionada';
    button.setAttribute('aria-label', 'Excluir tabela personalizada selecionada');
    wrap.appendChild(button);
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
    editModalColumnFormula.value = coluna.tipo === 'formula'
      ? formatFormulaForDisplay(coluna.formula || '', lancamento)
      : (coluna.formula || '');
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
      const composition = getIndexComposition(coluna);
      const current = composition[0] ? composition[0].source : (coluna.indexSource || defaultIndexSourceByKind(coluna.indexKind || 'correcao'));
      renderIndexSourceDropdownWithDelete(editModalIndexSource, coluna.indexKind || 'correcao', current);
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
    (lancamento.linhas || []).forEach(function(linha){
      if (linha && Object.prototype.hasOwnProperty.call(linha, columnId)) delete linha[columnId];
    });
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
    const isDate = tipo === 'data';
    const isIndex = tipo === 'indice';
    const isFlexibleManual = tipo === 'manual';
    columnModalTitle.textContent = isFormula ? 'Nova coluna com fórmula' : (isIndex ? 'Nova coluna de índice' : (isDate ? 'Nova coluna de data' : 'Nova coluna manual'));
    columnModalSub.textContent = isFormula
      ? 'Crie uma coluna calculada com base nas letras das colunas já existentes.'
      : (isIndex ? 'Selecione o tipo de índice, a fonte e o limite opcional de aplicação.' : (isDate ? 'Crie uma coluna para informar datas por competência. Você pode usar essas datas em fórmulas para calcular diferença em dias.' : 'Crie uma coluna manual adicional. Se quiser, preencha a fórmula para gerar uma coluna calculada.'));
    formulaFieldWrap.style.display = (isFormula || isFlexibleManual) ? 'block' : 'none';
    if (indexFieldWrap) indexFieldWrap.style.display = isIndex ? 'block' : 'none';
    if (modalColumnName) modalColumnName.style.display = isIndex ? 'none' : 'block';
    const nameLabel = document.querySelector('label[for="modalColumnName"]');
    if (nameLabel) nameLabel.style.display = isIndex ? 'none' : 'block';
    if (isIndex && modalIndexKind && modalIndexSource){
      modalIndexKind.value = 'correcao';
      renderIndexSourceDropdownWithDelete(modalIndexSource, 'correcao');
    }
    if (modalColumnSummaryRole) {
      modalColumnSummaryRole.value = 'none';
      modalColumnSummaryRole.disabled = isIndex || isDate;
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
    } else if (tipo === 'data') {
      lancamento.colunas.push(normalizeColumnSummaryMeta({
        id: id,
        nome: nome,
        tipo: 'manual',
        formato: 'data',
        summaryRole: 'none'
      }));
      lancamento.linhas.forEach(function(linha){ linha[id] = ''; });
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
          if (cell.formato === 'data') return '<td><input type="date" data-launch-index="' + index + '" data-row-index="' + cell.rowIndex + '" data-column-id="' + esc(cell.columnId) + '" class="valor-input" value="' + esc(cell.inputValue) + '"></td>';
          return '<td><input type="text" inputmode="decimal" data-launch-index="' + index + '" data-row-index="' + cell.rowIndex + '" data-column-id="' + esc(cell.columnId) + '" class="valor-input" value="' + esc(cell.inputValue) + '" placeholder="0,00"></td>';
        }).join('');
        return '<tr><td>' + esc(row.periodo) + '</td>' + valueCells + '</tr>';
      }).join('');
      const badges = view.badges.map(function(label){
        return '<span class="mini-badge">' + esc(label) + '</span>';
      }).join('');
      const hasIndexColumn = (lancamento.colunas || []).some(function(coluna){ return coluna && coluna.tipo === 'indice'; });
      const indexSummaryRows = view.indexSummary.map(function(summary){
        const compositionRows = Array.isArray(summary.compositionDetails) && summary.compositionDetails.length > 1
          ? summary.compositionDetails.map(function(item){
              return '<span>Faixa ' + item.position + ': Fonte: ' + esc(item.sourceLabel) + ' • Série: ' + esc(item.seriesLabel) + ' • Unidade: ' + esc(item.unitLabel) + ' • Fórmula: ' + esc(item.formulaLabel) + ' • Intervalo: ' + esc(item.intervalLabel) + ' • Fator final da faixa: ' + esc(item.factorLabel) + '</span>';
            }).join('')
          : '';
        return '' +
          '<div class="index-summary-row">' +
            '<strong>' + esc(summary.name) + '</strong>' +
            (summary.columnRef ? '<span class="index-summary-col-ref">Coluna: ' + esc(summary.columnRef) + '</span>' : '') +
            '<span>Fonte: ' + esc(summary.sourceLabel) + '</span>' +
            '<span>Série: ' + esc(summary.seriesLabel) + '</span>' +
            '<span>Unidade: ' + esc(summary.unitLabel) + '</span>' +
            '<span>Fórmula: ' + esc(summary.formulaLabel) + '</span>' +
            '<span>Intervalo: ' + esc(joinIndexIntervals(summary.intervalLabel, summary.limitLabel)) + '</span>' +
            '<span>Fator final: ' + esc(summary.finalFactorLabel) + '</span>' +
            compositionRows +
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
            '<button type="button" class="btn btn-ghost btnImportLaunchCsv" data-launch-index="' + index + '" style="padding:4px 8px;font-size:11px;line-height:1.2" title="Importar CSV (layout horizontal novo: 1ª coluna Competência + colunas manuais da verba)." data-csv-importer="launches-horizontal-v2">CSV ↑</button>' +
          '</div>' +
        '</div>' +
        '<div class="launch-actions">' +
          '<button type="button" class="btn btn-primary btnFetchIndices" data-launch-index="' + index + '"' + (indexLoadingState[index] ? ' disabled aria-busy="true"' : '') + '>' + (indexLoadingState[index] ? 'Buscando índices...' : 'Atualizar índices') + '</button>' +
          '<button type="button" class="btn btn-ghost btnAddColumn" data-launch-index="' + index + '">Adicional Coluna</button>' +
          '<button type="button" class="btn btn-ghost btnAddDateCol" data-launch-index="' + index + '">Adicionar coluna de data</button>' +
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

  function factorForIndexComposition(composition, payloadBySource, competenciaStartISO, dataAtualizacaoISO, options){
    const requestedStartISO = String(competenciaStartISO || '');
    const requestedEndISO = String(dataAtualizacaoISO || '');
    const factorLookupMode = options && options.factorLookupMode === 'range_product' ? 'range_product' : 'month';
    const segmentFactorMemo = options && options.segmentFactorMemo instanceof Map ? options.segmentFactorMemo : new Map();
    const payloadMap = payloadBySource instanceof Map ? payloadBySource : new Map();
    if (!requestedStartISO || !requestedEndISO || requestedStartISO > requestedEndISO) return { factor: 1, hasOverlap: false };
    const segments = Array.isArray(composition) ? composition : [];
    let totalFactor = 1;
    let hasOverlap = false;
    const segmentDetails = [];
    for (let idx = 0; idx < segments.length; idx += 1){
      const segment = normalizeIndexSegment(segments[idx]);
      const payload = payloadMap.get(segment.source) || makeIndexPayload('monthly', []);
      const effectivePeriod = clampPeriodByLimit(requestedStartISO, requestedEndISO, { start: segment.start || '', end: segment.end || '' });
      if (!effectivePeriod) {
        segmentDetails.push({ position: idx + 1, factor: 1, hasOverlap: false });
        continue;
      }
      hasOverlap = true;
      const segmentMode = segment.accumulationMode || sourceAccumulationMode(segment.source);
      const segmentMemoKey = [
        String(segment.source || ''),
        effectivePeriod.startISO,
        effectivePeriod.endISO,
        segmentMode,
        payload.calculationPath || 'monthly',
        factorLookupMode
      ].join('|');
      if (segmentFactorMemo.has(segmentMemoKey)) {
        const memoFactor = Number(segmentFactorMemo.get(segmentMemoKey));
        totalFactor *= Number.isFinite(memoFactor) ? memoFactor : 1;
        segmentDetails.push({ position: idx + 1, factor: Number.isFinite(memoFactor) ? memoFactor : 1, hasOverlap: true });
        continue;
      }
      if (payload.calculationPath === 'daily_compound_exact' && payload.dailySeriesCode){
        const factorDaily = dailyCompoundExactFactor(payload.dailyRates, payload.dailySeriesCode, effectivePeriod.startISO, effectivePeriod.endISO);
        segmentFactorMemo.set(segmentMemoKey, factorDaily);
        totalFactor *= factorDaily;
        segmentDetails.push({ position: idx + 1, factor: factorDaily, hasOverlap: true });
        continue;
      }
      if (payload.calculationPath === 'monthly_factor_lookup'){
        const monthMapFactor = payload.monthlyFactorLookupMap instanceof Map
          ? payload.monthlyFactorLookupMap
          : (payload.monthlyFactorLookupMap = new Map((payload.monthlyRates || []).map(function(item){ return [item.month, item.value]; })));
        const factorFromTable = factorLookupMode === 'range_product'
          ? (function(){
              const startMonth = monthKeyFromISO(effectivePeriod.startISO);
              const endMonth = monthKeyFromISO(effectivePeriod.endISO);
              if (!startMonth || !endMonth || startMonth > endMonth) return 1;
              return monthRangeCached(startMonth, endMonth).reduce(function(factor, monthKey){
                const configuredFactor = Number(monthMapFactor.get(monthKey));
                return factor * ((Number.isFinite(configuredFactor) && configuredFactor > 0) ? configuredFactor : 1);
              }, 1);
            })()
          : (function(){
              const targetMonth = monthKeyFromISO(effectivePeriod.startISO);
              const configuredFactor = Number(monthMapFactor.get(targetMonth));
              return Number.isFinite(configuredFactor) && configuredFactor > 0 ? configuredFactor : 1;
            })();
        segmentFactorMemo.set(segmentMemoKey, factorFromTable);
        totalFactor *= factorFromTable;
        segmentDetails.push({ position: idx + 1, factor: factorFromTable, hasOverlap: true });
        continue;
      }
      const monthMap = payload.monthlyRatesMap instanceof Map
        ? payload.monthlyRatesMap
        : (payload.monthlyRatesMap = new Map((payload.monthlyRates || []).map(function(item){ return [item.month, item.value]; })));
      const startMonth = monthKeyFromISO(effectivePeriod.startISO);
      const endMonth = monthKeyFromISO(effectivePeriod.endISO);
      const factorMonthly = accumulateIndexFactor(monthMap, startMonth, endMonth, { start: segment.start || '', end: segment.end || '' }, segmentMode, effectivePeriod.startISO, effectivePeriod.endISO);
      segmentFactorMemo.set(segmentMemoKey, factorMonthly);
      totalFactor *= factorMonthly;
      segmentDetails.push({ position: idx + 1, factor: factorMonthly, hasOverlap: true });
    }
    return { factor: totalFactor, hasOverlap: hasOverlap, segmentDetails: segmentDetails };
  }

  async function updateIndicesForLaunch(launchIndex){
    const lancamento = state.lancamentos[launchIndex];
    if (!lancamento) return;
    if (indexLoadingState[launchIndex]) return;
    setIndexLoading(launchIndex, true);
    normalizeLaunch(lancamento);
    const config = Object.assign(defaultIndexConfig(), lancamento.indexConfig || {});
    const dataAtualizacao = fields.dataAtualizacao.value || new Date().toISOString().slice(0,10);
    const runStartPerf = window.performance && typeof window.performance.now === 'function' ? window.performance.now() : Date.now();
    if (!monthKeyFromISO(dataAtualizacao)){
      alert('Informe a data de atualização do cálculo.');
      return;
    }
    let indicesAtualizados = false;
    const payloadByColumnId = {};
    const precomputedFactorByColumnId = {};
    const segmentFactorMemo = new Map();
    let sourceLoadWarnings = 0;
    try {
      const indexColumns = getIndexColumns(lancamento);
      const shouldLogPerformance = (lancamento.linhas || []).length >= 100 && indexColumns.length >= 2;
      const summaryByColumnId = {};
      for (let idx = 0; idx < indexColumns.length; idx += 1){
        const coluna = indexColumns[idx];
        const composition = getIndexComposition(coluna);
        const allStarts = composition.map(function(segment){ return String(segment.start || '').trim(); }).filter(Boolean);
        const firstStart = allStarts.length ? allStarts.sort()[0] : '';
        const fetchStart = coluna.indexKind === 'juros' && firstStart
          ? minISODate(lancamento.dataInicial, firstStart)
          : lancamento.dataInicial;
        const payloadBySource = new Map();
        for (let segIdx = 0; segIdx < composition.length; segIdx += 1){
          const segment = composition[segIdx];
          const source = segment.source || defaultIndexSourceByKind(coluna.indexKind);
          if (payloadBySource.has(source)) continue;
          let payload;
          try {
            payload = await loadAutoIndices(source, fetchStart, dataAtualizacao);
          } catch (sourceError) {
            sourceLoadWarnings += 1;
            console.error('Falha ao carregar fonte de índice. Aplicando fallback neutro para seguir cálculo.', {
              source: source,
              launchIndex: launchIndex,
              lancamentoId: lancamento && lancamento.id,
              columnId: coluna && coluna.id,
              error: sourceError,
              stack: sourceError && sourceError.stack
            });
            payload = makeIndexPayload('monthly', []);
          }
          if (payload && Array.isArray(payload.monthlyRates) && !(payload.monthlyRatesMap instanceof Map)) {
            payload.monthlyRatesMap = new Map(payload.monthlyRates.map(function(item){ return [item.month, item.value]; }));
          }
          if (payload && payload.calculationPath === 'monthly_factor_lookup' && !(payload.monthlyFactorLookupMap instanceof Map)) {
            payload.monthlyFactorLookupMap = new Map((payload.monthlyRates || []).map(function(item){ return [item.month, item.value]; }));
          }
          payloadBySource.set(source, payload);
        }
        payloadByColumnId[coluna.id] = payloadBySource;
        const precomputedByKey = new Map();
        (lancamento.linhas || []).forEach(function(linha){
          const mesCompetencia = monthKeyFromPeriodo(linha.periodo);
          const inicioCompetenciaISO = mesCompetencia + '-01';
          const startISO = requestedStartISOForColumn(coluna, inicioCompetenciaISO);
          const cacheKey = composition.map(function(segment){
            return [
              segment.source || '',
              segment.start || '',
              segment.end || '',
              segment.accumulationMode || sourceAccumulationMode(segment.source)
            ].join('|');
          }).join('||') + '@' + startISO + '@' + dataAtualizacao;
          if (precomputedByKey.has(cacheKey)) return;
          precomputedByKey.set(cacheKey, factorForIndexComposition(composition, payloadBySource, startISO, dataAtualizacao, {
            segmentFactorMemo: segmentFactorMemo
          }));
        });
        precomputedFactorByColumnId[coluna.id] = precomputedByKey;
        coluna.__lastFactor = 1;
        coluna.__summaryFactor = 1;
        coluna.__lastNoOverlap = false;
        coluna.__segmentFactorByPosition = new Map();
        coluna.__lastSegmentFactors = [];
        coluna.__summarySegmentFactors = [];
        summaryByColumnId[coluna.id] = { maxFactor: 1, byPosition: new Map() };
      }
      lancamento.linhas.forEach(function(linha){
        const mesCompetencia = monthKeyFromPeriodo(linha.periodo);
        const inicioCompetenciaISO = mesCompetencia + '-01';
        indexColumns.forEach(function(coluna){
          const payloadBySource = payloadByColumnId[coluna.id] || new Map();
          const composition = getIndexComposition(coluna);
          if (coluna.indexKind === 'juros' && composition.length && !composition[0].start) {
            composition[0] = normalizeIndexSegment(Object.assign({}, composition[0], { start: lancamento.dataInicial }), 'juros');
          }
          const startISO = requestedStartISOForColumn(coluna, inicioCompetenciaISO);
          const compositionKey = composition.map(function(segment){
            return [
              segment.source || '',
              segment.start || '',
              segment.end || '',
              segment.accumulationMode || sourceAccumulationMode(segment.source)
            ].join('|');
          }).join('||');
          const factorCacheKey = compositionKey + '@' + startISO + '@' + dataAtualizacao;
          if (!(coluna.__segmentFactorByPosition instanceof Map)) coluna.__segmentFactorByPosition = new Map();
          const precomputed = precomputedFactorByColumnId[coluna.id] instanceof Map ? precomputedFactorByColumnId[coluna.id].get(factorCacheKey) : null;
          const calculation = precomputed || factorForIndexComposition(composition, payloadBySource, startISO, dataAtualizacao, {
            segmentFactorMemo: segmentFactorMemo
          });
          coluna.__lastNoOverlap = !calculation.hasOverlap;
          linha[coluna.id] = Number(calculation.factor.toFixed(7));
          coluna.__lastFactor = Math.max(Number(coluna.__lastFactor || 1), linha[coluna.id]);
          (calculation.segmentDetails || []).forEach(function(item){
            const position = Number(item.position);
            const factor = Number(Number(item.factor || 1).toFixed(7));
            const hasOverlap = !!item.hasOverlap;
            const prev = coluna.__segmentFactorByPosition.get(position);
            if (!prev || factor > prev.factor) coluna.__segmentFactorByPosition.set(position, { position: position, factor: factor, hasOverlap: hasOverlap });
          });
          const summary = summaryByColumnId[coluna.id];
          if (summary) {
            if (linha[coluna.id] > summary.maxFactor) summary.maxFactor = linha[coluna.id];
            (calculation.segmentDetails || []).forEach(function(item){
              const position = Number(item.position);
              const factor = Number(Number(item.factor || 1).toFixed(7));
              const hasOverlap = !!item.hasOverlap;
              const previous = summary.byPosition.get(position);
              if (!previous || factor > previous.factor) summary.byPosition.set(position, { position: position, factor: factor, hasOverlap: hasOverlap });
            });
          }
        });
      });
      indexColumns.forEach(function(coluna){
        const summary = summaryByColumnId[coluna.id];
        if (!summary) return;
        coluna.__summaryFactor = Number(Number(summary.maxFactor || 1).toFixed(7));
        coluna.__summarySegmentFactors = Array.from(summary.byPosition.values()).sort(function(a, b){ return a.position - b.position; });
      });
      config.lastAutoRefresh = new Date().toISOString();
      lancamento.indexConfig = config;
      recalculateLaunch(lancamento);
      indicesAtualizados = true;
      if (shouldLogPerformance) {
        const runEndPerf = window.performance && typeof window.performance.now === 'function' ? window.performance.now() : Date.now();
        console.info('[civeis] updateIndicesForLaunch benchmark', {
          launchIndex: launchIndex,
          rows: (lancamento.linhas || []).length,
          indexColumns: indexColumns.length,
          segmentMemoEntries: segmentFactorMemo.size,
          elapsedMs: Number((runEndPerf - runStartPerf).toFixed(2))
        });
      }
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
      if (sourceLoadWarnings > 0) {
        alert('Índices atualizados com aviso: ' + String(sourceLoadWarnings) + ' fonte(s) retornaram erro e foram tratadas com fator neutro.');
      }
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
    if (coluna && coluna.formato === 'data') {
      const iso = parseDateInputValue(valor);
      if (opts.forInput) return iso;
      return iso ? formatDateBR(iso) : (opts.fallbackDash ? '—' : '');
    }
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
            formato: coluna.formato,
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
        if (coluna.formato === 'percentual' || coluna.formato === 'indice' || coluna.formato === 'data') return '—';
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

  /**
   * Calcula a base percentual dos honorários como soma algébrica das verbas selecionadas.
   * Aceita verbas negativas e, portanto, o resultado pode ser positivo, negativo ou zero.
   */
  function calculateHonorariosBaseFromLaunches(selectedLaunches){
    const launches = Array.isArray(selectedLaunches) ? selectedLaunches : [];
    const rawTotal = launches.reduce(function(total, launchItem){
      const valorDevido = Number(launchItem && launchItem.valorDevido);
      return total + (Number.isFinite(valorDevido) ? valorDevido : 0);
    }, 0);
    const hasPositiveComponent = launches.some(function(launchItem){
      return Number(launchItem && launchItem.valorDevido) > 0;
    });
    const hasNegativeComponent = launches.some(function(launchItem){
      return Number(launchItem && launchItem.valorDevido) < 0;
    });
    return {
      value: rawTotal,
      hasPositiveComponent: hasPositiveComponent,
      hasNegativeComponent: hasNegativeComponent,
      isMixedSigns: hasPositiveComponent && hasNegativeComponent,
      isZero: Math.abs(rawTotal) < 0.005
    };
  }

  function buildCalculationSummary(data){
    const source = data || {};
    const launchItems = (Array.isArray(source.lancamentos) ? source.lancamentos : state.lancamentos).map(buildLaunchSummary);
    const honorariosState = normalizeHonorarios(source.honorarios || state.honorarios);
    const validLaunchIds = new Set(launchItems.map(function(item){ return item.id; }));
    const honorariosItems = honorariosState.items.map(function(item){
      const normalized = normalizeHonorarioItem(item);
      normalized.launchIds = normalized.launchIds.filter(function(id){ return validLaunchIds.has(String(id)); });
      const selectedSet = new Set(normalized.launchIds);
      const selectedLaunches = launchItems.filter(function(launchItem){ return selectedSet.has(launchItem.id); });
      const honorariosBase = calculateHonorariosBaseFromLaunches(selectedLaunches);
      const basePercentual = honorariosBase.value;
      const valorBasePercentual = normalized.enabled && normalized.tipo === 'percentual'
        ? (basePercentual * (normalized.percentual / 100))
      : 0;
      const valorPercentual = normalized.enabled && normalized.tipo === 'percentual'
        ? (valorBasePercentual * normalized.multiplicador)
        : 0;
      const fatorCorrecao = normalized.enabled && normalized.tipo === 'fixo'
        ? (normalized.indexSource === 'none' ? 1 : (Number(normalized.fatorCorrecao) || 1))
        : 1;
      const valorFixoCorrigido = normalized.enabled && normalized.tipo === 'fixo'
        ? roundMoney(normalized.valorFixo * fatorCorrecao)
        : 0;
      const valorCalculado = normalized.tipo === 'fixo' ? valorFixoCorrigido : valorPercentual;
      const valorFinal = normalized.operacao === 'deduzir'
        ? -Math.abs(valorCalculado)
        : Math.abs(valorCalculado);
      return {
        config: normalized,
        selectedLaunches: selectedLaunches,
        base: basePercentual,
        baseMeta: honorariosBase,
        valorBase: valorBasePercentual,
        valor: roundMoney(valorFinal),
        fatorCorrecao: fatorCorrecao
      };
    });
    const custasItems = (Array.isArray(source.custas) ? source.custas : state.custas).map(normalizeCusta).map(function(item){
      const valorBase = roundMoney(item.valor * item.multiplicador);
      const valorEfetivo = item.operacao === 'deduzir'
        ? -Math.abs(valorBase)
        : Math.abs(valorBase);
      return Object.assign({}, item, {
        valorBase: valorBase,
        valorEfetivo: valorEfetivo,
        includeInGrandTotal: !item.separateInSummary
      });
    });
    const rows = launchItems.map(function(item){
      return {
        kind: 'verba',
        id: item.id,
        verba: item.verba,
        note: '',
        valorCorrigido: item.valorCorrigido,
        juros: item.juros,
        valorDevido: item.valorDevido
      };
    });

    honorariosItems.forEach(function(item){
      if (item.config.tipo === 'fixo') {
        rows.push({
          kind: 'honorarios',
          id: item.config.id,
          verba: item.config.descricao + ' (valor fixo)',
          note: (item.config.separateInSummary ? 'Separado no resumo. ' : '') + (item.config.operacao === 'deduzir' ? 'Deduzido do crédito apurado. ' : 'Acrescido ao crédito apurado. ') + 'Base fixa em ' + formatDateBR(item.config.dataBase) + '.',
          valorCorrigido: item.valor,
          juros: 0,
          valorDevido: item.valor,
          includeInGrandTotal: !item.config.separateInSummary
        });
        return;
      }
      rows.push({
        kind: 'honorarios',
        id: item.config.id,
        verba: item.config.descricao + (item.config.percentual ? ' (' + formatNumberBR(item.config.percentual, 2, 4, true) + '%)' : '') + (item.config.multiplicador !== 1 ? (' × ' + formatNumberBR(item.config.multiplicador, 2, 4, true)) : ''),
        note: (item.config.separateInSummary ? 'Separado no resumo. ' : '') + (item.config.operacao === 'deduzir' ? 'Deduzido do crédito apurado. ' : 'Acrescido ao crédito apurado. ') + (item.selectedLaunches.length
          ? ('Base algébrica composta por ' + String(item.selectedLaunches.length) + ' verba(s).' + (item.baseMeta && item.baseMeta.isMixedSigns ? ' Há verbas positivas e negativas na composição.' : ''))
          : 'Nenhuma verba selecionada para compor a base.'),
        valorCorrigido: item.valor,
        juros: 0,
        valorDevido: item.valor,
        includeInGrandTotal: !item.config.separateInSummary
      });
    });

    custasItems.forEach(function(item, index){
      rows.push({
        kind: 'custas',
        id: item.id,
        verba: item.descricao || ('Custas ' + (index + 1)),
        note: (item.separateInSummary ? 'Separado no resumo. ' : '') + (item.operacao === 'deduzir' ? 'Deduzido do crédito apurado. ' : 'Acrescido ao crédito apurado. ') + 'Custas incluídas manualmente.' + (item.multiplicador !== 1 ? (' Valor base × multiplicador: ' + formatCurrencyBR(item.valor) + ' × ' + formatNumberBR(item.multiplicador, 2, 4, true) + '.') : ''),
        valorCorrigido: item.valorEfetivo,
        juros: 0,
        valorDevido: item.valorEfetivo,
        includeInGrandTotal: item.includeInGrandTotal
      });
    });

    rows.forEach(function(item){
      if (item && item.includeInGrandTotal === undefined) item.includeInGrandTotal = true;
    });

    const totals = rows.reduce(function(acc, item){
      acc.valorCorrigido += roundMoney(item.valorCorrigido);
      acc.juros += roundMoney(item.juros);
      acc.valorDevido += roundMoney(item.valorDevido);
      return acc;
    }, { valorCorrigido:0, juros:0, valorDevido:0 });
    const grandTotals = rows.reduce(function(acc, item){
      if (!item || item.includeInGrandTotal === false) return acc;
      acc.valorCorrigido += roundMoney(item.valorCorrigido);
      acc.juros += roundMoney(item.juros);
      acc.valorDevido += roundMoney(item.valorDevido);
      return acc;
    }, { valorCorrigido:0, juros:0, valorDevido:0 });
    const separatedHonorariosTotals = rows.reduce(function(acc, item){
      if (!item || item.kind !== 'honorarios' || item.includeInGrandTotal !== false) return acc;
      acc.valorCorrigido += roundMoney(item.valorCorrigido);
      acc.juros += roundMoney(item.juros);
      acc.valorDevido += roundMoney(item.valorDevido);
      return acc;
    }, { valorCorrigido:0, juros:0, valorDevido:0 });
    const separatedCustasTotals = rows.reduce(function(acc, item){
      if (!item || item.kind !== 'custas' || item.includeInGrandTotal !== false) return acc;
      acc.valorCorrigido += roundMoney(item.valorCorrigido);
      acc.juros += roundMoney(item.juros);
      acc.valorDevido += roundMoney(item.valorDevido);
      return acc;
    }, { valorCorrigido:0, juros:0, valorDevido:0 });

    totals.valorCorrigido = roundMoney(totals.valorCorrigido);
    totals.juros = roundMoney(totals.juros);
    totals.valorDevido = roundMoney(totals.valorDevido);
    grandTotals.valorCorrigido = roundMoney(grandTotals.valorCorrigido);
    grandTotals.juros = roundMoney(grandTotals.juros);
    grandTotals.valorDevido = roundMoney(grandTotals.valorDevido);
    separatedHonorariosTotals.valorCorrigido = roundMoney(separatedHonorariosTotals.valorCorrigido);
    separatedHonorariosTotals.juros = roundMoney(separatedHonorariosTotals.juros);
    separatedHonorariosTotals.valorDevido = roundMoney(separatedHonorariosTotals.valorDevido);
    separatedCustasTotals.valorCorrigido = roundMoney(separatedCustasTotals.valorCorrigido);
    separatedCustasTotals.juros = roundMoney(separatedCustasTotals.juros);
    separatedCustasTotals.valorDevido = roundMoney(separatedCustasTotals.valorDevido);
    const separatedHonorariosCount = rows.filter(function(item){
      return item && item.kind === 'honorarios' && item.includeInGrandTotal === false;
    }).length;
    const separatedCustasCount = rows.filter(function(item){
      return item && item.kind === 'custas' && item.includeInGrandTotal === false;
    }).length;

    return {
      rows: rows,
      launchItems: launchItems,
      honorarios: {
        items: honorariosItems,
        total: roundMoney(honorariosItems.reduce(function(total, item){ return total + roundMoney(item.valor); }, 0))
      },
      custas: {
        items: custasItems,
        total: roundMoney(custasItems.reduce(function(total, item){ return total + roundMoney(item.valorEfetivo); }, 0))
      },
      totals: totals,
      grandTotals: grandTotals,
      separatedHonorariosTotals: separatedHonorariosTotals,
      separatedHonorariosCount: separatedHonorariosCount,
      separatedCustasTotals: separatedCustasTotals,
      separatedCustasCount: separatedCustasCount
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
    function formatSummaryMoney(value){
      return '<span class="summary-money">' + esc(formatCurrencyBR(value)) + '</span>';
    }

    function getSummaryCellValue(row, columnId){
      if (columnId === 'valorCorrigido' && Number.isFinite(row.valorCorrigido)) return roundMoney(row.valorCorrigido);
      if (columnId === 'juros' && Number.isFinite(row.juros)) return roundMoney(row.juros);
      if (columnId === 'valorDevido' && Number.isFinite(row.valorDevido)) return roundMoney(row.valorDevido);
      return 0;
    }

    const summaryTotalsByColumn = {
      valorCorrigido: roundMoney(summaryData.grandTotals && Number.isFinite(summaryData.grandTotals.valorCorrigido) ? summaryData.grandTotals.valorCorrigido : 0),
      juros: roundMoney(summaryData.grandTotals && Number.isFinite(summaryData.grandTotals.juros) ? summaryData.grandTotals.juros : 0),
      valorDevido: roundMoney(summaryData.grandTotals && Number.isFinite(summaryData.grandTotals.valorDevido) ? summaryData.grandTotals.valorDevido : 0)
    };

    if (honorariosResumo) {
      const honorariosItems = summaryData.honorarios.items;
      function getBaseHint(item){
        if (!item || item.config.tipo !== 'percentual') return '';
        const baseMeta = item.baseMeta || {};
        if (baseMeta.isMixedSigns) return 'Base algébrica mista (inclui verbas positivas e negativas).';
        if (baseMeta.hasNegativeComponent && !baseMeta.hasPositiveComponent) return 'Base algébrica formada somente por verbas negativas.';
        if (baseMeta.isZero) return 'Base algébrica zerada.';
        return '';
      }
      honorariosResumo.innerHTML = '' +
        '<div class="summary-stats">' +
          '<div class="summary-stat"><span class="summary-stat-label">Itens no resumo</span><span class="summary-stat-value">' + String(honorariosItems.length) + '</span></div>' +
          '<div class="summary-stat"><span class="summary-stat-label">Honorários totais</span><span class="summary-stat-value">' + formatSummaryMoney(summaryData.honorarios.total || 0) + '</span></div>' +
        '</div>' +
        honorariosItems.map(function(item){
          if (item.config.tipo === 'fixo') {
            return '<div class="summary-inline-note"><b>' + esc(item.config.descricao) + '</b> &nbsp;•&nbsp; Operação: <b>' + esc(item.config.operacao === 'deduzir' ? 'Dedução' : 'Acréscimo') + '</b> &nbsp;•&nbsp; Fixo: <b>' + esc(formatCurrencyBR(item.config.valorFixo)) + '</b> &nbsp;•&nbsp; Data: <b>' + esc(formatDateBR(item.config.dataBase)) + '</b> &nbsp;•&nbsp; Índice: <b>' + esc(getIndexSourceOptionLabel('correcao', item.config.indexSource)) + '</b> &nbsp;•&nbsp; Fator: <b>x' + esc(formatNumberBR(item.fatorCorrecao || 1, 4, 7, true)) + '</b> &nbsp;•&nbsp; Total: <b>' + esc(formatCurrencyBR(item.valor || 0)) + '</b></div>';
          }
          const baseHint = getBaseHint(item);
          return '<div class="summary-inline-note"><b>' + esc(item.config.descricao) + '</b> &nbsp;•&nbsp; Operação: <b>' + esc(item.config.operacao === 'deduzir' ? 'Dedução' : 'Acréscimo') + '</b> &nbsp;•&nbsp; Verbas: <b>' + String(item.selectedLaunches.length) + '</b> &nbsp;•&nbsp; Base: <b>' + esc(formatCurrencyBR(item.base || 0)) + '</b>' + (baseHint ? ' &nbsp;•&nbsp; <b>' + esc(baseHint) + '</b>' : '') + ' &nbsp;•&nbsp; Percentual: <b>' + esc(formatNumberBR(item.config.percentual, 2, 4, true) + '%') + '</b> &nbsp;•&nbsp; Multiplicador: <b>x' + esc(formatNumberBR(item.config.multiplicador, 2, 4, true)) + '</b> &nbsp;•&nbsp; Total: <b>' + esc(formatCurrencyBR(item.valor || 0)) + '</b></div>';
        }).join('');
    }

    if (custasResumo) {
      custasResumo.innerHTML = '' +
        '<div class="summary-stats">' +
          '<div class="summary-stat"><span class="summary-stat-label">Itens lançados</span><span class="summary-stat-value">' + String(summaryData.custas.items.length) + '</span></div>' +
          '<div class="summary-stat"><span class="summary-stat-label">Total líquido de custas</span><span class="summary-stat-value">' + esc(formatCurrencyBR(summaryData.custas.total)) + '</span></div>' +
        '</div>' +
        summaryData.custas.items.map(function(item, index){
          const descricao = item.descricao || ('Custas ' + String(index + 1));
          const valorBase = roundMoney(item.valor);
          const multiplicador = parseBRNumber(item.multiplicador) || 1;
          const totalItem = roundMoney(item.valorEfetivo);
          const operacaoLabel = item.operacao === 'deduzir' ? 'Dedução' : 'Acréscimo';
          const efeitoLabel = item.operacao === 'deduzir' ? 'Deduzido do crédito apurado.' : 'Acrescido ao crédito apurado.';
          const separadoLabel = item.includeInGrandTotal === false ? 'Separado no resumo.' : 'Somado ao total geral.';
          const baseTexto = multiplicador === 1
            ? ('Valor base: <b>' + esc(formatCurrencyBR(valorBase)) + '</b>')
            : ('Base: <b>' + esc(formatCurrencyBR(valorBase)) + '</b> &nbsp;•&nbsp; Multiplicador: <b>x' + esc(formatNumberBR(multiplicador, 2, 4, true)) + '</b>');
          return '<div class="summary-inline-note"><b>' + esc(descricao) + '</b> &nbsp;•&nbsp; Operação: <b>' + esc(operacaoLabel) + '</b> &nbsp;•&nbsp; ' + esc(separadoLabel) + ' &nbsp;•&nbsp; ' + esc(efeitoLabel) + ' &nbsp;•&nbsp; ' + baseTexto + ' &nbsp;•&nbsp; Total líquido: <b>' + esc(formatCurrencyBR(totalItem)) + '</b></div>';
        }).join('');
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
              return '<td class="' + esc(coluna.className) + '">' + formatSummaryMoney(getSummaryCellValue(row, coluna.id)) + '</td>';
            }).join('') +
          '</tr>';
      }).join('') : '<tr><td colspan="' + String(summaryColumns.length + 1) + '" class="center">Nenhum item resumido até o momento.</td></tr>';
    }

    if (summaryTableFoot) {
      const showSeparatedHonorarios = Number(summaryData.separatedHonorariosCount || 0) > 0;
      const showSeparatedCustas = Number(summaryData.separatedCustasCount || 0) > 0;
      summaryTableFoot.innerHTML = '' +
        '<tr>' +
          '<td>Total geral</td>' +
          summaryColumns.map(function(coluna){
            return '<td class="' + esc(coluna.className) + '">' + formatSummaryMoney(summaryTotalsByColumn[coluna.id] || 0) + '</td>';
          }).join('') +
        '</tr>' +
        (showSeparatedHonorarios ? ('<tr class="summary-row-separate">' +
          '<td>Honorários separados</td>' +
          summaryColumns.map(function(coluna){
            const totals = summaryData.separatedHonorariosTotals || {};
            const value = coluna.id === 'valorCorrigido'
              ? totals.valorCorrigido
              : (coluna.id === 'juros' ? totals.juros : totals.valorDevido);
            return '<td class="' + esc(coluna.className) + '">' + formatSummaryMoney(value || 0) + '</td>';
          }).join('') +
        '</tr>') : '') +
        (showSeparatedCustas ? ('<tr class="summary-row-separate">' +
          '<td>Custas separadas</td>' +
          summaryColumns.map(function(coluna){
            const totals = summaryData.separatedCustasTotals || {};
            const value = coluna.id === 'valorCorrigido'
              ? totals.valorCorrigido
              : (coluna.id === 'juros' ? totals.juros : totals.valorDevido);
            return '<td class="' + esc(coluna.className) + '">' + formatSummaryMoney(value || 0) + '</td>';
          }).join('') +
        '</tr>') : '');
    }

    return summaryData;
  }

  function renderHonorariosEditor(summary){
    if (!honorariosHost) return;
    const summaryData = summary || buildCalculationSummary(collect());
    const dueById = new Map(summaryData.launchItems.map(function(item){ return [String(item.id), item.valorDevido]; }));
    if (!state.honorarios.items.length) {
      honorariosHost.innerHTML = '<div class="summary-empty">Nenhum honorário cadastrado.</div>';
      return;
    }
    honorariosHost.innerHTML = state.honorarios.items.map(function(rawItem){
      const item = normalizeHonorarioItem(rawItem);
      const launchesChecklist = state.lancamentos.length
        ? state.lancamentos.map(function(lancamento){
          const checked = item.launchIds.includes(String(lancamento.id)) ? ' checked' : '';
          return '<label class="summary-checkitem"><input type="checkbox" class="honorario-launch-check" data-honorario-id="' + esc(item.id) + '" data-launch-id="' + esc(lancamento.id) + '"' + checked + '><span><span class="summary-checklabel">' + esc(lancamento.verba || 'Verba') + '</span><span class="summary-checksub">Valor devido atual: ' + esc(formatCurrencyBR(dueById.get(String(lancamento.id)) || 0)) + '</span></span></label>';
        }).join('')
        : '<div class="summary-empty">Cadastre ao menos uma verba para compor a base dos honorários percentuais.</div>';
      const indexOptions = getIndexSourceOptions('correcao').map(function(option){
        return '<option value="' + esc(option.value) + '"' + (item.indexSource === option.value ? ' selected' : '') + '>' + esc(option.label) + '</option>';
      }).join('');
      return '' +
        '<div class="custa-card" data-honorario-id="' + esc(item.id) + '">' +
          '<div class="custa-card-head"><div class="custa-card-title">Honorário</div><button type="button" class="btn btn-ghost summary-remove-btn btnEditHonorario" data-honorario-id="' + esc(item.id) + '">Editar</button></div>' +
          '<div><label>Descrição</label><input type="text" class="honorario-desc" data-honorario-id="' + esc(item.id) + '" value="' + esc(item.descricao || '') + '" placeholder="Ex.: Honorários de terceiro"></div>' +
          (item.tipo === 'percentual'
            ? '<div class="custa-grid"><div><label>Percentual (%)</label><input type="text" inputmode="decimal" class="honorario-percentual" data-honorario-id="' + esc(item.id) + '" value="' + esc(item.percentual ? formatNumberBR(item.percentual, 2, 4, true) : '') + '" placeholder="10,00"></div><div><label>Multiplicador</label><input type="text" inputmode="decimal" class="honorario-multiplicador" data-honorario-id="' + esc(item.id) + '" value="' + esc(formatNumberBR(item.multiplicador || 1, 2, 4, true)) + '" placeholder="1,00"></div></div><div class="summary-checklist">' + launchesChecklist + '</div>'
            : '<div class="custa-grid"><div><label>Data-base</label><input type="date" class="honorario-data-base" data-honorario-id="' + esc(item.id) + '" value="' + esc(item.dataBase || '') + '"></div><div><label>Valor fixo</label><input type="text" inputmode="decimal" class="honorario-valor-fixo" data-honorario-id="' + esc(item.id) + '" value="' + esc(item.valorFixo ? formatCurrencyBR(item.valorFixo) : '') + '" placeholder="0,00"></div><div><label>Índice de correção</label><select class="select honorario-index-source" data-honorario-id="' + esc(item.id) + '">' + indexOptions + '</select></div></div>') +
        '</div>';
    }).join('');
  }

  function renderCustasEditor(){
    if (!custasHost) return;
    if (!state.custas.length) {
      custasHost.innerHTML = '<div class="summary-empty">Nenhuma custa cadastrada.</div>';
      return;
    }

    custasHost.innerHTML = state.custas.map(function(item){
      return '' +
        '<div class="custa-card" data-custa-id="' + esc(item.id) + '">' +
          '<div class="custa-card-head">' +
            '<div class="custa-card-title">Custa</div>' +
            '<button type="button" class="btn btn-ghost summary-remove-btn btnEditCusta" data-custa-id="' + esc(item.id) + '">Editar</button>' +
          '</div>' +
          '<div class="custa-grid">' +
            '<div><label>Descrição</label><input type="text" class="custa-desc" data-custa-id="' + esc(item.id) + '" value="' + esc(item.descricao || '') + '" placeholder="Ex.: Custas iniciais"></div>' +
            '<div><label>Valor</label><input type="text" class="custa-valor" data-custa-id="' + esc(item.id) + '" inputmode="decimal" value="' + esc(item.valor ? formatCurrencyBR(item.valor) : '') + '" placeholder="0,00"></div>' +
            '<div><label>Multiplicador</label><input type="text" class="custa-multiplicador" data-custa-id="' + esc(item.id) + '" inputmode="decimal" value="' + esc(formatNumberBR(item.multiplicador || 1, 2, 4, true)) + '" placeholder="1,00"></div>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  function renderSummaryPanel(){
    sanitizeSummaryState();
    const summary = buildCalculationSummary(collect());

    renderHonorariosEditor(summary);
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
        '<tr><td class="bold">Honorários</td><td>' + String(summary.honorarios.items.length) + ' item(ns) no resumo, total de ' + esc(formatCurrencyBR(summary.honorarios.total || 0)) + '.</td></tr>' +
        '<tr><td class="bold">Custas lançadas</td><td>' + String(summary.custas.items.length) + ' item(ns) — total líquido de ' + esc(formatCurrencyBR(summary.custas.total)) + '</td></tr>' +
        '<tr><td class="bold">Data-base de atualização</td><td>' + esc(formatDateBR(data.dataAtualizacao)) + '</td></tr>' +
        '<tr><td class="bold">Última atualização do relatório</td><td>' + esc(data.atualizadoEm || '—') + '</td></tr>' +
      '</tbody></table>'
    });

    const summaryBaseRows = summary.rows.length ? summary.rows : [{ verba:'Nenhum item resumido até o momento.', note:'', valorCorrigido:0, juros:0, valorDevido:0 }];
    const summaryRegularRows = summaryBaseRows.filter(function(row){
      return !(row && row.includeInGrandTotal === false && (row.kind === 'honorarios' || row.kind === 'custas'));
    });
    const summarySeparatedRows = summaryBaseRows.filter(function(row){
      return row && row.includeInGrandTotal === false && (row.kind === 'honorarios' || row.kind === 'custas');
    });
    const summaryRows = summaryRegularRows.map(function(row){
      return '<tr>' +
        '<td>' + esc(row.verba || '—') + (row.note ? '<span class="summary-row-note">' + esc(row.note) + '</span>' : '') + '</td>' +
        '<td class="right">' + esc(formatCurrencyBR(row.valorCorrigido || 0)) + '</td>' +
        '<td class="right">' + esc(formatCurrencyBR(row.juros || 0)) + '</td>' +
        '<td class="bold right">' + esc(formatCurrencyBR(row.valorDevido || 0)) + '</td>' +
      '</tr>';
    });
    const separatedRows = summarySeparatedRows.map(function(row){
      return '<tr class="summary-row-separate">' +
        '<td>' + esc(row.verba || '—') + (row.note ? '<span class="summary-row-note">' + esc(row.note) + '</span>' : '') + '</td>' +
        '<td class="right">' + esc(formatCurrencyBR(row.valorCorrigido || 0)) + '</td>' +
        '<td class="right">' + esc(formatCurrencyBR(row.juros || 0)) + '</td>' +
        '<td class="bold right">' + esc(formatCurrencyBR(row.valorDevido || 0)) + '</td>' +
      '</tr>';
    }).join('');
    const summaryFooter = '' +
      '<tr>' +
        '<td class="bold right">Total geral</td>' +
        '<td class="bold right">' + esc(formatCurrencyBR(summary.grandTotals ? summary.grandTotals.valorCorrigido : 0)) + '</td>' +
        '<td class="bold right">' + esc(formatCurrencyBR(summary.grandTotals ? summary.grandTotals.juros : 0)) + '</td>' +
        '<td class="bold right">' + esc(formatCurrencyBR(summary.grandTotals ? summary.grandTotals.valorDevido : 0)) + '</td>' +
      '</tr>' +
      separatedRows;
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
          const compositionRows = Array.isArray(summary.compositionDetails) && summary.compositionDetails.length > 1
            ? summary.compositionDetails.map(function(item){
                return '<div class="report-index-summary-subrow">Faixa ' + item.position + ': Fonte: ' + esc(item.sourceLabel) + ' • Série: ' + esc(item.seriesLabel) + ' • Unidade: ' + esc(item.unitLabel) + ' • Fórmula: ' + esc(item.formulaLabel) + ' • Intervalo: ' + esc(item.intervalLabel) + ' • Fator final da faixa: ' + esc(item.factorLabel) + '</div>';
              }).join('')
            : '';
          return '' +
            '<div class="report-index-summary-row">' +
              '<b>' + esc(summary.name) + '</b>' +
              (summary.columnRef ? '  Coluna: ' + esc(summary.columnRef) + '  ' : '  ') +
              'Fonte: ' + esc(summary.sourceLabel) + ' • Série: ' + esc(summary.seriesLabel) + ' • Unidade: ' + esc(summary.unitLabel) + ' • Fórmula: ' + esc(summary.formulaLabel) + ' • Intervalo: ' + esc(joinIndexIntervals(summary.intervalLabel, summary.limitLabel)) + ' • Fator final: ' + esc(summary.finalFactorLabel) +
              compositionRows +
              '</div>';
        }).join('');
        const headers = ['Data'].concat(view.columns.map(function(coluna){ return coluna.title; }));
        const effectiveColumnCount = 1 + view.columns.length;
        const launchCompactLevel = effectiveColumnCount >= 12 ? 'ultra-compact' : (effectiveColumnCount >= 9 ? 'compact' : '');
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
          compactLevel: launchCompactLevel,
          continuationLabel: esc(view.title) + ' (continuação)'
        });
      });
    }

    CPPrintLayout.applyReportBranding(reportRoot, branding);
  }


  let reportBuildFrameQueued = false;
  let reportBuildFrameHandle = null;
  let reportBuildRequest = null;
  let reportBuildCallbacks = [];
  const FREE_TEXT_FIELD_IDS = new Set(['observacoes', 'requerente', 'requerido', 'processo']);
  const FIELD_SAVE_DEBOUNCE_MS = 320;
  const DATA_ATUALIZACAO_REFRESH_DEBOUNCE_MS = 360;
  const debouncedSaveTimers = {};
  let dataAtualizacaoRefreshTimer = null;
  let dataAtualizacaoRefreshToken = 0;
  let dataAtualizacaoRefreshInFlight = false;
  let dataAtualizacaoRefreshQueued = false;

  function isReportTabActive(){
    const reportTab = $('tab-report');
    return !!(reportTab && reportTab.classList.contains('active'));
  }

  function cancelPendingReportBuild(){
    if (!reportBuildFrameQueued || reportBuildFrameHandle == null) return;
    const cancel = window.cancelAnimationFrame || function(handle){ clearTimeout(handle); };
    cancel(reportBuildFrameHandle);
    reportBuildFrameQueued = false;
    reportBuildFrameHandle = null;
    reportBuildRequest = null;
    reportBuildCallbacks = [];
  }

  function flushReportBuildQueue(){
    if (!reportBuildRequest) return;
    const pending = reportBuildRequest;
    reportBuildRequest = null;
    reportBuildFrameHandle = null;
    const opts = pending.options || {};
    try {
      buildReport(pending.data);
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
    }
    const callbacks = reportBuildCallbacks.slice();
    reportBuildCallbacks = [];
    callbacks.forEach(function(fn){
      try { fn(); } catch (e) {}
    });
  }

  function scheduleReportBuild(){
    if (reportBuildFrameQueued) return;
    reportBuildFrameQueued = true;
    const raf = window.requestAnimationFrame || function(cb){ return setTimeout(cb, 16); };
    reportBuildFrameHandle = raf(function(){
      reportBuildFrameQueued = false;
      flushReportBuildQueue();
    });
  }

  function renderReportDeferred(callback){
    cancelPendingReportBuild();
    if (typeof callback === 'function') reportBuildCallbacks.push(callback);
    safeBuildReport(collect(), { source: 'report-tab-deferred' });
  }

  function openReportTabAndRender(callback){
    switchTab('report');
    renderReportDeferred(callback);
  }

  function debounceByField(fieldId, delayMs, callback){
    if (!fieldId || typeof callback !== 'function') return;
    clearTimeout(debouncedSaveTimers[fieldId]);
    debouncedSaveTimers[fieldId] = setTimeout(function(){
      delete debouncedSaveTimers[fieldId];
      callback();
    }, delayMs);
  }

  function setDataAtualizacaoLoading(isLoading){
    if (!fields.dataAtualizacao) return;
    fields.dataAtualizacao.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    fields.dataAtualizacao.classList.toggle('is-loading', !!isLoading);
  }

  function scheduleDataAtualizacaoRefresh(){
    dataAtualizacaoRefreshToken += 1;
    const token = dataAtualizacaoRefreshToken;
    clearTimeout(dataAtualizacaoRefreshTimer);
    setDataAtualizacaoLoading(true);
    dataAtualizacaoRefreshTimer = setTimeout(async function(){
      if (token !== dataAtualizacaoRefreshToken) return;
      if (dataAtualizacaoRefreshInFlight) {
        dataAtualizacaoRefreshQueued = true;
        return;
      }
      dataAtualizacaoRefreshInFlight = true;
      try {
        await refreshAllIndices();
      } finally {
        dataAtualizacaoRefreshInFlight = false;
        if (dataAtualizacaoRefreshQueued) {
          dataAtualizacaoRefreshQueued = false;
          scheduleDataAtualizacaoRefresh();
          return;
        }
        if (token === dataAtualizacaoRefreshToken) setDataAtualizacaoLoading(false);
      }
    }, DATA_ATUALIZACAO_REFRESH_DEBOUNCE_MS);
  }


  let persistLightTimer = null;
  const PERSIST_LIGHT_DEBOUNCE_MS = 180;

  function safeBuildReport(data, options){
    reportBuildRequest = {
      data: data,
      options: options || {}
    };
    scheduleReportBuild();
  }

  function persistAndRefreshLight(options){
    sanitizeSummaryState();
    const data = collect();
    const opts = options || {};
    clearTimeout(persistLightTimer);
    persistLightTimer = setTimeout(function(){
      save(data);
    }, Number.isFinite(opts.saveDelayMs) ? opts.saveDelayMs : PERSIST_LIGHT_DEBOUNCE_MS);
    renderSummaryTotals(buildCalculationSummary(data));
    return data;
  }

  function persistAndRefreshFull(options){
    sanitizeSummaryState();
    const data = collect();
    save(data);
    renderLaunches();
    renderSummaryPanel();
    restorePendingGridFocus();
    const opts = options || {};
    safeBuildReport(data, {
      source: 'persistAndRefreshFull',
      context: opts.reportErrorContext || {},
      alertMessage: opts.reportErrorMessage || ''
    });
  }

  function persistAndRefresh(){
    persistAndRefreshFull.apply(null, arguments);
  }

  function persistHonorariosIncremental(options){
    sanitizeSummaryState();
    const data = collect();
    save(data);
    const summary = buildCalculationSummary(data);
    renderHonorariosEditor(summary);
    renderSummaryTotals(summary);
    const opts = options || {};
    safeBuildReport(data, {
      source: 'persistHonorariosIncremental',
      context: opts.reportErrorContext || {},
      alertMessage: opts.reportErrorMessage || ''
    });
  }

  function refreshSummaryOutputsOnly(){
    persistAndRefreshLight();
    if (isReportTabActive()) renderReportDeferred();
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
    if (coluna && coluna.formato === 'data') {
      const parsedDate = parseDateInputValue(target.value);
      if (columnId === 'valor') state.lancamentos[launchIndex].linhas[rowIndex].valor = parsedDate;
      else state.lancamentos[launchIndex].linhas[rowIndex][columnId] = parsedDate;
      return;
    }
    const parsedValue = parseBRNumber(target.value);
    if (columnId === 'valor') state.lancamentos[launchIndex].linhas[rowIndex].valor = parsedValue;
    else state.lancamentos[launchIndex].linhas[rowIndex][columnId] = parsedValue;
  });

  launchesHost.addEventListener('focusout', function(event){
    const target = event.target;
    if (!target.classList.contains('valor-input')) return;
    const launchIndex = Number(target.getAttribute('data-launch-index'));
    const resolvedLaunchIndex = resolveActiveLaunchIndex(launchIndex);
    if ((target.classList.contains('btnExportLaunchCsv') || target.classList.contains('btnImportLaunchCsv')) && resolvedLaunchIndex < 0) return;
    if (!state.lancamentos[launchIndex] && !(target.classList.contains('btnExportLaunchCsv') || target.classList.contains('btnImportLaunchCsv'))) return;
    const columnId = target.getAttribute('data-column-id') || 'valor';
    const coluna = getColumnById(state.lancamentos[launchIndex], columnId);
    if (coluna && coluna.formato === 'data') {
      target.value = parseDateInputValue(target.value);
      recalculateLaunch(state.lancamentos[launchIndex]);
      persistAndRefresh();
      return;
    }
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
    const launchIndex = Number(target.getAttribute('data-launch-index'));
    const columnId = target.getAttribute('data-column-id') || 'valor';
    const coluna = state.lancamentos[launchIndex] ? getColumnById(state.lancamentos[launchIndex], columnId) : null;
    if (coluna && coluna.formato === 'data') return;
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
    const coluna = getColumnById(state.lancamentos[launchIndex], columnId);
    if (coluna && coluna.formato === 'data') {
      const parsedDate = parseDateInputValue(pastedText);
      target.value = parsedDate;
      if (columnId === 'valor') state.lancamentos[launchIndex].linhas[rowIndex].valor = parsedDate;
      else state.lancamentos[launchIndex].linhas[rowIndex][columnId] = parsedDate;
      refreshSummaryOutputsOnly();
      return;
    }
    if (columnId === 'valor') state.lancamentos[launchIndex].linhas[rowIndex].valor = parsedValue;
    else state.lancamentos[launchIndex].linhas[rowIndex][columnId] = parsedValue;
    refreshSummaryOutputsOnly();
  });

  launchesHost.addEventListener('click', function(event){
    const target = event.target && typeof event.target.closest === 'function'
      ? event.target.closest('button[data-launch-index],button[data-column-id]')
      : event.target;
    if (!target) return;
    const launchIndex = Number(target.getAttribute('data-launch-index'));
    const resolvedLaunchIndex = resolveActiveLaunchIndex(launchIndex);
    if ((target.classList.contains('btnExportLaunchCsv') || target.classList.contains('btnImportLaunchCsv')) && resolvedLaunchIndex < 0) return;
    if (!state.lancamentos[launchIndex] && !(target.classList.contains('btnExportLaunchCsv') || target.classList.contains('btnImportLaunchCsv'))) return;
    if (target.classList.contains('btnAddColumn')){
      openColumnModal(launchIndex, 'manual');
      return;
    }
    if (target.classList.contains('btnAddDateCol')){
      openColumnModal(launchIndex, 'data');
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
      exportLaunchesToCsv(resolvedLaunchIndex);
      return;
    }
    if (target.classList.contains('btnImportLaunchCsv')){
      if (target.getAttribute('data-csv-importer') !== 'launches-horizontal-v2') return;
      triggerLaunchCsvImport(resolvedLaunchIndex);
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

  function getHonorarioIndexById(honorarioId){
    return (state.honorarios.items || []).findIndex(function(item){ return String(item.id) === String(honorarioId); });
  }

  function openEditHonorarioModal(honorarioId){
    const index = getHonorarioIndexById(honorarioId);
    if (index < 0 || !editHonorarioModal) return;
    const item = normalizeHonorarioItem(state.honorarios.items[index]);
    if (editHonorarioId) editHonorarioId.value = item.id;
    if (editHonorarioTipo) editHonorarioTipo.value = item.tipo === 'fixo' ? 'fixo' : 'percentual';
    if (editHonorarioOperacao) editHonorarioOperacao.value = item.operacao === 'deduzir' ? 'deduzir' : 'acrescer';
    if (editHonorarioSeparate) editHonorarioSeparate.checked = !!item.separateInSummary;
    editHonorarioModal.classList.add('open');
    editHonorarioModal.setAttribute('aria-hidden', 'false');
    setTimeout(function(){ if (editHonorarioTipo) editHonorarioTipo.focus(); }, 30);
  }

  function closeEditHonorarioModal(){
    if (!editHonorarioModal) return;
    editHonorarioModal.classList.remove('open');
    editHonorarioModal.setAttribute('aria-hidden', 'true');
    if (editHonorarioId) editHonorarioId.value = '';
    if (editHonorarioTipo) editHonorarioTipo.value = 'percentual';
    if (editHonorarioOperacao) editHonorarioOperacao.value = 'acrescer';
    if (editHonorarioSeparate) editHonorarioSeparate.checked = false;
  }

  function saveEditHonorarioModal(){
    const honorarioId = editHonorarioId ? editHonorarioId.value : '';
    const index = getHonorarioIndexById(honorarioId);
    if (index < 0) return closeEditHonorarioModal();
    const item = normalizeHonorarioItem(state.honorarios.items[index]);
    item.tipo = editHonorarioTipo && editHonorarioTipo.value === 'fixo' ? 'fixo' : 'percentual';
    item.operacao = editHonorarioOperacao && editHonorarioOperacao.value === 'deduzir' ? 'deduzir' : 'acrescer';
    item.separateInSummary = !!(editHonorarioSeparate && editHonorarioSeparate.checked);
    state.honorarios.items[index] = item;
    if (item.tipo === 'percentual' && !item.launchIds.length) ensureHonorariosDefaultSelection();
    closeEditHonorarioModal();
    persistAndRefresh();
  }

  function deleteHonorarioFromModal(){
    const honorarioId = editHonorarioId ? editHonorarioId.value : '';
    const index = getHonorarioIndexById(honorarioId);
    if (index < 0) return closeEditHonorarioModal();
    state.honorarios.items.splice(index, 1);
    if (!state.honorarios.items.length) {
      persistAndRefresh();
      closeEditHonorarioModal();
      return;
    }
    closeEditHonorarioModal();
    persistHonorariosIncremental();
  }

  function openEditCustaModal(custaId){
    const index = getCustaIndexById(custaId);
    if (index < 0 || !editCustaModal) return;
    const item = normalizeCusta(state.custas[index]);
    if (editCustaId) editCustaId.value = item.id;
    if (editCustaOperacao) editCustaOperacao.value = item.operacao === 'deduzir' ? 'deduzir' : 'acrescer';
    if (editCustaSeparate) editCustaSeparate.checked = !!item.separateInSummary;
    editCustaModal.classList.add('open');
    editCustaModal.setAttribute('aria-hidden', 'false');
    setTimeout(function(){ if (editCustaOperacao) editCustaOperacao.focus(); }, 30);
  }

  function closeEditCustaModal(){
    if (!editCustaModal) return;
    editCustaModal.classList.remove('open');
    editCustaModal.setAttribute('aria-hidden', 'true');
    if (editCustaId) editCustaId.value = '';
    if (editCustaOperacao) editCustaOperacao.value = 'acrescer';
    if (editCustaSeparate) editCustaSeparate.checked = false;
  }

  function saveEditCustaModal(){
    const custaId = editCustaId ? editCustaId.value : '';
    const index = getCustaIndexById(custaId);
    if (index < 0) return closeEditCustaModal();
    const item = normalizeCusta(state.custas[index]);
    item.operacao = editCustaOperacao && editCustaOperacao.value === 'deduzir' ? 'deduzir' : 'acrescer';
    item.separateInSummary = !!(editCustaSeparate && editCustaSeparate.checked);
    state.custas[index] = item;
    closeEditCustaModal();
    persistAndRefresh();
  }

  function deleteCustaFromModal(){
    const custaId = editCustaId ? editCustaId.value : '';
    const index = getCustaIndexById(custaId);
    if (index < 0) return closeEditCustaModal();
    state.custas.splice(index, 1);
    closeEditCustaModal();
    persistAndRefresh();
  }

  async function updateHonorariosFixedFactors(dataAtualizacaoISO){
    const dataFinal = String(dataAtualizacaoISO || state.dataAtualizacao || '').trim();
    if (!dataFinal) return;
    for (let index = 0; index < (state.honorarios.items || []).length; index += 1){
      const item = normalizeHonorarioItem(state.honorarios.items[index]);
      if (item.tipo !== 'fixo' || item.indexSource === 'none' || !item.dataBase || item.dataBase > dataFinal) {
        item.fatorCorrecao = 1;
        state.honorarios.items[index] = item;
        continue;
      }
      try {
        const payload = await loadAutoIndices(item.indexSource, item.dataBase, dataFinal);
        if (payload.calculationPath === 'daily_compound_exact'){
          item.fatorCorrecao = Number(dailyCompoundExactFactor(payload.dailyRates, payload.dailySeriesCode, item.dataBase, dataFinal).toFixed(7));
        } else if (payload.calculationPath === 'monthly_factor_lookup') {
          const monthMap = new Map((payload.monthlyRates || []).map(function(entry){ return [entry.month, Number(entry.value) || 1]; }));
          const startMonth = monthKeyFromISO(item.dataBase);
          const endMonth = monthKeyFromISO(dataFinal);
          item.fatorCorrecao = Number((startMonth && endMonth ? monthRange(startMonth, endMonth).reduce(function(factor, monthKey){
            return factor * (Number(monthMap.get(monthKey)) || 1);
          }, 1) : 1).toFixed(7));
        } else {
          const monthMap = new Map((payload.monthlyRates || []).map(function(entry){ return [entry.month, Number(entry.value) || 0]; }));
          item.fatorCorrecao = Number(accumulateIndexFactor(monthMap, monthKeyFromISO(item.dataBase), monthKeyFromISO(dataFinal), { start:'', end:'' }, sourceAccumulationMode(item.indexSource), item.dataBase, dataFinal).toFixed(7));
        }
      } catch (error) {
        console.warn('Falha ao atualizar índice do honorário fixo:', error);
        item.fatorCorrecao = 1;
      }
      state.honorarios.items[index] = item;
    }
  }

  if (btnAddHonorario) btnAddHonorario.addEventListener('click', function(){
    state.honorarios = normalizeHonorarios(state.honorarios);
    state.honorarios.items.push(normalizeHonorarioItem(defaultHonorarioItem()));
    persistHonorariosIncremental();
  });

  if (honorariosHost) {
    honorariosHost.addEventListener('input', function(event){
      const target = event.target;
      const honorarioId = target.getAttribute('data-honorario-id');
      const index = getHonorarioIndexById(honorarioId);
      if (index < 0) return;
      const item = normalizeHonorarioItem(state.honorarios.items[index]);
      if (target.classList.contains('honorario-desc')) item.descricao = target.value;
      if (target.classList.contains('honorario-percentual')) item.percentual = parseBRNumber(target.value);
      if (target.classList.contains('honorario-multiplicador')) item.multiplicador = parseBRNumber(target.value) || 1;
      if (target.classList.contains('honorario-valor-fixo')) item.valorFixo = roundMoney(target.value);
      state.honorarios.items[index] = item;
      refreshSummaryOutputsOnly();
    });
    honorariosHost.addEventListener('change', function(event){
      const target = event.target;
      const honorarioId = target.getAttribute('data-honorario-id');
      const index = getHonorarioIndexById(honorarioId);
      if (index < 0) return;
      const item = normalizeHonorarioItem(state.honorarios.items[index]);
      if (target.classList.contains('honorario-data-base')) item.dataBase = String(target.value || '');
      if (target.classList.contains('honorario-index-source')) item.indexSource = String(target.value || 'none');
      if (target.classList.contains('honorario-launch-check')) {
        const launchId = String(target.getAttribute('data-launch-id') || '');
        const selected = new Set(item.launchIds.map(String));
        if (target.checked) selected.add(launchId);
        else selected.delete(launchId);
        item.launchIds = Array.from(selected);
      }
      state.honorarios.items[index] = item;
      if (item.tipo === 'percentual' && !item.launchIds.length) ensureHonorariosDefaultSelection();
      persistAndRefresh();
    });
    honorariosHost.addEventListener('focusin', function(event){
      const target = event.target;
      if (!target.classList.contains('honorario-percentual') && !target.classList.contains('honorario-multiplicador') && !target.classList.contains('honorario-valor-fixo')) return;
      target.value = formatEditableNumberBR(target.value);
      target.select();
    });
    honorariosHost.addEventListener('focusout', function(event){
      const target = event.target;
      const honorarioId = target.getAttribute('data-honorario-id');
      const index = getHonorarioIndexById(honorarioId);
      if (index < 0) return;
      const item = normalizeHonorarioItem(state.honorarios.items[index]);
      if (target.classList.contains('honorario-desc')) item.descricao = String(target.value || '').trim() || 'Honorários';
      if (target.classList.contains('honorario-percentual')) { item.percentual = parseBRNumber(target.value); target.value = formatNumberBR(item.percentual, 2, 4, true); }
      if (target.classList.contains('honorario-multiplicador')) { item.multiplicador = parseBRNumber(target.value) || 1; target.value = formatNumberBR(item.multiplicador, 2, 4, true); }
      if (target.classList.contains('honorario-valor-fixo')) { item.valorFixo = roundMoney(target.value); target.value = formatCurrencyBR(item.valorFixo); }
      state.honorarios.items[index] = item;
      persistAndRefresh();
    });
    honorariosHost.addEventListener('paste', function(event){
      const target = event.target;
      if (!target.classList.contains('honorario-percentual') && !target.classList.contains('honorario-multiplicador') && !target.classList.contains('honorario-valor-fixo')) return;
      event.preventDefault();
      const pastedText = event.clipboardData ? event.clipboardData.getData('text') : '';
      const parsedValue = target.classList.contains('honorario-valor-fixo') ? roundMoney(pastedText) : parseBRNumber(pastedText);
      target.value = formatEditableNumberBR(parsedValue);
      const honorarioId = target.getAttribute('data-honorario-id');
      const index = getHonorarioIndexById(honorarioId);
      if (index < 0) return;
      const item = normalizeHonorarioItem(state.honorarios.items[index]);
      if (target.classList.contains('honorario-percentual')) item.percentual = parsedValue;
      if (target.classList.contains('honorario-multiplicador')) item.multiplicador = parsedValue || 1;
      if (target.classList.contains('honorario-valor-fixo')) item.valorFixo = parsedValue;
      state.honorarios.items[index] = item;
      refreshSummaryOutputsOnly();
    });
    honorariosHost.addEventListener('click', function(event){
      const target = event.target;
      if (!target.classList.contains('btnEditHonorario')) return;
      const honorarioId = target.getAttribute('data-honorario-id');
      openEditHonorarioModal(honorarioId);
    });
  }

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
      if (target.classList.contains('custa-multiplicador')) state.custas[index].multiplicador = parseBRNumber(target.value) || 1;
      refreshSummaryOutputsOnly();
    });

    custasHost.addEventListener('focusout', function(event){
      const target = event.target;
      if (!target.classList.contains('custa-desc') && !target.classList.contains('custa-valor') && !target.classList.contains('custa-multiplicador')) return;
      const custaId = target.getAttribute('data-custa-id');
      const index = getCustaIndexById(custaId);
      if (index < 0) return;
      if (target.classList.contains('custa-desc')) state.custas[index].descricao = String(target.value || '').trim() || 'Custas';
      if (target.classList.contains('custa-valor')) {
        state.custas[index].valor = roundMoney(target.value);
        target.value = formatCurrencyBR(state.custas[index].valor);
      }
      if (target.classList.contains('custa-multiplicador')) {
        state.custas[index].multiplicador = parseBRNumber(target.value) || 1;
        target.value = formatNumberBR(state.custas[index].multiplicador, 2, 4, true);
      }
      persistAndRefresh();
    });

    custasHost.addEventListener('focusin', function(event){
      const target = event.target;
      if (!target.classList.contains('custa-valor') && !target.classList.contains('custa-multiplicador')) return;
      target.value = formatEditableNumberBR(target.value);
      target.select();
    });

    custasHost.addEventListener('paste', function(event){
      const target = event.target;
      if (!target.classList.contains('custa-valor') && !target.classList.contains('custa-multiplicador')) return;
      event.preventDefault();
      const pastedText = event.clipboardData ? event.clipboardData.getData('text') : '';
      const parsedValue = target.classList.contains('custa-multiplicador')
        ? (parseBRNumber(pastedText) || 1)
        : roundMoney(pastedText);
      target.value = formatEditableNumberBR(parsedValue);
      const custaId = target.getAttribute('data-custa-id');
      const index = getCustaIndexById(custaId);
      if (index < 0) return;
      if (target.classList.contains('custa-multiplicador')) state.custas[index].multiplicador = parsedValue;
      if (target.classList.contains('custa-valor')) state.custas[index].valor = parsedValue;
      refreshSummaryOutputsOnly();
    });

    custasHost.addEventListener('click', function(event){
      const target = event.target;
      if (target.classList.contains('btnEditCusta')) {
        const custaId = target.getAttribute('data-custa-id');
        openEditCustaModal(custaId);
        return;
      }
      if (target.classList.contains('btnRemoveCusta')) {
        const custaId = target.getAttribute('data-custa-id');
        const index = getCustaIndexById(custaId);
        if (index < 0) return;
        state.custas.splice(index, 1);
        persistAndRefresh();
      }
    });

    custasHost.addEventListener('change', function(event){
      const target = event.target;
      if (!target.classList.contains('custa-desc') && !target.classList.contains('custa-valor') && !target.classList.contains('custa-multiplicador')) return;
      const custaId = target.getAttribute('data-custa-id');
      const index = getCustaIndexById(custaId);
      if (index < 0) return;
      if (target.classList.contains('custa-desc')) state.custas[index].descricao = String(target.value || '').trim() || 'Custas';
      if (target.classList.contains('custa-valor')) state.custas[index].valor = roundMoney(target.value);
      if (target.classList.contains('custa-multiplicador')) state.custas[index].multiplicador = parseBRNumber(target.value) || 1;
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
    await updateHonorariosFixedFactors(state.dataAtualizacao || '');
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

  function downloadCsvFile(filename, content){
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function sanitizeFilenameSegment(value){
    const raw = String(value == null ? '' : value).trim();
    const normalized = typeof raw.normalize === 'function' ? raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : raw;
    const clean = normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return clean || 'verba';
  }

  function escapeCsvCell(value){
    const text = String(value == null ? '' : value);
    if (!/[;"\n\r]/.test(text)) return text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function parseCsvRows(text){
    const source = String(text || '').replace(/^\ufeff/, '');
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    for (let index = 0; index < source.length; index += 1){
      const char = source[index];
      if (inQuotes) {
        if (char === '"') {
          if (source[index + 1] === '"') {
            cell += '"';
            index += 1;
          } else {
            inQuotes = false;
          }
        } else {
          cell += char;
        }
        continue;
      }
      if (char === '"') {
        inQuotes = true;
        continue;
      }
      if (char === ';') {
        row.push(cell);
        cell = '';
        continue;
      }
      if (char === '\n') {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
        continue;
      }
      if (char === '\r') continue;
      cell += char;
    }
    row.push(cell);
    if (row.length > 1 || row[0] !== '') rows.push(row);
    return rows;
  }

  function exportIndexTablesCsvTemplate(){
    const lines = [
      ['nome_tabela', 'competencia', 'fator_correcao', 'taxa_percentual', 'observacao'].join(';'),
      ['IPCA Manual', '2025-01', '1,0042', '', 'Use fator ou taxa percentual'].join(';'),
      ['IPCA Manual', '2025-02', '1,0078', '', ''].join(';'),
      ['Juros Tribunal X', '2025-01', '', '0,8500', 'Exemplo com taxa % mensal'].join(';'),
      ['Juros Simples 0,3333% a.m.', '2025-01', '', '0,3333', 'Exemplo de juros simples fixo'].join(';')
    ];
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadCsvFile('modelo-tabelas-indices-' + stamp + '.csv', lines.join('\r\n'));
  }

  function importIndexTablesFromCsv(file, options){
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(){
      try {
        const rows = parseCsvRows(String(reader.result || ''));
        if (rows.length < 2) throw new Error('Arquivo CSV vazio.');
        const header = rows[0].map(function(cell){ return String(cell || '').trim().toLowerCase(); });
        const idxName = header.indexOf('nome_tabela');
        const idxMonth = header.indexOf('competencia');
        const idxFactor = header.indexOf('fator_correcao');
        const idxPercent = header.indexOf('taxa_percentual');
        if (idxName < 0 || idxMonth < 0 || (idxFactor < 0 && idxPercent < 0)) {
          throw new Error('Cabeçalho inválido. Use o modelo CSV de tabelas de índices.');
        }
        const grouped = new Map((state.indexTables || []).map(function(table){
          return [table.id, { id: table.id, name: table.name, entriesByMonth: new Map((table.entries || []).map(function(entry){
            return [entry.month, { value: Number(entry.value) || 0, mode: String(entry.mode || entry.valueMode || 'percent').trim().toLowerCase() === 'factor' ? 'factor' : 'percent' }];
          })) }];
        }));
        let importedRows = 0;
        rows.slice(1).forEach(function(cols){
          const tableName = String(cols[idxName] || '').trim();
          const month = normalizeMonthKey(cols[idxMonth]);
          if (!tableName || !month) return;
          const tableId = normalizeIndexTableId(tableName);
          const factorRaw = idxFactor >= 0 ? cols[idxFactor] : '';
          const percentRaw = idxPercent >= 0 ? cols[idxPercent] : '';
          const factorValue = parseBRNumber(factorRaw);
          const percentValue = parseBRNumber(percentRaw);
          const hasFactor = String(factorRaw || '').trim() !== '' && Number.isFinite(factorValue);
          const hasPercent = String(percentRaw || '').trim() !== '' && Number.isFinite(percentValue);
          if (!hasFactor && !hasPercent) return;
          const importedEntry = hasFactor
            ? { value: Number(factorValue), mode: 'factor' }
            : { value: Number(percentValue), mode: 'percent' };
          const current = grouped.get(tableId) || { id: tableId, name: tableName, entriesByMonth: new Map() };
          current.name = tableName;
          current.entriesByMonth.set(month, importedEntry);
          grouped.set(tableId, current);
          importedRows += 1;
        });
        if (!importedRows) throw new Error('Nenhuma linha válida foi importada. Revise nome da tabela, competência e fator/taxa.');
        state.indexTables = Array.from(grouped.values()).map(function(item){
          return {
            id: item.id,
            name: item.name,
            entries: Array.from(item.entriesByMonth.entries()).map(function(entry){
              const payload = entry[1] && typeof entry[1] === 'object' ? entry[1] : { value: entry[1], mode: 'percent' };
              return {
                month: entry[0],
                value: Number(payload.value),
                mode: String(payload.mode || 'percent').trim().toLowerCase() === 'factor' ? 'factor' : 'percent'
              };
            }).sort(function(a, b){ return compareMonth(a.month, b.month); })
          };
        }).sort(function(a, b){ return String(a.name || '').localeCompare(String(b.name || '')); });
        persistAndRefresh();
        if (options && typeof options.onSuccess === 'function') options.onSuccess();
        alert('Tabelas de índices importadas com sucesso. ' + String(importedRows) + ' linha(s) processada(s).');
      } catch (error) {
        alert('Não foi possível importar o CSV de índices. ' + String(error && error.message || ''));
      }
    };
    reader.onerror = function(){
      alert('Falha ao ler o arquivo CSV de índices.');
    };
    reader.readAsText(file, 'utf-8');
  }

  function triggerIndexTablesCsvImport(options){
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.style.display = 'none';
    input.addEventListener('change', function(){
      const file = this.files && this.files[0] ? this.files[0] : null;
      if (file) importIndexTablesFromCsv(file, options);
      document.body.removeChild(input);
    }, { once:true });
    document.body.appendChild(input);
    input.click();
  }

  function refreshOpenIndexSourceSelectors(preferredSource){
    if (columnModal && columnModal.classList.contains('open') && modalColumnType && modalColumnType.value === 'indice' && modalIndexKind && modalIndexSource) {
      renderIndexSourceDropdownWithDelete(modalIndexSource, modalIndexKind.value || 'correcao', preferredSource || modalIndexSource.value);
      renderIndexSegmentList(modalIndexSegments, modalIndexKind.value || 'correcao', collectExtraIndexSegments(modalIndexSegments, modalIndexKind.value || 'correcao'));
    }
    if (editColumnModal && editColumnModal.classList.contains('open') && editModalLaunchIndex && editModalColumnId) {
      const launchIndex = Number(editModalLaunchIndex.value);
      const columnId = editModalColumnId.value;
      const lancamento = state.lancamentos[launchIndex];
      const coluna = lancamento ? lancamento.colunas.find(function(item){ return item.id === columnId; }) : null;
      const kind = coluna && coluna.indexKind ? coluna.indexKind : 'correcao';
      renderIndexSourceDropdownWithDelete(editModalIndexSource, kind, preferredSource || (editModalIndexSource ? editModalIndexSource.value : ''));
      renderIndexSegmentList(editModalIndexSegments, kind, collectExtraIndexSegments(editModalIndexSegments, kind));
    }
  }

  function findEditableColumn(lancamento, columnId){
    const id = String(columnId || '').trim();
    if (!id) return null;
    return (lancamento && Array.isArray(lancamento.colunas) ? lancamento.colunas : []).find(function(coluna){
      return coluna && coluna.id === id && coluna.tipo !== 'formula' && coluna.tipo !== 'indice';
    }) || null;
  }

  function exportCalculationToJson(){
    const data = collect();
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadJsonFile('calculo-civel-' + stamp + '.json', JSON.stringify(data, null, 2));
  }

  function exportLaunchesToCsv(launchIndex){
    try {
      const activeIndex = resolveActiveLaunchIndex(launchIndex);
      const lancamento = activeIndex >= 0 ? state.lancamentos[activeIndex] : null;
      if (!lancamento) {
        alert('Cadastre ao menos um lançamento antes de exportar o CSV.');
        return;
      }
      normalizeLaunch(lancamento);
      const editableColumns = (lancamento.colunas || []).filter(function(coluna){
        return coluna && coluna.tipo !== 'formula' && coluna.tipo !== 'indice';
      });
      const header = ['Competência'].concat(editableColumns.map(function(coluna){ return String(coluna.nome || coluna.id || '').trim(); }));
      const lines = [header.map(escapeCsvCell).join(';')];
      (lancamento.linhas || []).forEach(function(linha){
        const competencia = formatPeriodoMonthYear(linha && linha.periodo || '');
        const cells = [competencia];
        editableColumns.forEach(function(coluna){
          const columnId = coluna.id === 'valor' ? 'valor' : coluna.id;
          const rawValue = columnId === 'valor' ? linha.valor : linha[columnId];
          const serialized = coluna.formato === 'data'
            ? (parseDateInputValue(rawValue) || '')
            : formatEditableNumberBR(rawValue || 0);
          cells.push(serialized);
        });
        lines.push(cells.map(escapeCsvCell).join(';'));
      });
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      const suffix = '-' + sanitizeFilenameSegment(lancamento.verba || 'verba');
      downloadCsvFile('calculo-civel-lancamentos' + suffix + '-' + stamp + '.csv', lines.join('\r\n'));
    } catch (error) {
      console.error('Falha ao exportar lançamentos para CSV.', error);
      alert('Não foi possível exportar o CSV deste lançamento.');
    }
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


  function ensureLaunchImportFeedbackNode(){
    const feedbackScope = reportRoot || document.body;
    if (feedbackScope.__cpLaunchImportFeedbackNode && feedbackScope.__cpLaunchImportFeedbackNode.isConnected) return feedbackScope.__cpLaunchImportFeedbackNode;
    const node = document.createElement('div');
    node.id = 'cpLaunchImportFeedback';
    node.style.margin = '8px 0';
    node.style.padding = '8px 10px';
    node.style.border = '1px solid #dbe4f0';
    node.style.borderRadius = '8px';
    node.style.background = '#f8fbff';
    node.style.fontSize = '12px';
    node.style.color = '#334155';
    const host = $('lancamentosContainer') || document.body;
    if (host && host.parentNode) host.parentNode.insertBefore(node, host);
    else document.body.appendChild(node);
    feedbackScope.__cpLaunchImportFeedbackNode = node;
    return node;
  }

  function setLaunchImportFeedback(message){
    const node = ensureLaunchImportFeedbackNode();
    node.textContent = message;
  }

  function importLaunchesFromCsv(file, launchIndex){
    if (!file) return;
    setLaunchImportFeedback('Arquivo: ' + (file.name || 'arquivo_sem_nome.csv'));
    const reader = new FileReader();
    reader.onload = function(){
      const debugInfo = {
        fileName: file && file.name ? file.name : 'arquivo_sem_nome.csv',
        rawHeader: [],
        normalizedHeader: [],
        detectedLayout: 'indefinido',
        totalRowsRead: 0,
        updatedCells: 0,
        ignoredColumns: [],
        ignoredRowsInvalidCompetencia: 0,
        ignoredRowsCompetenciaNotFound: 0
      };
      try {
        const rows = parseCsvRows(String(reader.result || ''));
        debugInfo.totalRowsRead = Math.max(0, rows.length - 1);
        if (rows.length < 2) throw new Error('Arquivo CSV vazio.');
        const activeIndex = resolveActiveLaunchIndex(launchIndex);
        const activeLaunch = activeIndex >= 0 ? state.lancamentos[activeIndex] : null;
        if (!activeLaunch) throw new Error('Selecione uma verba ativa antes de importar o CSV.');
        normalizeLaunch(activeLaunch);
        const rawHeader = rows[0].map(function(cell){ return String(cell || ''); });
        const normalizedHeader = rawHeader.map(function(cell){ return normalizeCsvHeaderCell(cell); });
        debugInfo.rawHeader = rawHeader.slice();
        debugInfo.normalizedHeader = normalizedHeader.slice();
        const fileName = debugInfo.fileName;
        const firstHeaderLineDetected = rawHeader.join(' | ');
        console.info('[CSV Launch Import] arquivo:', fileName);
        console.info('[CSV Launch Import] cabeçalho bruto:', rawHeader);
        console.info('[CSV Launch Import] cabeçalho normalizado:', normalizedHeader);
        setLaunchImportFeedback('Arquivo: ' + fileName + ' | Cabeçalho detectado: ' + firstHeaderLineDetected);
        const describeLayoutError = function(baseMessage, layout){
          const firstThreeColumns = rawHeader.slice(0, 3).map(function(cell){ return String(cell || '').trim() || '(vazio)'; });
          return baseMessage
            + ' Arquivo: "' + fileName + '".'
            + ' Cabeçalho detectado (3 primeiras colunas): ' + firstThreeColumns.join(' | ') + '.'
            + ' Layout identificado: ' + layout + '.';
        };
        const isLegacyLayout = normalizedHeader.indexOf('lancamento_id') >= 0
          && normalizedHeader.indexOf('coluna_id') >= 0
          && normalizedHeader.indexOf('valor') >= 0;
        const firstColumnHeader = normalizedHeader.length ? normalizedHeader[0] : '';
        const isNewLayout = firstColumnHeader === 'competencia' || firstColumnHeader === 'periodo';
        const detectedLayout = isNewLayout ? 'novo' : (isLegacyLayout ? 'legado' : 'indefinido');
        debugInfo.detectedLayout = detectedLayout;
        console.info('[CSV Launch Import] layout detectado:', detectedLayout);
        if (firstColumnHeader === 'lancamento_id') {
          throw new Error(describeLayoutError('Este é o layout antigo; use o modelo Competência + colunas manuais.', 'legado'));
        }
        if (isLegacyLayout) {
          throw new Error(describeLayoutError('Este é o layout antigo; use o modelo Competência + colunas manuais.', 'legado'));
        }
        if (!isNewLayout) {
          throw new Error(describeLayoutError('Cabeçalho inválido para importação de lançamentos.', detectedLayout));
        }
        const acceptedFirstColumnHeaders = ['competencia', 'periodo'];
        if (!normalizedHeader.length || acceptedFirstColumnHeaders.indexOf(firstColumnHeader) < 0) {
          throw new Error(describeLayoutError('Cabeçalho inválido: a primeira coluna deve ser uma das opções: ' + acceptedFirstColumnHeaders.join(', ') + '. Valor lido: "' + String(rawHeader[0] || '').trim() + '".', detectedLayout));
        }
        const editableColumns = (activeLaunch.colunas || []).filter(function(coluna){
          return coluna && coluna.tipo !== 'formula' && coluna.tipo !== 'indice';
        });
        const manualColumns = editableColumns.filter(function(coluna){ return coluna.tipo === 'manual'; });
        const manualByName = new Map(manualColumns.map(function(coluna){ return [normalizeCsvHeaderCell(coluna.nome), coluna]; }).filter(function(entry){ return !!entry[0]; }));
        const manualById = new Map(manualColumns.map(function(coluna){ return [normalizeCsvHeaderCell(coluna.id), coluna]; }).filter(function(entry){ return !!entry[0]; }));
        const mappedColumns = [];
        for (let i = 1; i < normalizedHeader.length; i += 1){
          const key = normalizedHeader[i];
          if (!key) {
            mappedColumns.push(null);
            debugInfo.ignoredColumns.push('(vazia na posição ' + String(i + 1) + ')');
            continue;
          }
          const mapped = manualByName.get(key) || manualById.get(key) || null;
          if (!mapped) debugInfo.ignoredColumns.push(rawHeader[i] || key);
          mappedColumns.push(mapped);
        }
        if (!mappedColumns.some(Boolean)) {
          throw new Error(describeLayoutError('Cabeçalho inválido: nenhuma coluna manual conhecida foi identificada.', detectedLayout));
        }
        const linhasByMonthKey = new Map((activeLaunch.linhas || []).map(function(item){
          return [periodToMonthKey(item && item.periodo || ''), item];
        }).filter(function(entry){ return !!entry[0]; }));
        let updatedCells = 0;
        let updatedRows = 0;
        let ignoredRowsMissingCompetencia = 0;
        let ignoredRowsCompetenciaNotFound = 0;
        const invalidCompetenciaDetails = [];
        rows.slice(1).forEach(function(cols, idx){
          const csvLineNumber = idx + 2;
          const competencia = String(cols[0] || '').trim();
          const parsedCompetencia = parseCsvCompetenciaToMonthKey(competencia);
          const targetMonthKey = parsedCompetencia.monthKey;
          if (!targetMonthKey) {
            ignoredRowsMissingCompetencia += 1;
            invalidCompetenciaDetails.push('linha ' + String(csvLineNumber) + ': ' + parsedCompetencia.error);
            return;
          }
          const linha = linhasByMonthKey.get(targetMonthKey);
          if (!linha) {
            ignoredRowsCompetenciaNotFound += 1;
            return;
          }
          let updatedThisRow = 0;
          mappedColumns.forEach(function(coluna, offset){
            if (!coluna) return;
            const value = cols[offset + 1];
            const parsedValue = coluna.formato === 'data' ? parseDateInputValue(value) : roundMoney(value);
            if (coluna.id === 'valor') linha.valor = parsedValue;
            else linha[coluna.id] = parsedValue;
            updatedCells += 1;
            updatedThisRow += 1;
          });
          if (updatedThisRow) updatedRows += 1;
        });
        recalculateLaunch(activeLaunch);
        if (!updatedCells) throw new Error('Nenhum valor foi atualizado. Revise o conteúdo do CSV.');
        debugInfo.updatedCells = updatedCells;
        debugInfo.ignoredRowsInvalidCompetencia = ignoredRowsMissingCompetencia;
        debugInfo.ignoredRowsCompetenciaNotFound = ignoredRowsCompetenciaNotFound;
        persistAndRefresh();
        const invalidCompetenciaMessage = invalidCompetenciaDetails.length
          ? (' Detalhes das competências inválidas: ' + invalidCompetenciaDetails.join('; ') + '.')
          : '';
        setLaunchImportFeedback('Importação concluída para arquivo: ' + fileName + '. Cabeçalho detectado: ' + firstHeaderLineDetected);
        alert('Importação concluída: ' + String(updatedCells) + ' célula(s) atualizada(s) em ' + String(updatedRows) + ' competência(s). Colunas ignoradas: ' + String(debugInfo.ignoredColumns.length) + '. Ignoradas: ' + String(ignoredRowsMissingCompetencia) + ' linha(s) com competência inválida e ' + String(ignoredRowsCompetenciaNotFound) + ' competência(s) não encontrada(s) na verba ativa.' + invalidCompetenciaMessage);
        console.info('[CSV Launch Import] resumo:', debugInfo);
      } catch (error) {
        console.error('[CSV Launch Import] falha:', error && error.stack ? error.stack : error);
        console.info('[CSV Launch Import] diagnóstico:', debugInfo);
        alert('Não foi possível importar o arquivo CSV informado. Causa: ' + String(error && error.message || 'erro desconhecido') + '. Consulte o painel de debug para detalhes.');
      }
    };
    reader.onerror = function(){
      alert('Falha ao ler o arquivo CSV selecionado.');
    };
    reader.readAsText(file, 'utf-8');
  }

  function normalizeCsvHeaderCell(value){
    const base = String(value || '')
      .replace(/^\ufeff/, '')
      .trim()
      .toLowerCase();
    const normalized = typeof base.normalize === 'function'
      ? base.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      : base;
    return normalized;
  }

  

  function debugLaunchCsvImportFlow(file, rawContent, handlerPath){
    const content = String(rawContent || '').replace(/^\ufeff/, '');
    const firstTwoLines = content.split(/\r?\n/).slice(0, 2);
    console.info('[CSV Launch Import Debug] fluxo:', handlerPath);
    console.info('[CSV Launch Import Debug] arquivo:', file && file.name ? file.name : 'sem_nome');
    console.info('[CSV Launch Import Debug] primeiras 2 linhas:', firstTwoLines);
  }

  function handleLaunchCsvFileSelection(file, launchIndex, handlerPath){
    if (!file) return;
    setLaunchImportFeedback('Arquivo: ' + (file.name || 'arquivo_sem_nome.csv'));
    const reader = new FileReader();
    reader.onload = function(){
      try {
        const rawContent = String(reader.result || '');
        debugLaunchCsvImportFlow(file, rawContent, handlerPath || 'handleLaunchCsvFileSelection > importLaunchesFromCsv');
        importLaunchesFromCsv(file, resolveActiveLaunchIndex(launchIndex));
      } catch (error) {
        console.error('[CSV Launch Import] falha no pré-processamento:', error && error.stack ? error.stack : error);
        alert('Falha ao iniciar a importação do CSV. Causa: ' + String(error && error.message || 'erro desconhecido') + '.');
      }
    };
    reader.onerror = function(){
      alert('Falha ao ler o arquivo CSV selecionado para debug de importação.');
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
      if (file) handleLaunchCsvFileSelection(file, launchIndex, 'triggerLaunchCsvImport > change');
      document.body.removeChild(input);
    }, { once:true });
    document.body.appendChild(input);
    input.click();
  }

  const btnExportJson = $('btnExportJson');
  const btnImportJson = $('btnImportJson');
  const importJsonInput = $('importJsonInput');
  const legacyBtnExportCsvLaunches = $('btnExportCsvLaunches');
  const legacyBtnImportCsvLaunches = $('btnImportCsvLaunches');
  const legacyImportCsvLaunchesInput = $('importCsvLaunchesInput');

  [legacyBtnExportCsvLaunches, legacyBtnImportCsvLaunches, legacyImportCsvLaunchesInput].forEach(function(node){
    if (!node) return;
    node.disabled = true;
    node.style.display = 'none';
    node.setAttribute('aria-hidden', 'true');
    if ('value' in node) node.value = '';
    if (node.parentNode) node.parentNode.removeChild(node);
  });

  const legacyLaunchCsvFlowNodes = Array.from(document.querySelectorAll('[data-lancamento_id], [data-coluna_id], [name="lancamento_id"], [name="coluna_id"], #lancamento_id, #coluna_id'));
  legacyLaunchCsvFlowNodes.forEach(function(node){
    if (!node) return;
    node.disabled = true;
    node.style.display = 'none';
    node.setAttribute('aria-hidden', 'true');
    if ('value' in node) node.value = '';
    if (node.parentNode) node.parentNode.removeChild(node);
  });

  if (btnExportJson) btnExportJson.addEventListener('click', exportCalculationToJson);
  if (btnImportJson && importJsonInput) btnImportJson.addEventListener('click', function(){ importJsonInput.click(); });
  if (importJsonInput) importJsonInput.addEventListener('change', function(){
    const file = this.files && this.files[0] ? this.files[0] : null;
    if (file) importCalculationFromJson(file);
    this.value = '';
  });
  $('btnCloseColumnModal').addEventListener('click', closeColumnModal);
  $('btnCloseEditColumnModal').addEventListener('click', closeEditColumnModal);
  $('btnCancelEditColumnModal').addEventListener('click', closeEditColumnModal);
  $('btnSaveEditColumnModal').addEventListener('click', saveEditColumnModal);
  $('btnCloseEditLaunchModal').addEventListener('click', closeEditLaunchModal);
  $('btnCancelEditLaunchModal').addEventListener('click', closeEditLaunchModal);
  $('btnSaveEditLaunchModal').addEventListener('click', saveEditLaunchModal);
  if ($('btnCloseEditHonorarioModal')) $('btnCloseEditHonorarioModal').addEventListener('click', closeEditHonorarioModal);
  if ($('btnCancelEditHonorarioModal')) $('btnCancelEditHonorarioModal').addEventListener('click', closeEditHonorarioModal);
  if ($('btnSaveEditHonorarioModal')) $('btnSaveEditHonorarioModal').addEventListener('click', saveEditHonorarioModal);
  if (btnDeleteHonorarioModal) btnDeleteHonorarioModal.addEventListener('click', deleteHonorarioFromModal);
  if ($('btnCloseEditCustaModal')) $('btnCloseEditCustaModal').addEventListener('click', closeEditCustaModal);
  if ($('btnCancelEditCustaModal')) $('btnCancelEditCustaModal').addEventListener('click', closeEditCustaModal);
  if ($('btnSaveEditCustaModal')) $('btnSaveEditCustaModal').addEventListener('click', saveEditCustaModal);
  if (btnDeleteCustaModal) btnDeleteCustaModal.addEventListener('click', deleteCustaFromModal);
  if (editCustaOperacao) editCustaOperacao.addEventListener('change', saveEditCustaModal);
  if (editCustaSeparate) editCustaSeparate.addEventListener('change', saveEditCustaModal);
  $('btnCancelColumnModal').addEventListener('click', closeColumnModal);
  $('btnSaveColumnModal').addEventListener('click', saveColumnFromModal);
  if (modalIndexKind && modalIndexSource) {
    modalIndexKind.addEventListener('change', function(){
      const previousRows = collectExtraIndexSegments(modalIndexSegments, this.value || 'correcao');
      renderIndexSourceDropdownWithDelete(modalIndexSource, this.value || 'correcao');
      renderIndexSegmentList(modalIndexSegments, this.value || 'correcao', previousRows);
    });
    modalIndexSource.addEventListener('change', function(){
      renderIndexSourceDropdownWithDelete(modalIndexSource, modalIndexKind.value || 'correcao', modalIndexSource.value || '');
    });
  }
  if (editModalIndexSource) {
    editModalIndexSource.addEventListener('change', function(){
      const launchIndex = Number(editModalLaunchIndex && editModalLaunchIndex.value);
      const columnId = editModalColumnId ? editModalColumnId.value : '';
      const lancamento = state.lancamentos[launchIndex];
      const coluna = lancamento ? (lancamento.colunas || []).find(function(item){ return item && item.id === columnId; }) : null;
      const kind = coluna && coluna.indexKind ? coluna.indexKind : 'correcao';
      renderIndexSourceDropdownWithDelete(editModalIndexSource, kind, editModalIndexSource.value || '');
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
  if (btnExportIndexTemplateModal) btnExportIndexTemplateModal.addEventListener('click', exportIndexTablesCsvTemplate);
  if (btnImportIndexTableModal) btnImportIndexTableModal.addEventListener('click', function(){
    triggerIndexTablesCsvImport({
      onSuccess: function(){
        const latest = (state.indexTables || [])[state.indexTables.length - 1];
        const preferred = latest ? (CUSTOM_INDEX_SOURCE_PREFIX + latest.id) : '';
        refreshOpenIndexSourceSelectors(preferred);
      }
    });
  });
  if (btnCreateFixedIndexTableModal) btnCreateFixedIndexTableModal.addEventListener('click', function(){
    toggleFixedIndexGenerator(fixedIndexGeneratorWrap);
  });
  if (btnSubmitFixedIndexTableModal) btnSubmitFixedIndexTableModal.addEventListener('click', function(){
    upsertFixedIndexTable({
      name: fixedTableName ? fixedTableName.value : '',
      rate: fixedMonthlyRate ? fixedMonthlyRate.value : '',
      startMonth: fixedStartMonth ? fixedStartMonth.value : '',
      endMonth: fixedEndMonth ? fixedEndMonth.value : '',
      mode: fixedEntryMode ? fixedEntryMode.value : 'percent'
    });
  });
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
  if (btnExportIndexTemplateEdit) btnExportIndexTemplateEdit.addEventListener('click', exportIndexTablesCsvTemplate);
  if (btnImportIndexTableEdit) btnImportIndexTableEdit.addEventListener('click', function(){
    triggerIndexTablesCsvImport({
      onSuccess: function(){
        const latest = (state.indexTables || [])[state.indexTables.length - 1];
        const preferred = latest ? (CUSTOM_INDEX_SOURCE_PREFIX + latest.id) : '';
        refreshOpenIndexSourceSelectors(preferred);
      }
    });
  });
  if (btnCreateFixedIndexTableEdit) btnCreateFixedIndexTableEdit.addEventListener('click', function(){
    toggleFixedIndexGenerator(editFixedIndexGeneratorWrap);
  });
  if (btnSubmitFixedIndexTableEdit) btnSubmitFixedIndexTableEdit.addEventListener('click', function(){
    upsertFixedIndexTable({
      name: editFixedTableName ? editFixedTableName.value : '',
      rate: editFixedMonthlyRate ? editFixedMonthlyRate.value : '',
      startMonth: editFixedStartMonth ? editFixedStartMonth.value : '',
      endMonth: editFixedEndMonth ? editFixedEndMonth.value : '',
      mode: editFixedEntryMode ? editFixedEntryMode.value : 'percent'
    });
  });
  document.addEventListener('click', function(event){
    if (event.target && event.target.classList && event.target.classList.contains('js-index-source-delete')) {
      const select = event.target.parentNode ? event.target.parentNode.querySelector('select') : null;
      const source = select ? String(select.value || '') : '';
      const tableId = getCustomIndexTableIdFromSource(source);
      if (!tableId) return;
      const table = (state.indexTables || []).find(function(item){ return normalizeIndexTableId(item && item.id) === normalizeIndexTableId(tableId); });
      const label = table && table.name ? table.name : tableId;
      if (!confirm('Excluir a tabela personalizada "' + label + '"?')) return;
      if (removeCustomIndexTableById(tableId)) {
        persistAndRefresh();
        refreshOpenIndexSourceSelectors(defaultIndexSourceByKind('correcao'));
      }
      return;
    }
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
  if (editHonorarioModal) {
    editHonorarioModal.addEventListener('click', function(event){
      if (event.target === editHonorarioModal) closeEditHonorarioModal();
    });
  }
  if (editCustaModal) {
    editCustaModal.addEventListener('click', function(event){
      if (event.target === editCustaModal) closeEditCustaModal();
    });
  }

  document.addEventListener('keydown', function(event){
    if (event.key === 'Escape' && columnModal.classList.contains('open')) closeColumnModal();
    if (event.key === 'Escape' && editColumnModal.classList.contains('open')) closeEditColumnModal();
    if (event.key === 'Escape' && editLaunchModal.classList.contains('open')) closeEditLaunchModal();
    if (event.key === 'Escape' && editHonorarioModal && editHonorarioModal.classList.contains('open')) closeEditHonorarioModal();
    if (event.key === 'Escape' && editCustaModal && editCustaModal.classList.contains('open')) closeEditCustaModal();
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
    if (event.key === 'Enter' && editHonorarioModal && editHonorarioModal.classList.contains('open') && (event.target === editHonorarioTipo || event.target === editHonorarioOperacao || event.target === editHonorarioSeparate)) {
      event.preventDefault();
      saveEditHonorarioModal();
    }
    if (event.key === 'Enter' && editCustaModal && editCustaModal.classList.contains('open') && (event.target === editCustaOperacao || event.target === editCustaSeparate)) {
      event.preventDefault();
      saveEditCustaModal();
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
      const fieldId = field && field.id ? field.id : '';
      const shouldDebounceSave = FREE_TEXT_FIELD_IDS.has(fieldId) || field === fields.dataAtualizacao;
      if (shouldDebounceSave) {
        debounceByField(fieldId, FIELD_SAVE_DEBOUNCE_MS, function(){
          save(collect());
        });
      } else {
        save(collect());
      }
      if (field === fields.dataAtualizacao) scheduleDataAtualizacaoRefresh();
    });
    field.addEventListener('blur', function(){
      const fieldId = field && field.id ? field.id : '';
      clearTimeout(debouncedSaveTimers[fieldId]);
      delete debouncedSaveTimers[fieldId];
      save(collect());
      if (isReportTabActive()) renderReportDeferred();
    });
  });
  window.CPCiveisCompat = Object.assign({}, window.CPCiveisCompat || {}, {
    modules: civeisModules,
    collect: collect,
    fill: fill,
    save: save,
    load: load,
    getState: function(){ return state; }
  });
  const initial = load();
  fill(initial);
  state.lancamentos = normalizeLaunchListSafely(state.lancamentos);
  renderLaunches();
  renderSummaryPanel();
  safeBuildReport(collect(), { source: 'startup-initial-report' });
  if (isReportTabActive()) renderReportDeferred();
  setTimeout(function(){
    state.lancamentos.forEach(function(lancamento, index){
      if (!(launchNeedsIndexRefresh(lancamento) || !(lancamento.indexConfig && lancamento.indexConfig.lastAutoRefresh))) return;
      Promise.resolve().then(function(){ return updateIndicesForLaunch(index); }).catch(function(){ });
    });
  }, 0);
})();
