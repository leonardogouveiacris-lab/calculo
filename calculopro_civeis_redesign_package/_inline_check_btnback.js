

(function(){
  const STORAGE_KEY = 'cp_civeis_inicial_v5';
  const LEGACY_STORAGE_KEY = 'cp_civeis_inicial_v3';
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
    periodoFinal: $('periodoFinal')
  };
  const reportRoot = $('reportRoot');
  const launchesHost = $('launchesHost');
  const columnModal = $('columnModal');
  const modalLaunchIndex = $('modalLaunchIndex');
  const modalColumnType = $('modalColumnType');
  const modalColumnName = $('modalColumnName');
  const modalColumnFormula = $('modalColumnFormula');
  const formulaFieldWrap = $('formulaFieldWrap');
  const columnModalTitle = $('columnModalTitle');
  const columnModalSub = $('columnModalSub');
  const launchSelector = $('launchSelector');
  const editColumnModal = $('editColumnModal');
  const editModalLaunchIndex = $('editModalLaunchIndex');
  const editModalColumnId = $('editModalColumnId');
  const editModalColumnName = $('editModalColumnName');
  const editModalColumnFormula = $('editModalColumnFormula');
  const editFormulaFieldWrap = $('editFormulaFieldWrap');
  const editIndexFieldWrap = $('editIndexFieldWrap');
  const editModalIndexSource = $('editModalIndexSource');
  const editModalIndexStart = $('editModalIndexStart');
  const editModalIndexEnd = $('editModalIndexEnd');
  const editLaunchModal = $('editLaunchModal');
  const editLaunchIndex = $('editLaunchIndex');
  const editLaunchVerba = $('editLaunchVerba');
  const editLaunchDataInicial = $('editLaunchDataInicial');
  const editLaunchDataFinal = $('editLaunchDataFinal');
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
      { value:'jam_auto', label:'JAM/TR + 0,25% a.m.' }
    ]
  };
  const LOCKED_INDEX_COLUMNS = Object.freeze([
    { id:'correcao_monetaria', nome:'Correção Monetária', tipo:'indice', locked:true, formato:'indice', defaultSource:'ipca', configKey:'correcao' },
    { id:'juros', nome:'Juros', tipo:'indice', locked:true, formato:'indice', defaultSource:'selic', configKey:'juros' }
  ]);
  const DEFAULT_RESULT_COLUMNS = Object.freeze([
    { id:'valor_correcao', nome:'Valor da Correção', tipo:'formula', formato:'moeda', formula:'' },
    { id:'valor_juros', nome:'Valor dos Juros', tipo:'formula', formato:'moeda', formula:'' },
    { id:'valor_devido', nome:'Valor Devido', tipo:'formula', formato:'moeda', formula:'' }
  ]);
  let state = { lancamentos: [], lancamentoSelecionadoId: '' };

  function esc(value){
    return String(value || '').replace(/[&<>\"]/g, function(char){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[char] || char;
    });
  }

  function formatDateBR(value){
    if (!value) return '—';
    const parts = String(value).split('-');
    if (parts.length !== 3) return value;
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function parseBRNumber(value){
    if (value == null) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    let text = String(value).trim();
    if (!text) return 0;
    text = text.replace(/\s+/g, '');
    if (text.indexOf(',') >= 0){
      text = text.replace(/\./g, '').replace(',', '.');
    } else {
      const parts = text.split('.');
      if (parts.length > 2) text = parts.join('');
    }
    const number = Number(text);
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
  async function fetchSeries(code, startDateISO, endDateISO){ const all = []; let curStart = new Date(startDateISO + 'T00:00:00'); const endDate = new Date(endDateISO + 'T00:00:00'); while (curStart <= endDate){ const curEnd = new Date(curStart); curEnd.setFullYear(curEnd.getFullYear() + 9); if (curEnd > endDate) curEnd.setTime(endDate.getTime()); const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' + code + '/dados?formato=json&dataInicial=' + encodeURIComponent(toBR(curStart.toISOString().slice(0,10))) + '&dataFinal=' + encodeURIComponent(toBR(curEnd.toISOString().slice(0,10))); const part = await CPCommon.fetchJson(url, { timeoutMs: 15000 }); if (Array.isArray(part)) all.push.apply(all, part); curStart = new Date(curEnd); curStart.setDate(curStart.getDate() + 1); } return all; }
  function monthlyMapFromBCB(list){ const map = new Map(); (list || []).forEach(function(item){ const p = String(item.data || '').split('/'); if (p.length === 3) map.set(p[2] + '-' + p[1], parseBCBNumber(item.valor)); }); return map; }
  function dailyToMonthlyEffective(dailyList, seriesCode){ const byMonthFactor = new Map(); (dailyList || []).forEach(function(item){ const p = String(item.data || '').split('/'); if (p.length !== 3) return; const mk = p[2] + '-' + p[1]; const value = parseBCBNumber(item.valor); let dailyRate; if (String(seriesCode) === '4389' || String(seriesCode) === '11') dailyRate = value / 100; else return; byMonthFactor.set(mk, (byMonthFactor.get(mk) || 1) * (1 + dailyRate)); }); return Array.from(byMonthFactor.entries()).map(function(entry){ return { month: entry[0], value: (entry[1] - 1) * 100 }; }).sort(compareMonth); }
  function buildPoupancaMonthly(trList, metaSelicList){ const trMap = monthlyMapFromBCB(trList), metaMap = monthlyMapFromBCB(metaSelicList); return Array.from(new Set([].concat(Array.from(trMap.keys()), Array.from(metaMap.keys())))).sort().map(function(month){ const tr = trMap.get(month) || 0; const metaSelicAA = metaMap.get(month) || 0; const adicional = metaSelicAA > 8.5 ? 0.5 : 0.7 * (metaSelicAA / 12); return { month: month, value: tr + adicional }; }); }
  function buildJamMonthly(trList){ const trMap = monthlyMapFromBCB(trList); return Array.from(trMap.entries()).map(function(entry){ return { month: entry[0], value: entry[1] + 0.25 }; }).sort(compareMonth); }
  function previousMonthKey(monthKey){ const parts = String(monthKey || '').split('-'); if (parts.length !== 2) return ''; let year = Number(parts[0]); let month = Number(parts[1]) - 1; if (month < 1){ month = 12; year -= 1; } return String(year) + '-' + String(month).padStart(2, '0'); }
  function nextMonthKey(monthKey){ const parts = String(monthKey || '').split('-'); if (parts.length !== 2) return ''; let year = Number(parts[0]); let month = Number(parts[1]) + 1; if (month > 12){ month = 1; year += 1; } return String(year) + '-' + String(month).padStart(2, '0'); }
  function buildTaxaLegalMonthly(selicDailyList, ipca15List){ const selicMap = new Map(dailyToMonthlyEffective(selicDailyList, 11).map(function(item){ return [item.month, item.value]; })); const ipca15Map = monthlyMapFromBCB(ipca15List); const months = Array.from(new Set([].concat(Array.from(selicMap.keys()), Array.from(ipca15Map.keys())))).sort(); return months.map(function(baseMonth){ const refMonth = nextMonthKey(baseMonth); if (!refMonth || refMonth < '2024-09') return null; const percent = Math.max((Number(selicMap.get(baseMonth) || 0) - Number(ipca15Map.get(baseMonth) || 0)), 0); return { month: refMonth, value: percent }; }).filter(Boolean).sort(compareMonth); }
  function buildEc113Monthly(ipcaeList, selicDailyList){ const ipcaeMap = monthlyMapFromBCB(ipcaeList); const selicMap = new Map(dailyToMonthlyEffective(selicDailyList, 11).map(function(item){ return [item.month, item.value]; })); const months = Array.from(new Set([].concat(Array.from(ipcaeMap.keys()), Array.from(selicMap.keys())))).sort(); return months.map(function(month){ if (month <= '2021-11') return { month: month, value: Number(ipcaeMap.get(month) || 0) }; if (month >= '2021-12') return { month: month, value: Number(selicMap.get(month) || 0) }; return null; }).filter(Boolean).sort(compareMonth); }
  function sourceAccumulationMode(sourceType){ return sourceType === 'taxa_legal' ? 'simple' : 'compound'; }
  async function loadAutoIndices(sourceType, startDate, endDate){ if (!startDate || !endDate) return []; if (sourceType === 'none') return []; if (sourceType === 'ipca') return Array.from(monthlyMapFromBCB(await fetchSeries(433, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth); if (sourceType === 'ipcae') return Array.from(monthlyMapFromBCB(await fetchSeries(10764, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth); if (sourceType === 'inpc') return Array.from(monthlyMapFromBCB(await fetchSeries(188, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth); if (sourceType === 'igpm') return Array.from(monthlyMapFromBCB(await fetchSeries(189, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth); if (sourceType === 'igpdi') return Array.from(monthlyMapFromBCB(await fetchSeries(190, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth); if (sourceType === 'tr') return Array.from(monthlyMapFromBCB(await fetchSeries(7811, startDate, endDate)).entries()).map(function(entry){ return { month: entry[0], value: entry[1] }; }).sort(compareMonth); if (sourceType === 'cdi') return dailyToMonthlyEffective(await fetchSeries(4389, startDate, endDate), 4389); if (sourceType === 'selic') return dailyToMonthlyEffective(await fetchSeries(11, startDate, endDate), 11); if (sourceType === 'taxa_legal') { const taxaLegalStart = previousMonthKey(monthKeyFromISO(startDate)); const taxaLegalStartISO = taxaLegalStart ? (taxaLegalStart + '-01') : startDate; return buildTaxaLegalMonthly(await fetchSeries(11, taxaLegalStartISO, endDate), await fetchSeries(7478, taxaLegalStartISO, endDate)); } if (sourceType === 'ec113_2021') return buildEc113Monthly(await fetchSeries(10764, startDate, endDate), await fetchSeries(11, startDate, endDate)); if (sourceType === 'poupanca_auto') return buildPoupancaMonthly(await fetchSeries(7811, startDate, endDate), await fetchSeries(432, startDate, endDate)); if (sourceType === 'jam_auto') return buildJamMonthly(await fetchSeries(7811, startDate, endDate)); return []; }
  function formatPercent(value){ return formatNumberBR(value, 4, 6, true) + '%'; }
  function formatIndexFactor(value){
    return formatNumberBR(value, 7, 7, true);
  }

  function formatInputValueByColumn(coluna, value){
    if (coluna && coluna.formato === 'percentual') return formatNumberBR(value, 6, 6, true);
    return formatCurrencyBR(value);
  }
  function buildDefaultColumns(){
    const valor = { id:'valor', nome:'Valor', tipo:'manual' };
    const correcao = Object.assign({}, LOCKED_INDEX_COLUMNS[0]);
    const juros = Object.assign({}, LOCKED_INDEX_COLUMNS[1]);
    const baseCorrecao = [valor, correcao];
    const valorCorrecao = Object.assign({}, DEFAULT_RESULT_COLUMNS[0], { formula: defaultValorCorrecaoFormula({ colunas: baseCorrecao }) });
    const baseJuros = [valor, correcao, valorCorrecao, juros];
    const valorJuros = Object.assign({}, DEFAULT_RESULT_COLUMNS[1], { formula: defaultValorJurosFormula({ colunas: baseJuros }) });
    const baseFinal = [valor, correcao, valorCorrecao, juros, valorJuros];
    const valorDevido = Object.assign({}, DEFAULT_RESULT_COLUMNS[2], { formula: defaultValorDevidoFormula({ colunas: baseFinal }) });
    return [valor, correcao, valorCorrecao, juros, valorJuros, valorDevido];
  }
  function defaultIndexConfig(){ return { correcao: 'ipca', juros: 'selic', mode: 'factor_v9', limits:{} }; }

  function launchNeedsIndexRefresh(lancamento){
    return (lancamento.linhas || []).some(function(linha){
      const correcao = Number(linha.correcao_monetaria || 1);
      const juros = Number(linha.juros || 1);
      return !Number.isFinite(correcao) || !Number.isFinite(juros) || correcao <= 0 || juros <= 0 || correcao > 2 || juros > 2;
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

  function accumulateIndexFactor(monthMap, startMonthKey, endMonthKey, limit, mode){
    if (!startMonthKey || !endMonthKey || startMonthKey > endMonthKey) return 1;
    const accumulationMode = mode || 'compound';
    return monthRange(startMonthKey, endMonthKey).reduce(function(factor, monthKey){
      if (!isMonthWithinLimit(monthKey, limit)) return factor;
      const percent = Number(monthMap.get(monthKey) || 0);
      if (accumulationMode === 'simple') return factor + (percent / 100);
      return factor * (1 + percent / 100);
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
    return {
      requerente: fields.requerente.value.trim(),
      requerido: fields.requerido.value.trim(),
      processo: fields.processo.value.trim(),
      ajuizamento: fields.ajuizamento.value,
      dataAtualizacao: fields.dataAtualizacao.value || new Date().toISOString().slice(0,10),
      observacoes: fields.observacoes.value.trim(),
      lancamentos: state.lancamentos,
      lancamentoSelecionadoId: state.lancamentoSelecionadoId || '',
      atualizadoEm: new Date().toLocaleString('pt-BR')
    };
  }

  function fill(data){
    fields.requerente.value = data.requerente || '';
    fields.requerido.value = data.requerido || '';
    fields.processo.value = data.processo || '';
    fields.ajuizamento.value = data.ajuizamento || '';
    fields.dataAtualizacao.value = data.dataAtualizacao || new Date().toISOString().slice(0,10);
    fields.observacoes.value = data.observacoes || '';
    state.lancamentos = (Array.isArray(data.lancamentos) ? data.lancamentos : []).map(normalizeLaunch).map(recalculateLaunch);
    state.lancamentoSelecionadoId = data.lancamentoSelecionadoId || (state.lancamentos[0] ? state.lancamentos[0].id : '');
  }

  function save(data){
    if (window.CPCommon && CPCommon.storage) CPCommon.storage.save(STORAGE_KEY, data);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function load(){
    if (window.CPCommon && CPCommon.storage){
      const current = CPCommon.storage.load(STORAGE_KEY, null);
      if (current && Object.keys(current).length) return current;
      return CPCommon.storage.load(LEGACY_STORAGE_KEY, {});
    }
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (current && Object.keys(current).length) return current;
      return JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || '{}');
    } catch(e){ return {}; }
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

  function getColumnLetterById(lancamento, columnId){
    const idx = (lancamento.colunas || []).findIndex(function(item){ return item.id === columnId; });
    return idx >= 0 ? columnLetter(idx + 1) : '';
  }

  function defaultValorCorrecaoFormula(lancamento){
    const valor = getColumnLetterById(lancamento, 'valor') || 'B';
    const correcao = getColumnLetterById(lancamento, 'correcao_monetaria') || 'C';
    return '(' + valor + '*(' + correcao + '-1))';
  }

  function defaultValorJurosFormula(lancamento){
    const valor = getColumnLetterById(lancamento, 'valor') || 'B';
    const valorCorrecao = getColumnLetterById(lancamento, 'valor_correcao') || 'D';
    const juros = getColumnLetterById(lancamento, 'juros') || 'E';
    return '((' + valor + '+' + valorCorrecao + ')*(' + juros + '-1))';
  }

  function defaultValorDevidoFormula(lancamento){
    const valor = getColumnLetterById(lancamento, 'valor') || 'B';
    const valorCorrecao = getColumnLetterById(lancamento, 'valor_correcao') || 'D';
    const valorJuros = getColumnLetterById(lancamento, 'valor_juros') || 'F';
    return '(' + valor + '+' + valorCorrecao + '+' + valorJuros + ')';
  }

  function isLegacyValorDevidoFormula(formula){
    const normalized = String(formula || '').toUpperCase().replace(/\s+/g, '').replace(/X/g, '*');
    return normalized === '(B*C*D)' || normalized === '(B*C*E)' || normalized === '(B*D*E)' || normalized === '(B*CORRECAO_MONETARIA*JUROS)';
  }

  function getIndexLimit(config, key){
    const all = config && config.limits ? config.limits : {};
    const item = all && all[key] ? all[key] : {};
    return { start: item.start || '', end: item.end || '' };
  }

  function isMonthWithinLimit(monthKey, limit){
    if (!monthKey) return false;
    const current = Number(String(monthKey).replace('-', ''));
    const start = limit && limit.start ? Number(String(limit.start).slice(0,7).replace('-', '')) : null;
    const end = limit && limit.end ? Number(String(limit.end).slice(0,7).replace('-', '')) : null;
    if (start && current < start) return false;
    if (end && current > end) return false;
    return true;
  }

  function normalizeLaunch(lancamento){
    lancamento.indexConfig = Object.assign(defaultIndexConfig(), lancamento.indexConfig || {});
    if (!lancamento.indexConfig.limits) lancamento.indexConfig.limits = {};
    const existing = Array.isArray(lancamento.colunas) ? lancamento.colunas.slice() : [];
    const valor = existing.find(function(item){ return item && item.id === 'valor'; }) || { id:'valor', nome:'Valor', tipo:'manual' };
    const dynamic = existing.filter(function(item){ return item && item.id !== 'valor' && !LOCKED_INDEX_COLUMNS.some(function(lock){ return lock.id === item.id; }) && item.id !== 'valor_correcao' && item.id !== 'valor_juros' && item.id !== 'valor_devido'; });
    const correcaoBase = Object.assign({}, LOCKED_INDEX_COLUMNS[0], existing.find(function(item){ return item && item.id === 'correcao_monetaria'; }) || {}, { id:'correcao_monetaria', nome:'Correção Monetária', tipo:'indice', locked:true, formato:'indice', defaultSource:'ipca', configKey:'correcao' });
    const jurosBase = Object.assign({}, LOCKED_INDEX_COLUMNS[1], existing.find(function(item){ return item && item.id === 'juros'; }) || {}, { id:'juros', nome:'Juros', tipo:'indice', locked:true, formato:'indice', defaultSource:'selic', configKey:'juros' });

    const leadingCols = [Object.assign({ id:'valor', nome:'Valor', tipo:'manual' }, valor)].concat(dynamic);
    const valorCorrecaoAtual = existing.find(function(item){ return item && item.id === 'valor_correcao'; });
    const valorCorrecaoCol = Object.assign({
      id:'valor_correcao',
      nome:'Valor da Correção',
      tipo:'formula',
      formato:'moeda',
      formula: defaultValorCorrecaoFormula({ colunas: leadingCols.concat([correcaoBase]) })
    }, valorCorrecaoAtual || {}, {
      id:'valor_correcao',
      tipo:'formula',
      formato:'moeda',
      formula: (valorCorrecaoAtual && valorCorrecaoAtual.formula) || defaultValorCorrecaoFormula({ colunas: leadingCols.concat([correcaoBase]) })
    });

    const valorJurosAtual = existing.find(function(item){ return item && item.id === 'valor_juros'; });
    const valorJurosCol = Object.assign({
      id:'valor_juros',
      nome:'Valor dos Juros',
      tipo:'formula',
      formato:'moeda',
      formula: defaultValorJurosFormula({ colunas: leadingCols.concat([correcaoBase, valorCorrecaoCol, jurosBase]) })
    }, valorJurosAtual || {}, {
      id:'valor_juros',
      tipo:'formula',
      formato:'moeda',
      formula: (valorJurosAtual && valorJurosAtual.formula) || defaultValorJurosFormula({ colunas: leadingCols.concat([correcaoBase, valorCorrecaoCol, jurosBase]) })
    });

    const valorDevidoAtual = existing.find(function(item){ return item && item.id === 'valor_devido'; });
    const valorDevidoDefaultFormula = defaultValorDevidoFormula({ colunas: leadingCols.concat([correcaoBase, valorCorrecaoCol, jurosBase, valorJurosCol]) });
    const valorDevidoFormula = (valorDevidoAtual && valorDevidoAtual.formula && !isLegacyValorDevidoFormula(valorDevidoAtual.formula))
      ? valorDevidoAtual.formula
      : valorDevidoDefaultFormula;
    const valorDevidoCol = Object.assign({
      id:'valor_devido',
      nome:'Valor Devido',
      tipo:'formula',
      formato:'moeda',
      formula: valorDevidoDefaultFormula
    }, valorDevidoAtual || {}, {
      id:'valor_devido',
      tipo:'formula',
      formato:'moeda',
      formula: valorDevidoFormula
    });

    lancamento.colunas = leadingCols.concat([correcaoBase, valorCorrecaoCol, jurosBase, valorJurosCol, valorDevidoCol]);
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
        ['correcao_monetaria','juros'].forEach(function(key){
          const raw = Number(String(linha[key] === undefined ? '' : linha[key]).replace(',', '.'));
          linha[key] = Number.isFinite(raw) ? (raw === 0 ? 1 : Number((1 + raw / 100).toFixed(7))) : 1;
        });
      });
      lancamento.indexConfig.mode = 'factor_v9';
    }
    return lancamento;
  }

  function getNumericValue(linha, colunaId){
    const raw = colunaId === 'valor' ? linha.valor : linha[colunaId];
    const num = Number(String(raw === undefined ? '' : raw).replace(',', '.'));
    return Number.isFinite(num) ? num : 0;
  }

  function evaluateFormula(formula, valuesByLetter){
    const expression = String(formula || '').toUpperCase().replace(/\s+/g, '').replace(/X/g, '*').replace(/,/g, '.').replace(/([A-Z]+)/g, function(match){
      return Object.prototype.hasOwnProperty.call(valuesByLetter, match) ? '(' + valuesByLetter[match] + ')' : '(0)';
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
      const valuesByLetter = { A: 0 };
      lancamento.colunas.forEach(function(coluna, idx){
        const letter = columnLetter(idx + 1);
        const key = coluna.id || (idx === 0 ? 'valor' : 'col_' + idx);
        if (coluna.tipo === 'formula') {
          linha[key] = evaluateFormula(coluna.formula, valuesByLetter);
        }
        const rawValue = key === 'valor' ? linha.valor : linha[key];
        const numericValue = Number(String(rawValue === undefined ? '' : rawValue).replace(',', '.'));
        valuesByLetter[letter] = Number.isFinite(numericValue) ? numericValue : 0;
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
    editModalColumnName.readOnly = coluna.tipo === 'indice';
    editModalColumnName.placeholder = coluna.tipo === 'indice' ? 'Nome fixo da coluna padrão' : 'Ex.: Índice, Percentual, Resultado';
    if (coluna.id === 'valor_devido' && !editModalColumnFormula.value) editModalColumnFormula.value = coluna.formula || defaultValorDevidoFormula(lancamento);
    if (coluna.tipo === 'indice') {
      const opts = INDEX_SOURCE_OPTIONS[coluna.configKey || 'correcao'] || [];
      const current = lancamento.indexConfig && lancamento.indexConfig[coluna.configKey || 'correcao'] || coluna.defaultSource || '';
      editModalIndexSource.innerHTML = opts.map(function(opt){ return '<option value="' + esc(opt.value) + '"' + (opt.value === current ? ' selected' : '') + '>' + esc(opt.label) + '</option>'; }).join('');
      const limit = getIndexLimit(lancamento.indexConfig || {}, coluna.configKey || 'correcao');
      editModalIndexStart.value = limit.start || '';
      editModalIndexEnd.value = limit.end || '';
    } else {
      editModalIndexSource.innerHTML = '';
      editModalIndexStart.value = '';
      editModalIndexEnd.value = '';
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
    editFormulaFieldWrap.style.display = 'none';
    editIndexFieldWrap.style.display = 'none';
    editModalIndexSource.innerHTML = '';
    editModalIndexStart.value = '';
    editModalIndexEnd.value = '';
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
      lancamento.indexConfig = Object.assign(defaultIndexConfig(), lancamento.indexConfig || {});
      if (!lancamento.indexConfig.limits) lancamento.indexConfig.limits = {};
      if (editModalIndexStart.value && editModalIndexEnd.value && editModalIndexStart.value > editModalIndexEnd.value) {
        alert('A data inicial do limite não pode ser maior que a data final.');
        editModalIndexEnd.focus();
        return;
      }
      lancamento.indexConfig[coluna.configKey || 'correcao'] = editModalIndexSource.value || coluna.defaultSource || '';
      lancamento.indexConfig.limits[coluna.configKey || 'correcao'] = { start: editModalIndexStart.value || '', end: editModalIndexEnd.value || '' };
      closeEditColumnModal();
      persistAndRefresh();
      updateIndicesForLaunch(launchIndex);
      return;
    }
    if (!nome){ alert('Informe o nome da coluna.'); editModalColumnName.focus(); return; }
    if (coluna.tipo === 'formula' && !formula){ alert('Informe a fórmula da coluna.'); editModalColumnFormula.focus(); return; }
    coluna.nome = nome;
    if (coluna.tipo === 'formula') coluna.formula = formula;
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
    if (coluna.id === 'valor' || coluna.id === 'valor_correcao' || coluna.id === 'valor_juros' || coluna.id === 'valor_devido' || coluna.locked){ alert('Esta coluna é obrigatória e não pode ser removida.'); return; }
    lancamento.colunas.splice(pos, 1);
    lancamento.linhas.forEach(function(linha){ delete linha[columnId]; });
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
  }

  async function saveEditLaunchModal(){
    const launchIndex = Number(editLaunchIndex.value);
    const lancamento = state.lancamentos[launchIndex];
    if (!lancamento) return closeEditLaunchModal();
    const verba = editLaunchVerba.value.trim();
    const dataInicial = editLaunchDataInicial.value;
    const dataFinal = editLaunchDataFinal.value;
    if (!verba){ alert('Informe o nome da verba.'); editLaunchVerba.focus(); return; }
    if (!dataInicial){ alert('Informe a data inicial do cálculo.'); editLaunchDataInicial.focus(); return; }
    if (!dataFinal){ alert('Informe a data final do cálculo.'); editLaunchDataFinal.focus(); return; }
    if (dataInicial > dataFinal){ alert('A data inicial não pode ser maior que a data final.'); editLaunchDataFinal.focus(); return; }
    lancamento.verba = verba;
    const mudouPeriodo = lancamento.dataInicial !== dataInicial || lancamento.dataFinal !== dataFinal;
    lancamento.dataInicial = dataInicial;
    lancamento.dataFinal = dataFinal;
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
    const isFormula = tipo === 'formula';
    columnModalTitle.textContent = isFormula ? 'Nova coluna com fórmula' : 'Nova coluna manual';
    columnModalSub.textContent = isFormula ? 'Crie uma coluna calculada com base nas letras das colunas já existentes.' : 'Crie uma coluna manual adicional para preenchimento linha a linha.';
    formulaFieldWrap.style.display = isFormula ? 'block' : 'none';
    columnModal.classList.add('open');
    columnModal.setAttribute('aria-hidden', 'false');
    setTimeout(function(){ modalColumnName.focus(); }, 30);
  }

  function closeColumnModal(){
    columnModal.classList.remove('open');
    columnModal.setAttribute('aria-hidden', 'true');
    modalLaunchIndex.value = '';
    modalColumnType.value = '';
    modalColumnName.value = '';
    modalColumnFormula.value = '';
  }

  function saveColumnFromModal(){
    const launchIndex = Number(modalLaunchIndex.value);
    const tipo = modalColumnType.value;
    const nome = modalColumnName.value.trim();
    const formula = modalColumnFormula.value.trim();
    if (!state.lancamentos[launchIndex]) return closeColumnModal();
    if (!nome){ alert('Informe o nome da coluna.'); modalColumnName.focus(); return; }
    if (tipo === 'formula' && !formula){ alert('Informe a fórmula da coluna.'); modalColumnFormula.focus(); return; }
    const lancamento = state.lancamentos[launchIndex];
    const id = 'col_' + Date.now() + '_' + Math.random().toString(16).slice(2, 6);
    if (tipo === 'formula') lancamento.colunas.push({ id: id, nome: nome, tipo: 'formula', formula: formula });
    else lancamento.colunas.push({ id: id, nome: nome, tipo: 'manual' });
    lancamento.linhas.forEach(function(linha){ linha[id] = ''; });
    recalculateLaunch(lancamento);
    closeColumnModal();
    persistAndRefresh();
  }

  function renderLaunches(){
    state.lancamentos = state.lancamentos.map(normalizeLaunch).map(recalculateLaunch);
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
    const headCols = ['<th class="col-data">Data</th>'].concat(lancamento.colunas.map(function(coluna, idx){
      const metaHtml = '<div class="th-col-meta"><span>' + esc(columnTitle(coluna, idx)) + '</span>' + (coluna.tipo === 'formula' ? '<span style="font-size:10px;color:#98a2b3">' + esc(coluna.formula || '') + '</span>' : '') + (coluna.tipo === 'indice' ? '<span style="font-size:10px;color:#98a2b3">Índice em fator mensal</span>' : '') + '</div>'; 
      let actions = '<div class="th-col-actions">';
      if (coluna.tipo === 'indice') actions += '<button type="button" class="th-icon-btn btnEditColumn" data-launch-index="' + index + '" data-column-id="' + esc(coluna.id) + '" title="Editar coluna">✎</button>';
      else {
        actions += '<button type="button" class="th-icon-btn btnEditColumn" data-launch-index="' + index + '" data-column-id="' + esc(coluna.id) + '" title="Editar coluna">✎</button>';
        if (coluna.id !== 'valor' && coluna.id !== 'valor_correcao' && coluna.id !== 'valor_juros' && coluna.id !== 'valor_devido') actions += '<button type="button" class="th-icon-btn danger btnDeleteColumn" data-launch-index="' + index + '" data-column-id="' + esc(coluna.id) + '" title="Remover coluna">×</button>';
      }
      actions += '</div>';
      return '<th><div class="th-col-head">' + metaHtml + actions + '</div></th>';
    })).join('');
    const rows = lancamento.linhas.map(function(linha, rowIndex){
      const valueCells = lancamento.colunas.map(function(coluna){
        const key = coluna.id === 'valor' ? 'valor' : coluna.id;
        const value = key === 'valor' ? linha.valor : linha[key];
        if (coluna.tipo === 'formula') return '<td><input type="text" readonly value="' + esc(formatInputValueByColumn(coluna, value)) + '" placeholder="Calculado automaticamente"></td>';
        if (coluna.tipo === 'indice') return '<td><input type="text" readonly value="' + esc(formatIndexFactor(value || 1)) + '" placeholder="1,0000000"></td>';
        return '<td><input type="text" inputmode="decimal" data-launch-index="' + index + '" data-row-index="' + rowIndex + '" data-column-id="' + esc(key) + '" class="valor-input" value="' + esc(formatInputValueByColumn(coluna, value)) + '" placeholder="0,00"></td>';
      }).join('');
      return '<tr><td>' + esc(linha.periodo) + '</td>' + valueCells + '</tr>';
    }).join('');
    const badges = ['<span class="mini-badge">A = Data</span>'].concat(lancamento.colunas.map(function(coluna, idx){
      return '<span class="mini-badge">' + esc(columnTitle(coluna, idx)) + (coluna.tipo === 'formula' ? ' [' + esc(coluna.formula || '') + ']' : '') + '</span>';
    })).join('');
    const correcaoValue = esc(lancamento.indexConfig && lancamento.indexConfig.correcao || 'ipca');
    const jurosValue = esc(lancamento.indexConfig && lancamento.indexConfig.juros || 'selic');
    const correcaoOptions = INDEX_SOURCE_OPTIONS.correcao.map(function(opt){ return '<option value="' + esc(opt.value) + '"' + (opt.value === correcaoValue ? ' selected' : '') + '>' + esc(opt.label) + '</option>'; }).join('');
    const jurosOptions = INDEX_SOURCE_OPTIONS.juros.map(function(opt){ return '<option value="' + esc(opt.value) + '"' + (opt.value === jurosValue ? ' selected' : '') + '>' + esc(opt.label) + '</option>'; }).join('');
    launchesHost.innerHTML = '' +
      '<div class="launch-card">' +
        '<div class="launch-head">' +
          '<div>' +
            '<div class="launch-title">' + esc(lancamento.verba) + '</div>' +
            '<div class="launch-sub">Período: ' + esc(formatDateBR(lancamento.dataInicial)) + ' até ' + esc(formatDateBR(lancamento.dataFinal)) + ' — ' + lancamento.linhas.length + ' competência(s)</div>' +
          '</div>' +
        '</div>' +
        '<div class="index-config">' +
          '<div class="cfg-col"><label>Fonte da correção monetária</label><select class="select launchIndexSource" data-launch-index="' + index + '" data-kind="correcao">' + correcaoOptions + '</select></div>' +
          '<div class="cfg-col"><label>Fonte dos juros</label><select class="select launchIndexSource" data-launch-index="' + index + '" data-kind="juros">' + jurosOptions + '</select></div>' +
          '<div class="cfg-col action"><button type="button" class="btn btnFetchIndices" data-launch-index="' + index + '">Atualizar índices</button></div>' +
        '</div>' +
        '<div class="inline-tools">' +
          '<button type="button" class="btn btnAddManualCol" data-launch-index="' + index + '">Adicionar coluna manual</button>' +
          '<button type="button" class="btn btnAddFormulaCol" data-launch-index="' + index + '">Adicionar coluna fórmula</button>' +
        '</div>' +
        '<div>' + badges + '</div>' +
        '<div class="formula-note">Nas fórmulas, use as letras das colunas. Ex.: (B+C), (BxD), (B+C-D) ou ((B+C)*D). As colunas padrão iniciam com estas fórmulas: Valor da Correção = ' + esc(defaultValorCorrecaoFormula(lancamento)) + '; Valor dos Juros = ' + esc(defaultValorJurosFormula(lancamento)) + '; Valor Devido = ' + esc(defaultValorDevidoFormula(lancamento)) + '.</div>' +
        '<div class="readonly-note">Correção Monetária e Juros usam séries do BACEN/SGS e são acumulados da competência até a data de atualização do cálculo. Estão disponíveis fontes adicionais como IPCA-E, TR, Taxa Legal e EC 113/2021. Se usar EC 113/2021 na correção, o recomendado é deixar os juros como Sem juros para evitar dupla contagem após 12/2021. As colunas Valor da Correção, Valor dos Juros e Valor Devido permanecem obrigatórias no final da tabela, mas agora podem ter nome e fórmula alterados.</div>' +
        '<div class="table-wrap"><table class="editor-table"><thead><tr>' + headCols + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '</div>';
  }

  function getColumnById(lancamento, colunaId){
    return (lancamento.colunas || []).find(function(item){ return item.id === colunaId; }) || null;
  }

  async function updateIndicesForLaunch(launchIndex){
    const lancamento = state.lancamentos[launchIndex];
    if (!lancamento) return;
    normalizeLaunch(lancamento);
    const config = Object.assign(defaultIndexConfig(), lancamento.indexConfig || {});
    const dataAtualizacao = fields.dataAtualizacao.value || new Date().toISOString().slice(0,10);
    const mesAtualizacao = monthKeyFromISO(dataAtualizacao);
    if (!mesAtualizacao){
      alert('Informe a data de atualização do cálculo.');
      return;
    }
    try {
      const correcaoList = await loadAutoIndices(config.correcao, lancamento.dataInicial, dataAtualizacao);
      const jurosList = await loadAutoIndices(config.juros, lancamento.dataInicial, dataAtualizacao);
      const correcaoMap = new Map(correcaoList.map(function(item){ return [item.month, item.value]; }));
      const jurosMap = new Map(jurosList.map(function(item){ return [item.month, item.value]; }));
      const correcaoLimit = getIndexLimit(config, 'correcao');
      const jurosLimit = getIndexLimit(config, 'juros');
      const correcaoMode = sourceAccumulationMode(config.correcao);
      const jurosMode = sourceAccumulationMode(config.juros);
      lancamento.linhas.forEach(function(linha){
        const mesCompetencia = monthKeyFromPeriodo(linha.periodo);
        linha.correcao_monetaria = Number(accumulateIndexFactor(correcaoMap, mesCompetencia, mesAtualizacao, correcaoLimit, correcaoMode).toFixed(7));
        linha.juros = Number(accumulateIndexFactor(jurosMap, mesCompetencia, mesAtualizacao, jurosLimit, jurosMode).toFixed(7));
      });
      lancamento.indexConfig.lastAutoRefresh = new Date().toISOString();
      recalculateLaunch(lancamento);
      persistAndRefresh();
    } catch (error) {
      alert('Não foi possível buscar os índices automáticos: ' + (error.message || 'erro inesperado.'));
    }
  }

  function displayColumnValue(coluna, valor){
    if (coluna && coluna.formato === 'percentual') return valor === '' || valor == null ? '—' : formatPercent(valor || 0);
    if (coluna && coluna.formato === 'indice') return valor === '' || valor == null ? '—' : formatIndexFactor(valor || 1);
    if (typeof valor === 'number') return formatCurrencyBR(valor || 0);
    if (valor !== '' && valor != null && !Number.isNaN(parseBRNumber(valor))) return formatCurrencyBR(valor || 0);
    return String(valor || '');
  }

  function totalLancamento(lancamento, colunaId){
    const alvo = colunaId || 'valor';
    return lancamento.linhas.reduce(function(total, linha){
      return total + getNumericValue(linha, alvo);
    }, 0);
  }

  
  function buildReport(data){
    const branding = {
      header: { nome:'Leonardo G. Cristiano', tel:'(14) 99606-7654', email:'suporte@calculopro.com.br' },
      footer: { l1:'R. Mário Gonzaga Junqueira, 25-80', l2:'Jardim Viaduto, Bauru - SP, 17055-210', site:'www.calculopro.com.br', emp:'CalculoPro Ltda. 51.540.075/0001-04' }
    };

    const resumoIdentificacao = '' +
      '<div class="sec-title">Identificação do cálculo</div>' +
      '<div class="kv-grid">' +
        '<div class="kv-item"><div class="kv-label">Requerente</div><div class="kv-value">' + esc(data.requerente || '—') + '</div></div>' +
        '<div class="kv-item"><div class="kv-label">Requerido</div><div class="kv-value">' + esc(data.requerido || '—') + '</div></div>' +
        '<div class="kv-item"><div class="kv-label">Número do processo</div><div class="kv-value">' + esc(data.processo || '—') + '</div></div>' +
        '<div class="kv-item"><div class="kv-label">Data do ajuizamento</div><div class="kv-value">' + esc(formatDateBR(data.ajuizamento)) + '</div></div>' +
        '<div class="kv-item full"><div class="kv-label">Observações iniciais</div><div class="kv-value">' + esc(data.observacoes || 'Sem observações iniciais registradas.') + '</div></div>' +
      '</div>';

    const resumoControle = '' +
      '<div class="sec-title">Controle do módulo</div>' +
      '<table class="report-table"><tbody>' +
        '<tr><td class="bold" style="width:34%">Ferramenta</td><td>Cálculos Cíveis</td></tr>' +
        '<tr><td class="bold">Finalidade</td><td>Lançamentos mensais por verba em tabelas individualizadas.</td></tr>' +
        '<tr><td class="bold">Quantidade de verbas</td><td>' + String(data.lancamentos.length) + '</td></tr>' +
        '<tr><td class="bold">Data-base de atualização</td><td>' + esc(formatDateBR(data.dataAtualizacao)) + '</td></tr>' +
        '<tr><td class="bold">Última atualização do relatório</td><td>' + esc(data.atualizadoEm || '—') + '</td></tr>' +
      '</tbody></table>';

    function createCivilPage(pageIndex, includeTitle){
      return CPPrintLayout.createPage(reportRoot, {
        pageIndex: pageIndex,
        title: 'RELATÓRIO INICIAL — CÁLCULOS CÍVEIS',
        meta: 'Estrutura inicial do módulo cível no sistema CalculoPro',
        includeTitle: includeTitle,
        contentHtml: '',
        header: branding.header,
        footer: branding.footer
      });
    }

    function contentBottomUsed(page){
      if (window.CPPrintLayout && typeof CPPrintLayout.pageContentBottom === 'function') {
        return CPPrintLayout.pageContentBottom(page);
      }
      const content = page && page.querySelector ? page.querySelector('.content') : null;
      if (!content) return 0;
      let max = 0;
      Array.from(content.children || []).forEach(function(node){
        if (!(node instanceof HTMLElement)) return;
        const style = window.getComputedStyle ? window.getComputedStyle(node) : null;
        const marginBottom = style ? (parseFloat(style.marginBottom || '0') || 0) : 0;
        max = Math.max(max, node.offsetTop + node.offsetHeight + marginBottom);
      });
      return max;
    }

    function contentLimit(page){
      if (window.CPPrintLayout && typeof CPPrintLayout.pageContentLimit === 'function') {
        return CPPrintLayout.pageContentLimit(page, '.footer', 10);
      }
      const content = page && page.querySelector ? page.querySelector('.content') : null;
      const footer = page && page.querySelector ? page.querySelector('.footer') : null;
      if (!content) return 0;
      if (!footer) return Math.max(0, content.clientHeight - 10);
      return Math.max(0, footer.offsetTop - content.offsetTop - 10);
    }

    function fitsInPage(page){
      if (window.CPPrintLayout && typeof CPPrintLayout.pageContentFits === 'function') {
        return CPPrintLayout.pageContentFits(page, '.footer', 10);
      }
      return contentBottomUsed(page) <= contentLimit(page);
    }

    function appendHtml(page, html){
      const content = page.querySelector('.content');
      const probe = document.createElement('div');
      probe.innerHTML = html;
      Array.from(probe.childNodes).forEach(function(node){ content.appendChild(node); });
      return true;
    }

    function appendHtmlIfFits(page, html){
      const content = page.querySelector('.content');
      const probe = document.createElement('div');
      probe.innerHTML = html;
      const nodes = Array.from(probe.childNodes);
      nodes.forEach(function(node){ content.appendChild(node); });
      void content.offsetHeight;
      if (fitsInPage(page)) return true;
      nodes.forEach(function(node){
        if (node.parentNode === content) content.removeChild(node);
      });
      return false;
    }

    function measureRowsFit(page, piece, startIndex, continuation){
      const content = page.querySelector('.content');
      if (!content) return 1;

      const remaining = Math.max(0, contentLimit(page) - contentBottomUsed(page));

      const measure = document.createElement('div');
      measure.style.position = 'absolute';
      measure.style.visibility = 'hidden';
      measure.style.pointerEvents = 'none';
      measure.style.left = '-99999px';
      measure.style.top = '0';
      measure.style.width = content.clientWidth + 'px';
      content.appendChild(measure);

      measure.innerHTML = piece.buildChunk([piece.rows[startIndex]], continuation, false);
      const table = measure.querySelector('table');
      const row = measure.querySelector('tbody tr');

      if ((measure.offsetHeight || 0) > remaining) {
        content.removeChild(measure);
        return 0;
      }

      const oneRowHeight = row ? row.offsetHeight : 24;
      const chromeHeight = Math.max(0, (measure.offsetHeight || 0) - oneRowHeight);

      let rowsFit = Math.floor((remaining - chromeHeight) / Math.max(oneRowHeight, 1));
      if (!Number.isFinite(rowsFit) || rowsFit < 1) rowsFit = 1;

      rowsFit = Math.min(rowsFit, piece.rows.length - startIndex);

      // refine downward until it really fits
      while (rowsFit > 1) {
        const includeTotal = (startIndex + rowsFit - 1 === piece.rows.length - 1);
        measure.innerHTML = piece.buildChunk(piece.rows.slice(startIndex, startIndex + rowsFit), continuation, includeTotal);
        if (measure.offsetHeight <= remaining) break;
        rowsFit -= 1;
      }

      // refine upward if there is room
      while (startIndex + rowsFit < piece.rows.length) {
        const includeTotal = (startIndex + rowsFit === piece.rows.length - 1);
        measure.innerHTML = piece.buildChunk(piece.rows.slice(startIndex, startIndex + rowsFit + 1), continuation, includeTotal);
        if (measure.offsetHeight <= remaining) rowsFit += 1;
        else break;
      }

      content.removeChild(measure);
      return Math.max(1, rowsFit);
    }

    function appendLaunchChunk(page, piece, startIndex, continuation){
      const rowsFit = measureRowsFit(page, piece, startIndex, continuation);
      if (!rowsFit) return 0;
      const includeTotal = (startIndex + rowsFit - 1 === piece.rows.length - 1);
      appendHtml(page, piece.buildChunk(piece.rows.slice(startIndex, startIndex + rowsFit), continuation, includeTotal));
      return rowsFit;
    }

    function launchPieces(lancamento){
      normalizeLaunch(lancamento);
      recalculateLaunch(lancamento);

      const launchTitle = esc(lancamento.verba);
      const headers = ['<th class="col-data">Data</th>'].concat(lancamento.colunas.map(function(coluna, idx){
        return '<th>' + esc(columnTitle(coluna, idx) + (coluna.tipo === 'formula' ? ' (' + (coluna.formula || '') + ')' : '')) + '</th>';
      })).join('');

      const rowHtml = lancamento.linhas.map(function(linha){
        const cols = lancamento.colunas.map(function(coluna){
          const valor = coluna.id === 'valor' ? linha.valor : linha[coluna.id];
          const exibicao = displayColumnValue(coluna, valor);
          return '<td class="right">' + esc(exibicao || '—') + '</td>';
        }).join('');
        return '<tr><td class="center">' + esc(linha.periodo) + '</td>' + cols + '</tr>';
      });

      const totalCells = lancamento.colunas.map(function(coluna){
        if (coluna.formato === 'percentual' || coluna.formato === 'indice') return '<td class="bold right">—</td>';
        return '<td class="bold right">' + esc(formatCurrencyBR(totalLancamento(lancamento, coluna.id === 'valor' ? 'valor' : coluna.id))) + '</td>';
      }).join('');

      function buildChunk(rows, isContinuation, includeTotal){
        return '' +
          '<div class="report-launch">' +
            '<h3>' + launchTitle + (isContinuation ? ' <span class="meta">(continuação)</span>' : '') + '</h3>' +
            '<table class="report-table report-launch-table">' +
              '<thead><tr>' + headers + '</tr></thead>' +
              '<tbody>' + rows.join('') + '</tbody>' +
              (includeTotal ? '<tfoot><tr><td class="bold right">Total da verba</td>' + totalCells + '</tr></tfoot>' : '') +
            '</table>' +
          '</div>';
      }

      return {
        title: launchTitle,
        rows: rowHtml,
        buildChunk: buildChunk
      };
    }

    reportRoot.innerHTML = '';

    let pageIndex = 1;
    let currentPage = createCivilPage(pageIndex, true);

    appendHtml(currentPage, resumoIdentificacao);
    appendHtml(currentPage, resumoControle);
    appendHtml(currentPage, '<div class="sec-title">Lançamentos por verba</div>');

    if (!data.lancamentos.length) {
      appendHtml(currentPage, '<table class="report-table report-launch-table"><tbody><tr><td>Nenhuma verba lançada até o momento.</td></tr></tbody></table>');
    } else {
      data.lancamentos.forEach(function(lancamento){
        const piece = launchPieces(lancamento);
        let cursor = 0;
        let continuation = false;

        while (cursor < piece.rows.length) {
          const pageContent = currentPage && currentPage.querySelector ? currentPage.querySelector('.content') : null;
          const hasContent = !!(pageContent && pageContent.children && pageContent.children.length);

          // If current page is already crowded, move continuation to a fresh page.
          if (hasContent && !fitsInPage(currentPage)) {
            currentPage = createCivilPage(++pageIndex, false);
          }

          const usedRows = appendLaunchChunk(currentPage, piece, cursor, continuation);
          if (!usedRows) {
            if (!hasContent) {
              const includeTotal = (cursor === piece.rows.length - 1);
              appendHtml(currentPage, piece.buildChunk([piece.rows[cursor]], continuation, includeTotal));
              cursor += 1;
              continuation = cursor < piece.rows.length;
              if (cursor < piece.rows.length) currentPage = createCivilPage(++pageIndex, false);
              continue;
            }
            currentPage = createCivilPage(++pageIndex, false);
            continue;
          }
          cursor += usedRows;
          continuation = cursor < piece.rows.length;

          if (cursor < piece.rows.length) {
            currentPage = createCivilPage(++pageIndex, false);
          }
        }
      });
    }

    CPPrintLayout.applyReportBranding(reportRoot, {
      header: branding.header,
      footer: branding.footer
    });
  }


  let reportRenderQueued = false;
  let reportRenderCallbacks = [];

  function renderReportDeferred(callback){
    if (typeof callback === 'function') reportRenderCallbacks.push(callback);
    if (reportRenderQueued) return;
    reportRenderQueued = true;
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        buildReport(collect());
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


  function persistAndRefresh(){
    const data = collect();
    save(data);
    renderLaunches();
    restorePendingGridFocus();
    buildReport(data);
  }

  function clearLaunchForm(){
    fields.novaVerba.value = '';
    fields.periodoInicial.value = '';
    fields.periodoFinal.value = '';
  }

  $('btnCriarLancamento').addEventListener('click', async function(){
    const verba = fields.novaVerba.value.trim();
    const dataInicial = fields.periodoInicial.value;
    const dataFinal = fields.periodoFinal.value;
    if (!verba){ alert('Informe o nome da verba.'); fields.novaVerba.focus(); return; }
    if (!dataInicial){ alert('Informe a data inicial do cálculo.'); fields.periodoInicial.focus(); return; }
    if (!dataFinal){ alert('Informe a data final do cálculo.'); fields.periodoFinal.focus(); return; }
    if (dataInicial > dataFinal){ alert('A data inicial não pode ser maior que a data final.'); fields.periodoFinal.focus(); return; }
    state.lancamentos.push({
      id: 'lanc_' + Date.now() + '_' + Math.random().toString(16).slice(2),
      verba: verba,
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
    target.select();
  });

  launchesHost.addEventListener('click', function(event){
    const target = event.target;
    const launchIndex = Number(target.getAttribute('data-launch-index'));
    if (!state.lancamentos[launchIndex]) return;
    if (target.classList.contains('btnAddManualCol')){
      openColumnModal(launchIndex, 'manual');
      return;
    }
    if (target.classList.contains('btnAddFormulaCol')){
      openColumnModal(launchIndex, 'formula');
      return;
    }
    if (target.classList.contains('btnFetchIndices')){
      updateIndicesForLaunch(launchIndex);
      return;
    }
    if (target.classList.contains('btnEditColumn')){
      openEditColumnModal(launchIndex, target.getAttribute('data-column-id') || '');
      return;
    }
    if (target.classList.contains('btnDeleteColumn')){
      removeColumn(launchIndex, target.getAttribute('data-column-id') || '');
    }
  });

  launchesHost.addEventListener('change', function(event){
    const target = event.target;
    if (!target.classList.contains('launchIndexSource')) return;
    const launchIndex = Number(target.getAttribute('data-launch-index'));
    const kind = target.getAttribute('data-kind') || '';
    if (!state.lancamentos[launchIndex] || !kind) return;
    state.lancamentos[launchIndex].indexConfig = Object.assign(defaultIndexConfig(), state.lancamentos[launchIndex].indexConfig || {});
    state.lancamentos[launchIndex].indexConfig[kind] = target.value;
    save(collect());
  });

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
    persistAndRefresh();
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
    if (event.key === 'Enter' && columnModal.classList.contains('open') && (event.target === modalColumnName || event.target === modalColumnFormula)) {
      event.preventDefault();
      saveColumnFromModal();
    }
    if (event.key === 'Enter' && editColumnModal.classList.contains('open') && (event.target === editModalColumnName || event.target === editModalColumnFormula || event.target === editModalIndexSource || event.target === editModalIndexStart || event.target === editModalIndexEnd)) {
      event.preventDefault();
      saveEditColumnModal();
    }
    if (event.key === 'Enter' && editLaunchModal.classList.contains('open') && (event.target === editLaunchVerba || event.target === editLaunchDataInicial || event.target === editLaunchDataFinal)) {
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
  state.lancamentos = state.lancamentos.map(normalizeLaunch).map(recalculateLaunch);
  renderLaunches();
  buildReport(collect());
  if ($('tab-report') && $('tab-report').classList.contains('active')) renderReportDeferred();
  state.lancamentos.forEach(function(lancamento, index){
    if (launchNeedsIndexRefresh(lancamento) || !(lancamento.indexConfig && lancamento.indexConfig.lastAutoRefresh)) updateIndicesForLaunch(index);
  });
})();

