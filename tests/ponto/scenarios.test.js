const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPontoModules } = require('./helpers');

const { engine } = loadPontoModules();

const cfg = { jornadaDiariaMin: 480, adicionalNoturnoPercentual: 20, reducaoNoturnaFator: 60 / 52.5 };

test('cenários reais: jornada normal, HE 50/100, noturno/reduzida, DSR, domingos/feriados, faltas/atrasos', () => {
  const calendario = { isFeriado: (d) => d === '2026-01-01' };
  const dias = [
    { data: '2026-01-05', diaSemana: 'seg', entradasSaidas: ['0800', '1200', '1300', '1700'] }, // normal
    { data: '2026-01-06', diaSemana: 'ter', entradasSaidas: ['0800', '1200', '1300', '1900'] }, // he50
    { data: '2026-01-07', diaSemana: 'qua', entradasSaidas: ['2200', '0500'] }, // noturno
    { data: '2026-01-11', diaSemana: 'dom', entradasSaidas: ['0800', '1200'] }, // domingo
    { data: '2026-01-01', diaSemana: 'qui', entradasSaidas: ['0900', '1200'], flags: { feriado: true } }, // feriado
    { data: '2026-01-08', diaSemana: 'qui', entradasSaidas: ['0800', '1100'] }, // atraso
    { data: '2026-01-09', diaSemana: 'sex', entradasSaidas: [], flags: { falta: true } }, // falta
    { data: '2026-01-10', diaSemana: 'sáb', entradasSaidas: ['0800', '1200', '1300', '1800'] } // compensação simples (he50)
  ];

  const mes = engine.calcularMes(dias, cfg, calendario);
  assert.equal(mes.rubricas.trabalhadas, 2640);
  assert.equal(mes.rubricas.extras50, 180);
  assert.equal(mes.rubricas.extras100, 420);
  assert.equal(mes.rubricas.noturnas, 420);
  assert.equal(mes.rubricas.noturnasReduzidas, 480);
  assert.equal(mes.rubricas.adicionalNoturno, 84);
  assert.equal(mes.rubricas.atrasos, 840);
  assert.equal(mes.rubricas.faltas, 480);
  assert.equal(mes.rubricas.dsr, 240);
  assert.equal(mes.rubricas.feriados, 180);
});
