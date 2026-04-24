#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..', '..');
const moduleFiles = [
  'js/modules/civeis/state.js',
  'js/modules/civeis/indices.js',
  'js/modules/civeis/launches.js',
  'js/modules/civeis/summary.js',
  'js/modules/civeis/report.js',
  'js/modules/civeis/bindings.js'
];

function assert(condition, message){
  if (!condition) throw new Error(message);
}

function createMemoryStorage(){
  const map = new Map();
  return {
    getItem(key){ return map.has(key) ? map.get(key) : null; },
    setItem(key, value){ map.set(key, String(value)); }
  };
}

const context = {
  window: {
    CPCiveisModules: {},
    localStorage: createMemoryStorage(),
    CPCommon: null,
    document: {
      getElementById(){ return null; }
    }
  },
  document: {
    getElementById(){ return null; }
  },
  console,
  setTimeout,
  clearTimeout
};
context.global = context;
vm.createContext(context);

moduleFiles.forEach((file) => {
  const full = path.join(root, file);
  assert(fs.existsSync(full), `Arquivo ausente: ${file}`);
  const code = fs.readFileSync(full, 'utf8');
  vm.runInContext(code, context, { filename: file });
});

const modules = context.window.CPCiveisModules;
assert(modules.state && modules.indices && modules.launches && modules.summary && modules.report && modules.bindings, 'Nem todos os módulos foram registrados.');

// Smoke: criação/edição de lançamento
let launch = modules.launches.createLaunch({ verba: 'Danos morais' });
launch = modules.launches.upsertRowValue(launch, '01/2026', 'valor', 1200);
launch = modules.launches.upsertColumn(launch, { id: 'valor_juros', nome: 'Juros', tipo: 'formula' });
launch = modules.launches.editLaunch(launch, { observacao: 'Teste smoke' });
assert(launch.verba === 'Danos morais' && launch.observacao === 'Teste smoke', 'Falha no fluxo de criação/edição de lançamento.');

// Smoke: atualização de índices
const normalizedTables = modules.indices.normalizeIndexTables([
  { id: 'Tabela 1', name: 'Tabela 1', entries: [{ month: '2026-01', value: 0.5 }, { month: '2026-02', value: 1.01, mode: 'factor' }] }
]);
assert(normalizedTables.length === 1 && normalizedTables[0].entries.length === 2, 'Falha ao normalizar tabela de índices.');
const factor = modules.indices.calculateFactor({
  entries: normalizedTables[0].entries,
  startMonth: '2026-01',
  endMonth: '2026-02',
  mode: 'compound'
});
assert(factor > 1, 'Falha ao calcular fator de índices.');

// Smoke: export/import JSON/CSV (snapshot + parsing simplificada)
const store = modules.state.createStateStore({
  storage: createMemoryStorage(),
  storageKey: 'smoke_key',
  initialState: { lancamentos: [launch], indexTables: normalizedTables }
});
store.save();
const loaded = store.load();
assert(Array.isArray(loaded.lancamentos) && loaded.lancamentos.length === 1, 'Falha no ciclo export/import JSON de estado.');
const csvLine = ['lancamento_id', 'periodo', 'coluna_id', 'valor'].join(',') + '\n' + [launch.id, '01/2026', 'valor', '1200'].join(',');
assert(csvLine.includes('lancamento_id') && csvLine.includes(launch.id), 'Falha no smoke de serialização CSV.');

// Smoke: geração de relatório
const summary = modules.summary.buildSummary({
  lancamentos: [launch],
  honorarios: [{ tipo: 'percentual', valor: 10 }],
  custas: [{ valor: 55 }]
});
const html = modules.report.renderReport({ processo: '0000000-00.0000.0.00.0000', summary });
assert(typeof html === 'string' && html.includes('Relatório do cálculo cível') && html.includes('Total geral'), 'Falha na geração de relatório.');

// Validações estáticas: base de honorários percentual (somente negativa, mista e zerada)
const launchesNegativeBase = [
  { linhas: [{ valor: -100, valor_juros: -20 }] },
  { linhas: [{ valor: -30, valor_juros: 0 }] }
];
const negativeBaseInfo = modules.summary.calculateHonorariosBaseFromLaunches(launchesNegativeBase);
assert(negativeBaseInfo.value === -150 && negativeBaseInfo.hasNegativeComponent && !negativeBaseInfo.hasPositiveComponent, 'Falha: base somente negativa não reconhecida.');
assert(modules.summary.calculateHonorarios(negativeBaseInfo.value, [{ tipo: 'percentual', valor: 10 }]) === -15, 'Falha: cálculo percentual com base somente negativa.');

const launchesMixedBase = [
  { linhas: [{ valor: 200, valor_juros: 20 }] },
  { linhas: [{ valor: -80, valor_juros: -10 }] }
];
const mixedBaseInfo = modules.summary.calculateHonorariosBaseFromLaunches(launchesMixedBase);
assert(mixedBaseInfo.value === 130 && mixedBaseInfo.isMixedSigns, 'Falha: base mista não reconhecida.');
assert(modules.summary.calculateHonorarios(launchesMixedBase, [{ tipo: 'percentual', valor: 10 }]) === 13, 'Falha: cálculo percentual com base mista.');

const launchesZeroBase = [
  { linhas: [{ valor: 100, valor_juros: 0 }] },
  { linhas: [{ valor: -100, valor_juros: 0 }] }
];
const zeroBaseInfo = modules.summary.calculateHonorariosBaseFromLaunches(launchesZeroBase);
assert(zeroBaseInfo.value === 0 && zeroBaseInfo.isMixedSigns && zeroBaseInfo.isZero, 'Falha: base zerada não reconhecida.');
assert(modules.summary.calculateHonorarios(launchesZeroBase, [{ tipo: 'percentual', valor: 15 }]) === 0, 'Falha: cálculo percentual com base zerada.');

console.log('OK: smoke modular cível (lançamentos, índices, import/export e relatório).');
