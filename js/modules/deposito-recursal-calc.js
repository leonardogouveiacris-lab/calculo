(function(global){
  'use strict';
  if (global.CPDepositoRecursalCalcLoaded) return;
  const ns = global.CPDepositoRecursal = global.CPDepositoRecursal || {};

  ns.attachCalc = function(ctx){
    const { state, el, toBR, parseBCBNumber, compareMonth, monthKeyFromDate, minDepositDate, monthsBetweenInclusive } = ctx;

    async function fetchSeries(code, startDateISO, endDateISO) {
      const all = [];
      let curStart = new Date(startDateISO + 'T00:00:00');
      const endDate = new Date(endDateISO + 'T00:00:00');
      while (curStart <= endDate) {
        const curEnd = new Date(curStart); curEnd.setFullYear(curEnd.getFullYear() + 9); if (curEnd > endDate) curEnd.setTime(endDate.getTime());
        const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' + code + '/dados?formato=json&dataInicial=' + encodeURIComponent(toBR(curStart.toISOString().slice(0,10))) + '&dataFinal=' + encodeURIComponent(toBR(curEnd.toISOString().slice(0,10)));
        let part;
        try { part = await CPCommon.fetchJson(url, { timeoutMs: 15000 }); } catch (error) { throw new Error('Falha ao buscar série ' + code + ' no BCB: ' + error.message); }
        if (Array.isArray(part)) all.push.apply(all, part);
        curStart = new Date(curEnd); curStart.setDate(curStart.getDate() + 1);
      }
      return all;
    }

    function dailyToMonthlyEffective(dailyList, seriesCode){
      const byMonthFactor = new Map();
      (dailyList || []).forEach((it) => {
        const parts = String(it.data).split('/'); const mk = parts[2] + '-' + parts[1]; const v = parseBCBNumber(it.valor);
        let dailyRate;
        if (String(seriesCode) === '4389' || String(seriesCode) === '11') dailyRate = Math.pow(1 + (v / 100), 1 / 252) - 1;
        else return;
        byMonthFactor.set(mk, (byMonthFactor.get(mk) || 1) * (1 + dailyRate));
      });
      return Array.from(byMonthFactor.entries()).map(([month, factor]) => ({ month, value: (factor - 1) * 100 })).sort(compareMonth);
    }
    function monthlyMapFromBCB(list){ const map = new Map(); (list||[]).forEach((it)=>{ const p=String(it.data).split('/'); map.set(p[2] + '-' + p[1], parseBCBNumber(it.valor)); }); return map; }
    function buildPoupancaMonthly(trList, metaSelicList){ const trMap=monthlyMapFromBCB(trList), metaMap=monthlyMapFromBCB(metaSelicList); return Array.from(new Set([...trMap.keys(), ...metaMap.keys()])).sort().map((month)=>{ const tr=trMap.get(month)||0; const metaSelicAA=metaMap.get(month)||0; const adicional = metaSelicAA > 8.5 ? 0.5 : 0.7 * (metaSelicAA / 12); return { month, value: tr + adicional }; }); }
    function buildJamMonthly(trList){ const trMap = monthlyMapFromBCB(trList); return Array.from(trMap.entries()).map(([month, tr]) => ({ month, value: tr + 0.25 })).sort(compareMonth); }
    function getManualIndex(month){ const found = state.indices.find((i)=>i.month===month); return found ? Number(found.value)/100 : 0; }
    const AUTO_MONTHLY_SERIES = Object.freeze({ ipca: 433, inpc: 188, igpm: 189, igpdi: 190 });

    async function calculateAll(){
      ctx.sortDeposits();
      if (!state.deposits.length) { ctx.toast('Atenção','Cadastre depósitos.','warn'); return null; }
      const end = el.endDate && el.endDate.value;
      if (!end) { ctx.toast('Atenção','Informe data final.','warn'); return null; }
      const rounding = Number(el.roundingEl ? el.roundingEl.value : 2) || 2;
      const indexType = el.indexType ? el.indexType.value : 'manual';
      const start = minDepositDate(); const endKey = monthKeyFromDate(end);
      try {
        if (/^(cdi|selic|poupanca_auto|jam_auto|ipca|inpc|igpm|igpdi)$/.test(indexType)) ctx.setAutoStatus('Buscando índices no BCB...'); else ctx.setAutoStatus('');
        if (Object.prototype.hasOwnProperty.call(AUTO_MONTHLY_SERIES, indexType)) state.indices = Array.from(monthlyMapFromBCB(await fetchSeries(AUTO_MONTHLY_SERIES[indexType], start, end)).entries()).map(([month, value]) => ({ month, value })).sort(compareMonth);
        else if (indexType === 'cdi') state.indices = dailyToMonthlyEffective(await fetchSeries(4389, start, end), 4389);
        else if (indexType === 'selic') state.indices = dailyToMonthlyEffective(await fetchSeries(11, start, end), 11);
        else if (indexType === 'poupanca_auto') state.indices = buildPoupancaMonthly(await fetchSeries(7811, start, end), await fetchSeries(432, start, end));
        else if (indexType === 'jam_auto') state.indices = buildJamMonthly(await fetchSeries(7811, start, end));
        if (indexType !== 'manual') { ctx.setAutoStatus('OK (' + state.indices.length + ' meses).'); ctx.renderIndices(); }
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

    Object.assign(ctx, { fetchSeries, dailyToMonthlyEffective, buildPoupancaMonthly, buildJamMonthly, getManualIndex, calculateAll });
  };

  global.CPDepositoRecursalCalcLoaded = true;
})(window);
