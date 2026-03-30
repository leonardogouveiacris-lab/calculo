(function(global){
  'use strict';
  if (global.CPDepositoRecursalCalcLoaded) return;
  const ns = global.CPDepositoRecursal = global.CPDepositoRecursal || {};

  ns.attachCalc = function(ctx){
    const { state, el, compareMonth, monthKeyFromDate, minDepositDate, monthsBetweenInclusive } = ctx;
    const AUTO_CODE_MAP = { ipca: 433, inpc: 188, igpm: 189, igpdi: 190, tr: 7811, meta_selic: 432, cdi: 4389, selic: 11 };

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

    (function validateDailyToMonthlyEffectiveConsistency(){
      if (!(global.CPBCBRates && typeof global.CPBCBRates.validateDailyToMonthlyFixtures === 'function')) return;
      const report = global.CPBCBRates.validateDailyToMonthlyFixtures(function(raw, seriesCode){ return normalizeDailyToMonthlyEffective(raw, seriesCode); });
      if (report.some((item) => !item.passed)) console.error('Falha nas fixtures estáticas de conversão diária->mensal (depósito recursal).', report);
    })();

    async function loadIndicesAuto(indexType, start, end){
      if (/^(ipca|inpc|igpm|igpdi)$/.test(indexType)) {
        const raw = await fetchBCBSeries(AUTO_CODE_MAP[indexType], start, end);
        return normalizeMonthly(raw);
      }
      if (/^(cdi|selic)$/.test(indexType)) {
        const raw = await fetchBCBSeries(AUTO_CODE_MAP[indexType], start, end);
        return normalizeDailyToMonthlyEffective(raw, AUTO_CODE_MAP[indexType]);
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
        return months.map((month) => {
          if (trMap.has(month)) prevTR = trMap.get(month);
          if (metaSelicMap.has(month)) prevMetaSelic = metaSelicMap.get(month);
          const value = indexType === 'jam_auto'
            ? (prevTR + 0.25)
            : (prevTR + (prevMetaSelic > 8.5 ? 0.5 : (0.7 * (prevMetaSelic / 12))));
          return { month, value: Number.isFinite(value) ? value : 0 };
        });
      }
      return [];
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
          state.indices = await loadIndicesAuto(indexType, start, end);
          ctx.setAutoStatus('OK (' + state.indices.length + ' meses).');
          ctx.renderIndices();
        }
      } catch (err) {
        ctx.setAutoStatus('Erro ao buscar índices.'); ctx.toast('Erro', err.message || 'Erro ao buscar índices automáticos.', 'err'); return null;
      }
      const depBlocks = []; let totalUpdated = 0;
      state.deposits.forEach((dep) => {
        const startKey = monthKeyFromDate(dep.date); const months = monthsBetweenInclusive(startKey, endKey); let saldo = Number(dep.value); const lines = [];
        months.forEach((mk, i) => { const idxPercent = indexType === 'manual' ? getManualIndex(mk) : ((state.indices.find((x)=>x.month===mk)?.value || 0) / 100); const saldoAnterior = saldo; const jurosMes = saldoAnterior * idxPercent; saldo = saldoAnterior + jurosMes; lines.push({ i, mk, idxMes: idxPercent, saldoAnterior, jurosMes, saldo }); });
        const pow = Math.pow(10, rounding); saldo = Math.round(saldo * pow) / pow; totalUpdated += saldo; depBlocks.push({ dep, lines, subtotal: saldo });
      });
      const indexLabel = el.indexType ? ((el.indexType.options[el.indexType.selectedIndex] || {}).text || '') : indexType;
      const result = { end, totalUpdated, indexLabel, depBlocks, indexType, rounding };
      state.lastCalc = result; return result;
    }

    Object.assign(ctx, { getManualIndex, calculateAll });
  };

  global.CPDepositoRecursalCalcLoaded = true;
})(window);
