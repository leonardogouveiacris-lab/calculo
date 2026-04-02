#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ratesPath = path.resolve(__dirname, '../../js/core/cp-bcb-rates.js');
const source = fs.readFileSync(ratesPath, 'utf8');
const context = { window: {}, console };
vm.createContext(context);
vm.runInContext(source, context);

const rates = context.window.CPBCBRates;
if (!rates) {
  console.error('ERRO: CPBCBRates não carregado.');
  process.exit(1);
}

function assertReport(title, report){
  const failed = (report || []).filter((item) => !item.passed);
  if (failed.length) {
    console.error('ERRO:', title);
    failed.forEach((item) => console.error('-', item.fixture, item.error || 'falha'));
    process.exit(1);
  }
  console.log('OK:', title, '(' + report.length + ' casos)');
}

assertReport('fixtures diária->mensal', rates.validateDailyToMonthlyFixtures());
assertReport('fixtures composição diária exata', rates.validateDailyCompoundExactFixtures());
assertReport('fixtures proporcionalização mensal', rates.validateProportionalFixtures());

const officialBCBCases = [
  {
    name: 'SELIC SGS 11: recorte interno de mês (03/01/2025 a 06/01/2025)',
    seriesCode: rates.SELIC_DAILY_SERIES,
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
    name: 'CDI SGS 4389: recorte interno de mês (03/01/2025 a 06/01/2025)',
    seriesCode: rates.CDI_DAILY_SERIES,
    raw: [
      { data: '02/01/2025', valor: '10,65' },
      { data: '03/01/2025', valor: '10,65' },
      { data: '06/01/2025', valor: '10,65' }
    ],
    startISO: '2025-01-03',
    endISO: '2025-01-06',
    expectedFactor: 1.0008035121709333
  }
];

officialBCBCases.forEach((fixture) => {
  const factor = rates.dailyCompoundExactFactor(fixture.raw, fixture.seriesCode, fixture.startISO, fixture.endISO);
  if (Math.abs(factor - fixture.expectedFactor) > 1e-12) {
    console.error('ERRO: caso oficial BCB divergente:', fixture.name);
    console.error('esperado=', fixture.expectedFactor, 'obtido=', factor);
    process.exit(1);
  }
});
console.log('OK: regressão casos oficiais BCB (intervalo exato com início/fim dentro do mês).');
