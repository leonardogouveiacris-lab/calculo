const assert = require('assert');

global.CPCommon = { fetchJson: async () => [] };
require('../js/modules/indices-state.js');
require('../js/modules/indices-repository.js');
require('../js/modules/indices-import.js');
const CPIndices = require('../js/modules/indices-service.js');

async function run(){
  CPIndices.saveTable({ id:'t1', nome:'Tabela 1', tipo:'juros', periodicidade:'mensal', serie:[{ competencia:'2026-01', valor:1.2 }] });
  CPIndices.saveTable({ id:'t1', nome:'Tabela 1', tipo:'juros', periodicidade:'mensal', serie:[{ competencia:'2026-01', valor:1.3 }, { competencia:'2026-02', valor:1.4 }] }, { upsert:true });
  const t = CPIndices.getTable('t1');
  assert.strictEqual(t.serie.length, 2);
  assert.strictEqual(CPIndices.getValue('t1', '2026-01'), 1.3);

  CPIndices.saveTable({ id:'tr_bcb_7811', nome:'TR', tipo:'misto', periodicidade:'mensal', serie:[{ competencia:'2026-01', valor:0.2 }] }, { upsert:true });
  CPIndices.saveTable({ id:'meta_selic_432', nome:'Meta Selic', tipo:'juros', periodicidade:'mensal', serie:[{ competencia:'2026-01', valor:10 }] }, { upsert:true });
  const regra = CPIndices.resolveRule('poupanca_auto', { month:'2026-01' });
  assert.ok(regra > 0.6 && regra < 1.2);

  global.CPCommon.fetchJson = async () => ([{ data:'01/01/2026', valor:'0,90' }, { data:'01/02/2026', valor:'1,10' }]);
  const auto = await CPIndices.ensureAutoTable('ipca_bcb_433', '2026-01-01', '2026-02-28');
  assert.strictEqual(auto.id, 'ipca_bcb_433');
  assert.ok((auto.serie || []).length >= 1);

  console.log('ok indices-service');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
