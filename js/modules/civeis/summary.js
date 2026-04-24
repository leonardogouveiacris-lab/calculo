(function(global){
  const MODULE_KEY = 'summary';

  function number(value){
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function calculateLaunchTotals(launch){
    const lines = Array.isArray(launch && launch.linhas) ? launch.linhas : [];
    return lines.reduce(function(acc, row){
      const corrigido = number(row && (row.valor_corrigido != null ? row.valor_corrigido : row.valor));
      const juros = number(row && row.valor_juros);
      acc.valorCorrigido += corrigido;
      acc.juros += juros;
      acc.valorDevido += corrigido + juros;
      return acc;
    }, { valorCorrigido: 0, juros: 0, valorDevido: 0 });
  }

  /**
   * Soma algébrica da base de honorários a partir dos lançamentos.
   * Aceita verbas negativas na composição.
   */
  function calculateHonorariosBaseFromLaunches(launches){
    const list = Array.isArray(launches) ? launches : [];
    const total = list.reduce(function(acc, launch){
      return acc + calculateLaunchTotals(launch).valorDevido;
    }, 0);
    const hasPositiveComponent = list.some(function(launch){
      return calculateLaunchTotals(launch).valorDevido > 0;
    });
    const hasNegativeComponent = list.some(function(launch){
      return calculateLaunchTotals(launch).valorDevido < 0;
    });
    return {
      value: total,
      hasPositiveComponent: hasPositiveComponent,
      hasNegativeComponent: hasNegativeComponent,
      isMixedSigns: hasPositiveComponent && hasNegativeComponent,
      isZero: Math.abs(total) < 0.005
    };
  }

  function calculateHonorarios(baseValueOrLaunches, honorarios){
    const baseValue = Array.isArray(baseValueOrLaunches)
      ? calculateHonorariosBaseFromLaunches(baseValueOrLaunches).value
      : number(baseValueOrLaunches);
    return (Array.isArray(honorarios) ? honorarios : []).reduce(function(total, item){
      const kind = String(item && item.tipo || 'percentual').toLowerCase();
      const value = number(item && item.valor);
      if (kind === 'fixo') return total + value;
      return total + (baseValue * value / 100);
    }, 0);
  }

  function calculateCustas(custas){
    return (Array.isArray(custas) ? custas : []).reduce(function(total, item){
      return total + number(item && item.valor);
    }, 0);
  }

  function buildSummary(data){
    const source = data || {};
    const launches = Array.isArray(source.lancamentos) ? source.lancamentos : [];
    const totalLaunches = launches.reduce(function(acc, launch){
      const launchTotal = calculateLaunchTotals(launch);
      acc.valorCorrigido += launchTotal.valorCorrigido;
      acc.juros += launchTotal.juros;
      acc.valorDevido += launchTotal.valorDevido;
      return acc;
    }, { valorCorrigido: 0, juros: 0, valorDevido: 0 });

    const honorariosBase = calculateHonorariosBaseFromLaunches(launches);
    const honorarios = calculateHonorarios(honorariosBase.value, source.honorarios);
    const custas = calculateCustas(source.custas);

    return {
      launches: totalLaunches,
      honorarios: honorarios,
      custas: custas,
      totalGeral: totalLaunches.valorDevido + honorarios + custas
    };
  }

  global.CPCiveisModules = global.CPCiveisModules || {};
  global.CPCiveisModules[MODULE_KEY] = {
    calculateLaunchTotals: calculateLaunchTotals,
    calculateHonorariosBaseFromLaunches: calculateHonorariosBaseFromLaunches,
    calculateHonorarios: calculateHonorarios,
    calculateCustas: calculateCustas,
    buildSummary: buildSummary
  };
})(window);
