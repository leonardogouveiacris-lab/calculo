const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadPontoModules } = require('./helpers');

const { engine } = loadPontoModules();

function parseCsv(text){
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const cols = header.split(',');
  return lines.map((line) => {
    const values = [];
    let cur = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ',' && !inQuotes) { values.push(cur); cur = ''; }
      else cur += ch;
    }
    values.push(cur);
    return Object.fromEntries(cols.map((c, i) => [c, values[i] || '']));
  });
}

test('dataset histórico (origem Excel) fecha com resultados esperados', () => {
  const csv = fs.readFileSync(path.resolve(__dirname, 'fixtures/historico-validacao.csv'), 'utf8');
  const rows = parseCsv(csv);

  rows.forEach((row) => {
    const entradasSaidas = row.entradasSaidas ? row.entradasSaidas.split('|') : [];
    const { rubricas } = engine.calcularDia({ data: row.data, diaSemana: row.diaSemana, entradasSaidas, flags: { falta: !row.entradasSaidas } }, { jornadaDiariaMin: 480, adicionalNoturnoPercentual: 20, reducaoNoturnaFator: 60/52.5 });

    Object.keys(rubricas).forEach((key) => {
      assert.equal(rubricas[key], Number(row[`esperado_${key}`]), `Divergência em ${row.data} para ${key}`);
    });
  });
});
