const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPontoModules } = require('./helpers');

const { utils } = loadPontoModules();

test('parseDurationToMinutes e formatMinutes cobrem cenários de tempo e arredondamento', () => {
  assert.equal(utils.parseDurationToMinutes('08:30'), 510);
  assert.equal(utils.parseDurationToMinutes('0830'), 510);
  assert.equal(utils.parseDurationToMinutes('1,5'), 90);
  assert.equal(utils.parseDurationToMinutes('-01:15'), -75);
  assert.equal(utils.parseDurationToMinutes('abc'), 0);

  assert.equal(utils.formatMinutes(510), '08:30');
  assert.equal(utils.formatMinutes(-75), '-01:15');
  assert.equal(utils.maskTime('0830'), '08:30');
});
