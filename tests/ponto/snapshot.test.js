const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadPontoModules } = require('./helpers');

const { engine } = loadPontoModules();

const meses = [
  { competencia: '2026-01', registros: [
    { data: '2026-01-05', diaSemana: 'seg', entradasSaidas: ['0800', '1200', '1300', '1700'] },
    { data: '2026-01-06', diaSemana: 'ter', entradasSaidas: ['0800', '1200', '1300', '1800'] }
  ] },
  { competencia: '2026-02', registros: [
    { data: '2026-02-02', diaSemana: 'seg', entradasSaidas: ['0800', '1100'] },
    { data: '2026-02-03', diaSemana: 'ter', entradasSaidas: ['2200', '0500'] },
    { data: '2026-02-08', diaSemana: 'dom', entradasSaidas: ['0800', '1200'] }
  ] }
];

test('snapshot de resumo por competência com dados determinísticos', () => {
  const result = engine.calcularPeriodo(meses, { jornadaDiariaMin: 480, adicionalNoturnoPercentual: 20, reducaoNoturnaFator: 60/52.5 });
  const normalized = {
    competencias: result.competencias.map((c) => ({ competencia: c.competencia, rubricas: c.resultado.rubricas })),
    totalPeriodo: result.rubricas
  };
  const expected = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'snapshots/competencias.snapshot.json'), 'utf8'));
  assert.equal(JSON.stringify(normalized), JSON.stringify(expected));
});
