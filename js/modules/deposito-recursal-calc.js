(function(global){
  'use strict';
  if (global.CPDepositoRecursalCalcLoaded) return;
  const ns = global.CPDepositoRecursal = global.CPDepositoRecursal || {};

  ns.attachCalc = function(ctx){
    const { state, el, compareMonth, monthKeyFromDate, minDepositDate, monthsBetweenInclusive } = ctx;
    const AUTO_CODE_MAP = { ipca: 433, inpc: 188, igpm: 189, igpdi: 190, tr: 7811, meta_selic: 432, cdi: 4389, selic: 11 };
    const rates = global.CPBCBRates || {};

    function getManualIndex(month){ const found = state.indices.find((i)=>i.month===month); return found ? Number(found.value)/100 : 0; }

    function isoToBrDate(iso){ const p = String(iso || '').split('-'); return p.length >= 3 ? (p[2] + '/' + p[1] + '/' + p[0]) : ''; }

    async function fetchBCBSeries(code, startISO, endISO){
      if (!global.CPCommon || typeof global.CPCommon.fetchJson !== 'function') throw new Error('CPCommon.fetchJson não disponível.');
      const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' + code + '/dados?formato=json&dataInicial=' + encodeURIComponent(isoToBrDate(startISO)) + '&dataFinal=' + encodeURIComponent(isoToBrDate(endISO));
      return global.CPCommon.fetchJson(url, { timeoutMs: 15000 });
    }

    function normalizeMonthly(raw){
      const map = new Map();
      (raw || []).forEach((it) => {
        const p = String(it.data || '').split('/');
        const month = p.length === 3 ? (p[2] + '-' + p[1]) : '';
        const value = Number(String(it.valor).replace(',', '.'));
        if (!/^\d{4}-\d{2}$/.test(month) || !Number.isFinite(value)) return;
        map.set(month, value);
      });
      return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map((entry)=>({ month: entry[0], value: entry[1] }));
    }

    function normalizeDailyToMonthlyEffective(raw, seriesCode){
      if (!(global.CPBCBRates && typeof global.CPBCBRates.dailyToMonthlyEffective === 'function')) throw new Error('CPBCBRates.dailyToMonthlyEffective não disponível.');
      return global.CPBCBRates.dailyToMonthlyEffective(raw, seriesCode);
    }
    function dailyCompoundExactFactor(raw, seriesCode, startISO, endISO){
      if (!(global.CPBCBRates && typeof global.CPBCBRates.dailyCompoundExactFactor === 'function')) throw new Error('CPBCBRates.dailyCompoundExactFactor não disponível.');
      return global.CPBCBRates.dailyCompoundExactFactor(raw, seriesCode, startISO, endISO);
    }
    function proportionalMonthlyEffectiveByDays(monthlyPercent, daysApplied, daysInReferenceMonth, mode){
      if (!(global.CPBCBRates && typeof global.CPBCBRates.proportionalMonthlyEffectiveByDays === 'function')) throw new Error('CPBCBRates.proportionalMonthlyEffectiveByDays não disponível.');
      return global.CPBCBRates.proportionalMonthlyEffectiveByDays(monthlyPercent, daysApplied, daysInReferenceMonth, mode);
    }

    (function validateDailyToMonthlyEffectiveConsistency(){
      if (!(global.CPBCBRates && typeof global.CPBCBRates.validateDailyToMonthlyFixtures === 'function')) return;
      const report = global.CPBCBRates.validateDailyToMonthlyFixtures(function(raw, seriesCode){ return normalizeDailyToMonthlyEffective(raw, seriesCode); });
      if (report.some((item) => !item.passed)) console.error('Falha nas fixtures estáticas de conversão diária->mensal (depósito recursal).', report);
    })();
    (function validateDailyCompoundExactConsistency(){
      if (!(global.CPBCBRates && typeof global.CPBCBRates.validateDailyCompoundExactFixtures === 'function')) return;
      const report = global.CPBCBRates.validateDailyCompoundExactFixtures(dailyCompoundExactFactor);
      if (report.some((item) => !item.passed)) console.error('Falha nas fixtures estáticas de composição diária exata (depósito recursal).', report);
    })();
    (function validateProportionalMonthlyConsistency(){
      if (!(global.CPBCBRates && typeof global.CPBCBRates.validateProportionalFixtures === 'function')) return;
      const report = global.CPBCBRates.validateProportionalFixtures(proportionalMonthlyEffectiveByDays);
      if (report.some((item) => !item.passed)) console.error('Falha nas fixtures estáticas de proporcionalização mensal (depósito recursal).', report);
    })();

    function parseISODateUTC(iso){
      const parts = String(iso || '').split('-').map(Number);
      if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
      return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    }

    function monthDaysUTC(monthKey){
      const parts = String(monthKey || '').split('-').map(Number);
      if (parts.length !== 2 || !parts[0] || !parts[1]) return 0;
      return new Date(Date.UTC(parts[0], parts[1], 0)).getUTCDate();
    }

    function daysAppliedWithinMonth(monthKey, rangeStartISO, rangeEndISO){
      const parts = String(monthKey || '').split('-').map(Number);
      if (parts.length !== 2 || !parts[0] || !parts[1]) return 0;
      const monthStart = new Date(Date.UTC(parts[0], parts[1] - 1, 1));
      const monthEnd = new Date(Date.UTC(parts[0], parts[1], 0));
      const rangeStart = parseISODateUTC(rangeStartISO);
      const rangeEnd = parseISODateUTC(rangeEndISO);
      if (!rangeStart || !rangeEnd || rangeStart > rangeEnd) return 0;
      const applyStart = rangeStart > monthStart ? rangeStart : monthStart;
      const applyEnd = rangeEnd < monthEnd ? rangeEnd : monthEnd;
      if (applyStart > applyEnd) return 0;
      return Math.floor((applyEnd.getTime() - applyStart.getTime()) / 86400000) + 1;
    }

    function makeIndexPayload(path, monthlyRates, dailyRates, dailySeriesCode){
      return { calculationPath: path || 'monthly', monthlyRates: Array.isArray(monthlyRates) ? monthlyRates : [], dailyRates: Array.isArray(dailyRates) ? dailyRates : [], dailySeriesCode: dailySeriesCode || null };
    }

    function buildAuditRule(indexType, startISO, endISO, finalFactor){
      if (indexType === 'manual') {
        return { series: 'Manual', unidade: '% a.m.', formula: 'fator = Π(1 + taxa_mensal_proporcional)', intervalo: startISO + ' até ' + endISO, fatorFinal: finalFactor };
      }
      const summary = rates.describeSourceRule && rates.describeSourceRule(indexType);
      return {
        series: summary ? summary.seriesLabel : '—',
        unidade: summary ? summary.unitLabel : '—',
        formula: summary ? ((summary.formulaLabel || '-') + ' • ' + (summary.ruleLabel || '-')) : '—',
        intervalo: summary ? (summary.intervalLabel + ' (' + startISO + ' até ' + endISO + ')') : (startISO + ' até ' + endISO),
        fatorFinal: finalFactor
      };
    }

    async function loadIndicesAuto(indexType, start, end){
      if (/^(ipca|inpc|igpm|igpdi)$/.test(indexType)) {
        const raw = await fetchBCBSeries(AUTO_CODE_MAP[indexType], start, end);
        return makeIndexPayload('monthly', normalizeMonthly(raw));
      }
      if (/^(cdi|selic)$/.test(indexType)) {
        const raw = await fetchBCBSeries(AUTO_CODE_MAP[indexType], start, end);
        return makeIndexPayload('daily_compound_exact', normalizeDailyToMonthlyEffective(raw, AUTO_CODE_MAP[indexType]), raw, AUTO_CODE_MAP[indexType]);
      }
      if (indexType === 'poupanca_auto' || indexType === 'jam_auto') {
        const [trRaw, metaSelicRaw] = await Promise.all([
          fetchBCBSeries(AUTO_CODE_MAP.tr, start, end),
          indexType === 'poupanca_auto' ? fetchBCBSeries(AUTO_CODE_MAP.meta_selic, start, end) : Promise.resolve([])
        ]);
        const trMap = new Map(normalizeMonthly(trRaw).map((it)=>[it.month, it.value]));
        const metaSelicMap = new Map(normalizeMonthly(metaSelicRaw).map((it)=>[it.month, it.value]));
        const months = monthsBetweenInclusive(start.slice(0,7), end.slice(0,7));
        let prevTR = 0;
        let prevMetaSelic = 0;
        return makeIndexPayload('monthly', months.map((month) => {
          if (trMap.has(month)) prevTR = trMap.get(month);
          if (metaSelicMap.has(month)) prevMetaSelic = metaSelicMap.get(month);
          const value = indexType === 'jam_auto'
            ? (prevTR + 0.25)
            : (prevTR + (prevMetaSelic > 8.5 ? 0.5 : (0.7 * (prevMetaSelic / 12))));
          return { month, value: Number.isFinite(value) ? value : 0 };
        }));
      }
      return makeIndexPayload('monthly', []);
    }

    async function calculateAll(){
      ctx.sortDeposits();
      if (!state.deposits.length) { ctx.toast('Atenção','Cadastre depósitos.','warn'); return null; }
      const end = el.endDate && el.endDate.value;
      if (!end) { ctx.toast('Atenção','Informe data final.','warn'); return null; }
      const rounding = Number(el.roundingEl ? el.roundingEl.value : 2) || 2;
      const indexType = el.indexType ? el.indexType.value : 'manual';
      const start = minDepositDate(); const endKey = monthKeyFromDate(end);
      try {
        if (/^(cdi|selic|poupanca_auto|jam_auto|ipca|inpc|igpm|igpdi)$/.test(indexType)) ctx.setAutoStatus('Buscando índices automáticos (BCB/SGS)...'); else ctx.setAutoStatus('');
        if (indexType !== 'manual') {
          const autoPayload = await loadIndicesAuto(indexType, start, end);
          state.indices = autoPayload.monthlyRates || [];
          state.autoIndexPayload = autoPayload;
          ctx.setAutoStatus('OK (' + state.indices.length + ' meses).');
          ctx.renderIndices();
        } else {
          state.autoIndexPayload = null;
        }
      } catch (err) {
        ctx.setAutoStatus('Erro ao buscar índices.'); ctx.toast('Erro', err.message || 'Erro ao buscar índices automáticos.', 'err'); return null;
      }
      const depBlocks = []; let totalUpdated = 0;
      state.deposits.forEach((dep) => {
        const startKey = monthKeyFromDate(dep.date); const months = monthsBetweenInclusive(startKey, endKey); let saldo = Number(dep.value); const lines = [];
        const autoPayload = (indexType !== 'manual' ? state.autoIndexPayload : null) || makeIndexPayload('monthly', state.indices || []);
        const monthlyMap = new Map((state.indices || []).map((item) => [item.month, Number(item.value || 0)]));
        months.forEach((mk, i) => {
          const monthlyPercent = indexType === 'manual' ? getManualIndex(mk) * 100 : (monthlyMap.get(mk) || 0);
          const baseDias = monthDaysUTC(mk);
          const diasAplicados = daysAppliedWithinMonth(mk, dep.date, end);
          const monthStartISO = mk + '-01';
          const monthEndISO = mk + '-31';
          const effectiveStartISO = dep.date > monthStartISO ? dep.date : monthStartISO;
          const effectiveEndISO = end < monthEndISO ? end : monthEndISO;
          const idxPercent = (indexType !== 'manual' && autoPayload.calculationPath === 'daily_compound_exact' && autoPayload.dailySeriesCode)
            ? (dailyCompoundExactFactor(autoPayload.dailyRates, autoPayload.dailySeriesCode, effectiveStartISO, effectiveEndISO) - 1)
            : (proportionalMonthlyEffectiveByDays(monthlyPercent, diasAplicados, baseDias, 'compound') / 100);
          const saldoAnterior = saldo;
          const jurosMes = saldoAnterior * idxPercent;
          saldo = saldoAnterior + jurosMes;
          lines.push({
            i, mk, idxMes: idxPercent, saldoAnterior, jurosMes, saldo,
            debug: {
              diasAplicados, baseDias, effectiveStartISO, effectiveEndISO,
              monthlyPercent,
              fatorMes: 1 + idxPercent,
              fatorAcumulado: dep.value ? (saldo / Number(dep.value || 1)) : 1
            }
          });
        });
        const pow = Math.pow(10, rounding);
        saldo = Math.round(saldo * pow) / pow;
        totalUpdated += saldo;
        depBlocks.push({
          dep,
          lines,
          subtotal: saldo,
          auditRule: buildAuditRule(indexType, dep.date, end, dep.value ? (saldo / Number(dep.value || 1)) : 1)
        });
      });
      const indexLabel = el.indexType ? ((el.indexType.options[el.indexType.selectedIndex] || {}).text || '') : indexType;
      const result = { end, totalUpdated, indexLabel, depBlocks, indexType, rounding, enableAuditLog: !!(el.enableAuditLog && el.enableAuditLog.checked) };
      state.lastCalc = result; return result;
    }

    Object.assign(ctx, { getManualIndex, calculateAll });
  };

  global.CPDepositoRecursalCalcLoaded = true;
})(window);
