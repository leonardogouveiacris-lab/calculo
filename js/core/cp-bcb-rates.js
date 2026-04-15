(function(global){
  'use strict';
  if (global.CPBCBRates) return;

  var SELIC_DAILY_SERIES = '11';
  var CDI_DAILY_SERIES = '4389';
  var UNIT_MONTHLY_PERCENT = 'monthly_percent';
  var UNIT_DAILY_PERCENT = 'daily_percent';
  var UNIT_ANNUAL_PERCENT_BASE_252 = 'annual_percent_base_252';
  var seriesMeta = Object.freeze({
    // BCB/SGS:
    // - Série 11 ("Taxa de juros - Selic"): Diária, % a.d.
    // - Série 4389 ("Taxa de juros - CDI anualizada base 252"): Diária, % a.a. (derivada da série 12).
    // Referência: metadados oficiais do SGS (links "Metadados no BCB-SGS" nas séries).
    '11': Object.freeze({ unitType: UNIT_DAILY_PERCENT, unitLabel: '% a.d.', label: 'Selic diária (% a.d., SGS 11)', formulaLabel: 'taxa_dia = v/100' }),
    '188': Object.freeze({ unitType: UNIT_MONTHLY_PERCENT, unitLabel: '% a.m.', label: 'INPC mensal (SGS 188)', formulaLabel: 'taxa_mês = v/100' }),
    '189': Object.freeze({ unitType: UNIT_MONTHLY_PERCENT, unitLabel: '% a.m.', label: 'IGP-M mensal (SGS 189)', formulaLabel: 'taxa_mês = v/100' }),
    '190': Object.freeze({ unitType: UNIT_MONTHLY_PERCENT, unitLabel: '% a.m.', label: 'IGP-DI mensal (SGS 190)', formulaLabel: 'taxa_mês = v/100' }),
    '432': Object.freeze({ unitType: UNIT_MONTHLY_PERCENT, unitLabel: '% a.a.', label: 'Meta Selic (SGS 432)', formulaLabel: 'adicional poupança = (v > 8,5 ? 0,5 : 0,7*(v/12))' }),
    '433': Object.freeze({ unitType: UNIT_MONTHLY_PERCENT, unitLabel: '% a.m.', label: 'IPCA mensal (SGS 433)', formulaLabel: 'taxa_mês = v/100' }),
    '4389': Object.freeze({ unitType: UNIT_ANNUAL_PERCENT_BASE_252, unitLabel: '% a.a. base 252', label: 'CDI anualizado base 252 (% a.a., SGS 4389)', formulaLabel: 'taxa_dia = (1 + v/100)^(1/252) - 1' }),
    '7478': Object.freeze({ unitType: UNIT_MONTHLY_PERCENT, unitLabel: '% a.m.', label: 'IPCA-15 mensal (SGS 7478)', formulaLabel: 'taxa_mês = v/100' }),
    '7811': Object.freeze({ unitType: UNIT_MONTHLY_PERCENT, unitLabel: '% a.m.', label: 'TR mensal (SGS 7811)', formulaLabel: 'taxa_mês = v/100' }),
    '10764': Object.freeze({ unitType: UNIT_MONTHLY_PERCENT, unitLabel: '% a.m.', label: 'IPCA-E mensal (SGS 10764)', formulaLabel: 'taxa_mês = v/100' }),
    '29543': Object.freeze({ unitType: UNIT_MONTHLY_PERCENT, unitLabel: '% a.m.', label: 'Taxa Legal mensal (SGS 29543)', formulaLabel: 'taxa_mês = v/100' })
  });

  var sourceMeta = Object.freeze({
    ipca: Object.freeze({ seriesCodes: ['433'], ruleLabel: 'Mensal composta por competência', intervalLabel: 'Competência até data final' }),
    ipcae: Object.freeze({ seriesCodes: ['10764'], ruleLabel: 'Mensal composta por competência', intervalLabel: 'Competência até data final' }),
    inpc: Object.freeze({ seriesCodes: ['188'], ruleLabel: 'Mensal composta por competência', intervalLabel: 'Competência até data final' }),
    igpm: Object.freeze({ seriesCodes: ['189'], ruleLabel: 'Mensal composta por competência', intervalLabel: 'Competência até data final' }),
    igpdi: Object.freeze({ seriesCodes: ['190'], ruleLabel: 'Mensal composta por competência', intervalLabel: 'Competência até data final' }),
    tr: Object.freeze({ seriesCodes: ['7811'], ruleLabel: 'Mensal composta por competência', intervalLabel: 'Competência até data final' }),
    cdi: Object.freeze({ seriesCodes: ['4389'], ruleLabel: 'Composição diária exata', intervalLabel: 'Intervalo fechado [início, fim]' }),
    selic: Object.freeze({ seriesCodes: ['11'], ruleLabel: 'Composição diária exata', intervalLabel: 'Intervalo fechado [início, fim]' }),
    taxa_legal: Object.freeze({ seriesCodes: ['29543'], ruleLabel: 'Série oficial mensal divulgada pelo BCB conforme Resolução CMN 5.171/2024', intervalLabel: 'Competência limitada por coluna' }),
    ec113_2021: Object.freeze({ seriesCodes: ['10764', '11'], ruleLabel: 'IPCA-E até 11/2021 e Selic a partir de 12/2021', intervalLabel: 'Competência limitada por coluna' }),
    poupanca_auto: Object.freeze({ seriesCodes: ['7811', '432'], ruleLabel: 'TR + adicional da poupança', intervalLabel: 'Competência até data final' }),
    jam_auto: Object.freeze({ seriesCodes: ['7811'], ruleLabel: 'TR + 0,25% a.m.', intervalLabel: 'Competência até data final' })
  });

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

  // Regra oficial por unidade da série:
  // - SGS 11 já vem em % a.d. (sem conversão adicional).
  // - SGS 4389 vem em % a.a. base 252 (converter para taxa diária efetiva).
  // Em ambos os casos, o mês usa capitalização composta
  // dos dias disponíveis na série do BCB no período: produto(1 + taxa_dia) - 1.
  function dailyRateFromBCBValue(seriesCode, rawValue){
    var code = String(seriesCode || '');
    var value = parseBCBNumber(rawValue);
    var meta = seriesMeta[code];
    if (!meta) return null;
    if (meta.unitType === UNIT_ANNUAL_PERCENT_BASE_252) return Math.pow(1 + (value / 100), 1 / 252) - 1;
    if (meta.unitType === UNIT_DAILY_PERCENT) return value / 100;
    return null;
  }

  function getSeriesMeta(seriesCode){
    return seriesMeta[String(seriesCode || '')] || null;
  }

  function formatSeriesLabel(seriesCode){
    var code = String(seriesCode || '');
    var meta = getSeriesMeta(code);
    return meta && meta.label ? meta.label : ('Série SGS ' + code);
  }

  function getSourceMeta(sourceType){
    return sourceMeta[String(sourceType || '')] || null;
  }

  function describeSourceRule(sourceType){
    var source = getSourceMeta(sourceType);
    if (!source) return null;
    var seriesLabels = (source.seriesCodes || []).map(function(code){ return formatSeriesLabel(code); });
    var unitLabels = (source.seriesCodes || []).map(function(code){
      var meta = getSeriesMeta(code);
      return meta && meta.unitLabel ? (code + ': ' + meta.unitLabel) : null;
    }).filter(Boolean);
    var formulas = (source.seriesCodes || []).map(function(code){
      var meta = getSeriesMeta(code);
      return meta && meta.formulaLabel ? (code + ': ' + meta.formulaLabel) : null;
    }).filter(Boolean);
    return {
      sourceType: String(sourceType || ''),
      seriesCodes: (source.seriesCodes || []).slice(),
      seriesLabel: seriesLabels.join(' + '),
      unitLabel: unitLabels.join(' | '),
      formulaLabel: formulas.join(' | '),
      ruleLabel: source.ruleLabel || '',
      intervalLabel: source.intervalLabel || ''
    };
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

  function bcbDateToISO(brDate){
    var parts = String(brDate || '').split('/');
    if (parts.length !== 3) return '';
    return parts[2] + '-' + parts[1] + '-' + parts[0];
  }

  function dailyCompoundExactFactor(bcbDailyList, seriesCode, startISO, endISO){
    var start = String(startISO || '');
    var end = String(endISO || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || start > end) return 1;
    return (bcbDailyList || []).reduce(function(factor, item){
      var iso = bcbDateToISO(item && item.data);
      var dailyRate = dailyRateFromBCBValue(seriesCode, item && item.valor);
      if (!iso || iso < start || iso > end || !Number.isFinite(dailyRate)) return factor;
      return factor * (1 + dailyRate);
    }, 1);
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
        name: 'SELIC em unidade oficial diária (SGS 11, % a.d.)',
        seriesCode: SELIC_DAILY_SERIES,
        raw: [
          { data: '02/01/2025', valor: '0,0402' }
        ],
        expected: [
          { month: '2025-01', value: 0.0402 }
        ]
      },
      {
        name: 'CDI anualizado base 252 convertido para diário efetivo (SGS 4389)',
        seriesCode: CDI_DAILY_SERIES,
        raw: [
          { data: '02/01/2025', valor: '10,65' },
          { data: '03/01/2025', valor: '10,65' },
          { data: '06/01/2025', valor: '10,65' }
        ],
        expected: [
          { month: '2025-01', value: 0.12055103359147612 }
        ]
      },
      {
        name: 'SELIC acumulada no mês por composição de taxa diária oficial (SGS 11)',
        seriesCode: SELIC_DAILY_SERIES,
        raw: [
          { data: '02/01/2025', valor: '0,0402' },
          { data: '03/01/2025', valor: '0,0402' },
          { data: '03/02/2025', valor: '0,0402' }
        ],
        expected: [
          { month: '2025-01', value: 0.0804161604000067 },
          { month: '2025-02', value: 0.0402 }
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

  function validateDailyCompoundExactFixtures(compoundFn, epsilon){
    var calculator = typeof compoundFn === 'function' ? compoundFn : dailyCompoundExactFactor;
    var eps = Number(epsilon || 1e-12);
    var fixtures = [
      {
        name: 'SELIC diário exato no intervalo fechado dentro do mês (SGS 11)',
        seriesCode: SELIC_DAILY_SERIES,
        raw: [
          { data: '02/01/2025', valor: '0,0402' },
          { data: '03/01/2025', valor: '0,0402' },
          { data: '06/01/2025', valor: '0,0402' }
        ],
        startISO: '2025-01-03',
        endISO: '2025-01-06',
        expectedFactor: 1.0008041616040001
      },
      {
        name: 'CDI diário exato com início/fim dentro do mês (SGS 4389)',
        seriesCode: CDI_DAILY_SERIES,
        raw: [
          { data: '02/01/2025', valor: '10,65' },
          { data: '03/01/2025', valor: '10,65' },
          { data: '06/01/2025', valor: '10,65' }
        ],
        startISO: '2025-01-03',
        endISO: '2025-01-06',
        expectedFactor: 1.0008035121709333
      },
      {
        name: 'SELIC diário exato cruzando mês com bordas internas (SGS 11)',
        seriesCode: SELIC_DAILY_SERIES,
        raw: [
          { data: '30/01/2025', valor: '0,0402' },
          { data: '31/01/2025', valor: '0,0402' },
          { data: '03/02/2025', valor: '0,0402' },
          { data: '04/02/2025', valor: '0,0402' }
        ],
        startISO: '2025-01-31',
        endISO: '2025-02-03',
        expectedFactor: 1.0008041616040001
      }
    ];
    return fixtures.map(function(fixture){
      var actual = calculator(fixture.raw, fixture.seriesCode, fixture.startISO, fixture.endISO);
      var passed = almostEqual(actual, fixture.expectedFactor, eps);
      return {
        fixture: fixture.name,
        passed: passed,
        epsilon: eps,
        expected: fixture.expectedFactor,
        actual: actual,
        error: passed ? null : buildDiffMessage('Fator diário exato divergente', fixture.expectedFactor, actual, eps)
      };
    });
  }

  global.CPBCBRates = {
    SELIC_DAILY_SERIES: SELIC_DAILY_SERIES,
    CDI_DAILY_SERIES: CDI_DAILY_SERIES,
    UNIT_MONTHLY_PERCENT: UNIT_MONTHLY_PERCENT,
    parseBCBNumber: parseBCBNumber,
    seriesMeta: seriesMeta,
    sourceMeta: sourceMeta,
    getSeriesMeta: getSeriesMeta,
    getSourceMeta: getSourceMeta,
    describeSourceRule: describeSourceRule,
    formatSeriesLabel: formatSeriesLabel,
    dailyRateFromBCBValue: dailyRateFromBCBValue,
    dailyToMonthlyEffective: dailyToMonthlyEffective,
    dailyCompoundExactFactor: dailyCompoundExactFactor,
    proportionalMonthlyEffectiveByDays: proportionalMonthlyEffectiveByDays,
    applyMonthlyRates: applyMonthlyRates,
    validateDailyToMonthlyFixtures: validateDailyToMonthlyFixtures,
    validateDailyCompoundExactFixtures: validateDailyCompoundExactFixtures,
    validateProportionalFixtures: validateProportionalFixtures,
    validateCompoundApplicationFixtures: validateCompoundApplicationFixtures
  };
})(window);
