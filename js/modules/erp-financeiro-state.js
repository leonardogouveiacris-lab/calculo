(function(global){
  'use strict';

  var root = global.CPERPFinanceiro = global.CPERPFinanceiro || {};
  if (root.stateModuleLoaded) return;

  var STORAGE_KEY = 'cp.erpFinanceiro.state';
  var SCHEMA_VERSION = 1;
  var idCounter = 0;

  var ENTITY_PREFIX = {
    lancamentos: 'lan',
    clientes: 'cli',
    fornecedores: 'for',
    produtos: 'pro',
    vendas: 'ven',
    extratos: 'ext',
    conciliacoes: 'con',
    historicoConciliacao: 'hco'
  };

  function createEmptyState(){
    return {
      schemaVersion: SCHEMA_VERSION,
      lancamentos: [],
      clientes: [],
      fornecedores: [],
      produtos: [],
      vendas: [],
      extratos: [],
      conciliacoes: [],
      historicoConciliacao: []
    };
  }

  function deepClone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeArray(value){
    return Array.isArray(value) ? value : [];
  }

  function normalizeState(input){
    var parsed = input && typeof input === 'object' ? input : {};

    return {
      schemaVersion: Number(parsed.schemaVersion) || SCHEMA_VERSION,
      lancamentos: normalizeArray(parsed.lancamentos),
      clientes: normalizeArray(parsed.clientes),
      fornecedores: normalizeArray(parsed.fornecedores),
      produtos: normalizeArray(parsed.produtos),
      vendas: normalizeArray(parsed.vendas),
      extratos: normalizeArray(parsed.extratos),
      conciliacoes: normalizeArray(parsed.conciliacoes),
      historicoConciliacao: normalizeArray(parsed.historicoConciliacao)
    };
  }

  function migrateState(input){
    var normalized = normalizeState(input);
    var current = {
      schemaVersion: normalized.schemaVersion,
      lancamentos: normalized.lancamentos,
      clientes: normalized.clientes,
      fornecedores: normalized.fornecedores,
      produtos: normalized.produtos,
      vendas: normalized.vendas,
      extratos: normalized.extratos,
      conciliacoes: normalized.conciliacoes,
      historicoConciliacao: normalized.historicoConciliacao
    };

    if (current.schemaVersion < 1) {
      current.schemaVersion = 1;
    }

    if (current.schemaVersion > SCHEMA_VERSION) {
      console.warn('[CPERPFinanceiro] Schema mais novo detectado:', current.schemaVersion, '>', SCHEMA_VERSION);
    }

    current.schemaVersion = SCHEMA_VERSION;
    return current;
  }

  function getStorageApi(){
    if (global.CPCommon && global.CPCommon.storage) return global.CPCommon.storage;

    return {
      load: function(_key, fallback){
        return fallback;
      },
      save: function(_key, _value){
        return false;
      }
    };
  }

  function loadState(){
    var storage = getStorageApi();
    var fallback = createEmptyState();

    var raw = storage.load(STORAGE_KEY, fallback, function(parsed){
      return migrateState(parsed);
    });

    return migrateState(raw);
  }

  function saveState(state){
    var storage = getStorageApi();
    var payload = migrateState(state);
    return storage.save(STORAGE_KEY, payload);
  }

  function randomSuffix(){
    try {
      if (global.crypto && typeof global.crypto.getRandomValues === 'function') {
        var buffer = new Uint32Array(1);
        global.crypto.getRandomValues(buffer);
        return buffer[0].toString(36).padStart(7, '0').slice(0, 7);
      }
    } catch (_error) {}

    return Math.floor(Math.random() * 2176782336).toString(36).padStart(7, '0').slice(0, 7);
  }

  function entityPrefix(entityType){
    var key = String(entityType || '').trim();
    if (ENTITY_PREFIX[key]) return ENTITY_PREFIX[key];
    if (!key) return 'gen';
    return key.slice(0, 3).toLowerCase();
  }

  function generateEntityId(entityType){
    idCounter = (idCounter + 1) % 1679616;
    var prefix = entityPrefix(entityType);
    var ts = Date.now().toString(36);
    var cnt = idCounter.toString(36).padStart(4, '0');
    return prefix + '_' + ts + '_' + cnt + '_' + randomSuffix();
  }

  root.STATE_STORAGE_KEY = STORAGE_KEY;
  root.STATE_SCHEMA_VERSION = SCHEMA_VERSION;
  root.ENTITY_PREFIX = deepClone(ENTITY_PREFIX);
  root.createEmptyState = createEmptyState;
  root.migrateState = migrateState;
  root.loadState = loadState;
  root.saveState = saveState;
  root.generateEntityId = generateEntityId;
  root.state = loadState();
  root.stateModuleLoaded = true;
})(window);
