(function(global){
  'use strict';
  if (global.CPDepositoRecursalCalcLoaded) return;
  const ns = global.CPDepositoRecursal = global.CPDepositoRecursal || {};

  ns.attachCalc = function(ctx){
    const { state, el, compareMonth, monthKeyFromDate, minDepositDate, monthsBetweenInclusive } = ctx;
    const FLAG = global.CPFeatureFlags && global.CPFeatureFlags.useCentralIndices !== false;

    function getManualIndex(month){ const found = state.indices.find((i)=>i.month===month); return found ? Number(found.value)/100 : 0; }

    async function loadIndicesFromCentral(indexType, start, end){
      if (!global.CPIndices) throw new Error('CPIndices não disponível.');
      const autoMap = { ipca: 'ipca_bcb_433', inpc: 'inpc_bcb_188', igpm: 'igpm_bcb_189', igpdi: 'igpdi_bcb_190', cdi: 'cdi_bcb_4389', selic: 'selic_bcb_11' };
      if (autoMap[indexType]) {
        await CPIndices.ensureAutoTable(autoMap[indexType], start, end);
        const serie = CPIndices.getRange(autoMap[indexType], start, end);
        return serie.map((it)=>({ month: it.competencia, value: it.valor })).sort(compareMonth);
      }
      if (indexType === 'poupanca_auto') {
        await CPIndices.ensureAutoTable('tr_bcb_7811', start, end);
        await CPIndices.ensureAutoTable('meta_selic_432', start, end);
        const months = monthsBetweenInclusive(start.slice(0,7), end.slice(0,7));
        return months.map((mk)=>({ month: mk, value: CPIndices.resolveRule('poupanca_auto', { month: mk }) }));
      }
      if (indexType === 'jam_auto') {
        await CPIndices.ensureAutoTable('tr_bcb_7811', start, end);
        const months = monthsBetweenInclusive(start.slice(0,7), end.slice(0,7));
        return months.map((mk)=>({ month: mk, value: CPIndices.resolveRule('jam_auto', { month: mk }) }));
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
        if (/^(cdi|selic|poupanca_auto|jam_auto|ipca|inpc|igpm|igpdi)$/.test(indexType)) ctx.setAutoStatus('Buscando índices no módulo central...'); else ctx.setAutoStatus('');
        if (FLAG && indexType !== 'manual') {
          state.indices = await loadIndicesFromCentral(indexType, start, end);
        }
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

    Object.assign(ctx, { getManualIndex, calculateAll });
  };

  global.CPDepositoRecursalCalcLoaded = true;
})(window);
