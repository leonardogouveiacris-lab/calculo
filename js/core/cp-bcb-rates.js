(function(global){
  'use strict';
  if (global.CPBCBRates) return;

  var SELIC_DAILY_SERIES = '11';
  var CDI_DAILY_SERIES = '4389';

  function parseBCBNumber(value){
    var raw = String(value == null ? '' : value).trim();
    if (!raw) return 0;
    var normalized = raw;
    if (normalized.indexOf(',') >= 0 && normalized.indexOf('.') >= 0) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else if (normalized.indexOf(',') >= 0) {
      normalized = normalized.replace(',', '.');
    }
    var parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function monthlyKeyFromBCBDate(brDate){
    var parts = String(brDate || '').split('/');
    if (parts.length !== 3) return '';
    return parts[2] + '-' + parts[1];
  }

  function compareMonth(a, b){
    return String((a && a.month) || a || '').localeCompare(String((b && b.month) || b || ''));
  }

  // Regra oficial: SGS 11 é taxa anualizada base 252 e precisa ser convertida em taxa diária efetiva.
  // SGS 4389 já é taxa diária (% a.d.). Em ambos os casos, o mês usa capitalização composta
  // dos dias disponíveis na série do BCB no período: produto(1 + taxa_dia) - 1.
  function dailyRateFromBCBValue(seriesCode, rawValue){
    var code = String(seriesCode || '');
    var value = parseBCBNumber(rawValue);
    if (code === SELIC_DAILY_SERIES) return Math.pow(1 + (value / 100), 1 / 252) - 1;
    if (code === CDI_DAILY_SERIES) return value / 100;
    return null;
  }

  function dailyToMonthlyEffective(bcbDailyList, seriesCode){
    var monthFactor = new Map();
    (bcbDailyList || []).forEach(function(item){
      var month = monthlyKeyFromBCBDate(item && item.data);
      var dailyRate = dailyRateFromBCBValue(seriesCode, item && item.valor);
      if (!/^\d{4}-\d{2}$/.test(month) || !Number.isFinite(dailyRate)) return;
      monthFactor.set(month, (monthFactor.get(month) || 1) * (1 + dailyRate));
    });
    return Array.from(monthFactor.entries())
      .map(function(entry){ return { month: entry[0], value: (entry[1] - 1) * 100 }; })
      .sort(compareMonth);
  }

  function almostEqual(a, b, eps){
    return Math.abs(Number(a) - Number(b)) <= Number(eps || 1e-12);
  }

  function buildDiffMessage(label, expected, actual, epsilon){
    var diff = Math.abs(Number(expected) - Number(actual));
    return label + ': esperado=' + expected + ', obtido=' + actual + ', diff=' + diff + ', epsilon=' + epsilon;
  }

  // monthlyPercent: percentual mensal efetivo (ex.: 1.12548 = 1,12548% a.m. efetivo).
  // daysApplied: quantidade de dias efetivamente apurados no período.
  // daysInReferenceMonth: base do mês de referência (28/29/30/31 ou outra base de negócio).
  // mode: "compound" (padrão oficial) para equivalência composta diária, ou "linear" para compatibilidade legada.
  // Retorno: percentual efetivo proporcional do período, na mesma unidade percentual da entrada.
  function proportionalMonthlyEffectiveByDays(monthlyPercent, daysApplied, daysInReferenceMonth, mode){
    var monthly = Number(monthlyPercent);
    var applied = Number(daysApplied);
    var monthBase = Number(daysInReferenceMonth);
    if (!Number.isFinite(monthly) || !Number.isFinite(applied) || !Number.isFinite(monthBase)) return 0;
    if (applied <= 0 || monthBase <= 0) return 0;
    if (applied > monthBase) applied = monthBase;
    var effectiveMode = mode === 'linear' ? 'linear' : 'compound';
    if (effectiveMode === 'linear') return monthly * (applied / monthBase);
    var monthlyFactor = 1 + (monthly / 100);
    if (!Number.isFinite(monthlyFactor) || monthlyFactor <= 0) return 0;
    var partialFactor = Math.pow(monthlyFactor, applied / monthBase);
    return (partialFactor - 1) * 100;
  }

  function validateDailyToMonthlyFixtures(convertFn, epsilon){
    var converter = typeof convertFn === 'function' ? convertFn : dailyToMonthlyEffective;
    var eps = Number(epsilon || 1e-12);
    var conversionFixtures = [
      {
        name: 'SELIC diária convertida (SGS 11 anual base 252 -> taxa efetiva diária)',
        seriesCode: SELIC_DAILY_SERIES,
        raw: [
          { data: '02/01/2025', valor: '10,65' }
        ],
        expected: [
          { month: '2025-01', value: 0.04016754138975731 }
        ]
      },
      {
        name: 'CDI em unidade oficial % a.d. confirmada (SGS 4389)',
        seriesCode: CDI_DAILY_SERIES,
        raw: [
          { data: '02/01/2025', valor: '0,10' },
          { data: '03/01/2025', valor: '0,10' },
          { data: '06/01/2025', valor: '0,10' }
        ],
        expected: [
          { month: '2025-01', value: 0.30030009999996787 }
        ]
      },
      {
        name: 'SELIC acumulada no mês por capitalização diária',
        seriesCode: SELIC_DAILY_SERIES,
        raw: [
          { data: '02/01/2025', valor: '10,65' },
          { data: '03/01/2025', valor: '10,65' },
          { data: '03/02/2025', valor: '10,65' }
        ],
        expected: [
          { month: '2025-01', value: 0.08035121709333293 },
          { month: '2025-02', value: 0.04016754138975731 }
        ]
      }
    ];

    return conversionFixtures.map(function(fixture){
      var actual = converter(fixture.raw, fixture.seriesCode);
      var errors = [];
      var lengthPassed = fixture.expected.length === actual.length;
      if (!lengthPassed) {
        errors.push('Quantidade de meses divergente: esperado=' + fixture.expected.length + ', obtido=' + actual.length);
      }
      var valuesPassed = fixture.expected.every(function(expectedItem, index){
        var actualItem = actual[index] || {};
        if (expectedItem.month !== actualItem.month) {
          errors.push('Mês divergente na posição ' + index + ': esperado=' + expectedItem.month + ', obtido=' + actualItem.month);
          return false;
        }
        if (!almostEqual(expectedItem.value, actualItem.value, eps)) {
          errors.push(buildDiffMessage('Taxa mensal divergente em ' + expectedItem.month, expectedItem.value, actualItem.value, eps));
          return false;
        }
        return true;
      });
      return {
        fixture: fixture.name,
        passed: lengthPassed && valuesPassed,
        epsilon: eps,
        expected: fixture.expected,
        actual: actual,
        error: errors.join(' | ') || null
      };
    });
  }

  function validateProportionalFixtures(proportionalFn, epsilon){
    var converter = typeof proportionalFn === 'function' ? proportionalFn : proportionalMonthlyEffectiveByDays;
    var eps = Number(epsilon || 1e-12);
    var fixtures = [
      {
        name: 'Período parcial composto: 1 dia de 30',
        input: { monthlyPercent: 1.12548, daysApplied: 1, daysInReferenceMonth: 30, mode: 'compound' },
        expected: 0.03731341298953694
      },
      {
        name: 'Período parcial composto: 2 dias de 30',
        input: { monthlyPercent: 1.12548, daysApplied: 2, daysInReferenceMonth: 30, mode: 'compound' },
        expected: 0.07464074888694494
      },
      {
        name: 'Período parcial composto: 10 dias de 30',
        input: { monthlyPercent: 1.12548, daysApplied: 10, daysInReferenceMonth: 30, mode: 'compound' },
        expected: 0.3737612845710059
      },
      {
        name: 'Mês completo (30/30) retorna exatamente o índice mensal',
        input: { monthlyPercent: 1.12548, daysApplied: 30, daysInReferenceMonth: 30, mode: 'compound' },
        expected: 1.12548
      },
      {
        name: 'Sem dias aplicados retorna 0',
        input: { monthlyPercent: 1.12548, daysApplied: 0, daysInReferenceMonth: 30, mode: 'compound' },
        expected: 0
      }
    ];
    return fixtures.map(function(fixture){
      var input = fixture.input || {};
      var actual = converter(input.monthlyPercent, input.daysApplied, input.daysInReferenceMonth, input.mode);
      var passed = almostEqual(actual, fixture.expected, eps);
      return {
        fixture: fixture.name,
        passed: passed,
        epsilon: eps,
        expected: fixture.expected,
        actual: actual,
        error: passed ? null : buildDiffMessage('Proporcional divergente', fixture.expected, actual, eps)
      };
    });
  }

  function applyMonthlyRates(baseAmount, monthlyPercentList){
    var base = Number(baseAmount);
    var factors = (monthlyPercentList || []).map(function(rate){ return 1 + (Number(rate) / 100); });
    var accumulatedFactor = factors.reduce(function(acc, value){ return acc * value; }, 1);
    var juros = base * (accumulatedFactor - 1);
    return {
      base: base,
      factors: factors,
      accumulatedFactor: accumulatedFactor,
      interestValue: juros,
      finalValue: base + juros
    };
  }

  function validateCompoundApplicationFixtures(applyFn, epsilon){
    var calculator = typeof applyFn === 'function' ? applyFn : applyMonthlyRates;
    var eps = Number(epsilon || 1e-12);
    var fixtures = [
      {
        name: 'Fator mensal (1 + taxa) para período de 1 dia equivalente',
        base: 1000,
        monthlyPercents: [0.03731341298953694],
        expected: {
          factors: [1.0003731341298954],
          accumulatedFactor: 1.0003731341298954,
          interestValue: 0.37313412989543756
        }
      },
      {
        name: 'Fator mensal (1 + taxa) para período de 2 dias equivalente',
        base: 1000,
        monthlyPercents: [0.07464074888694494],
        expected: {
          factors: [1.0007464074888694],
          accumulatedFactor: 1.0007464074888694,
          interestValue: 0.7464074888694958
        }
      },
      {
        name: 'Fator acumulado multi-mês e juros sobre base',
        base: 1500,
        monthlyPercents: [1.12548, 0.95],
        expected: {
          factors: [1.0112548, 1.0095],
          accumulatedFactor: 1.0208617206000002,
          interestValue: 31.29258090000022
        }
      }
    ];

    return fixtures.map(function(fixture){
      var actual = calculator(fixture.base, fixture.monthlyPercents);
      var errors = [];
      (fixture.expected.factors || []).forEach(function(expectedFactor, index){
        var actualFactor = (actual.factors || [])[index];
        if (!almostEqual(expectedFactor, actualFactor, eps)) {
          errors.push(buildDiffMessage('Fator mensal divergente [' + index + ']', expectedFactor, actualFactor, eps));
        }
      });
      if (!almostEqual(fixture.expected.accumulatedFactor, actual.accumulatedFactor, eps)) {
        errors.push(buildDiffMessage('Fator acumulado divergente', fixture.expected.accumulatedFactor, actual.accumulatedFactor, eps));
      }
      if (!almostEqual(fixture.expected.interestValue, actual.interestValue, eps)) {
        errors.push(buildDiffMessage('Juros (base*(fator-1)) divergente', fixture.expected.interestValue, actual.interestValue, eps));
      }
      return {
        fixture: fixture.name,
        passed: errors.length === 0,
        epsilon: eps,
        expected: fixture.expected,
        actual: actual,
        error: errors.join(' | ') || null
      };
    });
  }

  global.CPBCBRates = {
    SELIC_DAILY_SERIES: SELIC_DAILY_SERIES,
    CDI_DAILY_SERIES: CDI_DAILY_SERIES,
    parseBCBNumber: parseBCBNumber,
    dailyRateFromBCBValue: dailyRateFromBCBValue,
    dailyToMonthlyEffective: dailyToMonthlyEffective,
    proportionalMonthlyEffectiveByDays: proportionalMonthlyEffectiveByDays,
    applyMonthlyRates: applyMonthlyRates,
    validateDailyToMonthlyFixtures: validateDailyToMonthlyFixtures,
    validateProportionalFixtures: validateProportionalFixtures,
    validateCompoundApplicationFixtures: validateCompoundApplicationFixtures
  };
})(window);
