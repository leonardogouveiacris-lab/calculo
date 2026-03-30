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

  function validateDailyToMonthlyFixtures(convertFn){
    var converter = typeof convertFn === 'function' ? convertFn : dailyToMonthlyEffective;
    var fixtures = [
      {
        name: 'CDI diário já em % a.d. (SGS 4389)',
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
        name: 'Selic anualizada base 252 (SGS 11) -> taxa diária efetiva',
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

    return fixtures.map(function(fixture){
      var actual = converter(fixture.raw, fixture.seriesCode);
      var passed = fixture.expected.length === actual.length && fixture.expected.every(function(expectedItem, index){
        var actualItem = actual[index] || {};
        return expectedItem.month === actualItem.month && almostEqual(expectedItem.value, actualItem.value, 1e-12);
      });
      return { fixture: fixture.name, passed: passed, expected: fixture.expected, actual: actual };
    });
  }

  function validateProportionalFixtures(proportionalFn){
    var converter = typeof proportionalFn === 'function' ? proportionalFn : proportionalMonthlyEffectiveByDays;
    var fixtures = [
      {
        name: 'Proporcional composto: 10/30 avos de 1,12548% a.m.',
        input: { monthlyPercent: 1.12548, daysApplied: 10, daysInReferenceMonth: 30, mode: 'compound' },
        expected: 0.3737612845710059
      },
      {
        name: 'Mês completo retorna exatamente o índice mensal',
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
      return {
        fixture: fixture.name,
        passed: almostEqual(actual, fixture.expected, 1e-12),
        expected: fixture.expected,
        actual: actual
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
    validateDailyToMonthlyFixtures: validateDailyToMonthlyFixtures,
    validateProportionalFixtures: validateProportionalFixtures
  };
})(window);
