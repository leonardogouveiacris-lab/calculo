(function(global){
  const MODULE_KEY = 'state';
  const DEFAULT_STORAGE_KEY = 'cp_civeis_inicial_v6';
  const DEFAULT_LEGACY_STORAGE_KEYS = ['cp_civeis_inicial_v5', 'cp_civeis_inicial_v3'];

  function safeJsonParse(raw){
    if (!raw || typeof raw !== 'string') return null;
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }

  function nowISODate(){
    return new Date().toISOString().slice(0, 10);
  }

  function createInitialState(){
    return {
      requerente: '',
      requerido: '',
      processo: '',
      ajuizamento: '',
      dataAtualizacao: nowISODate(),
      observacoes: '',
      lancamentos: [],
      lancamentoSelecionadoId: '',
      honorarios: [],
      custas: [],
      indexTables: [],
      atualizadoEm: ''
    };
  }

  function normalizeSnapshot(snapshot){
    const base = createInitialState();
    const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
    return Object.assign(base, source, {
      lancamentos: Array.isArray(source.lancamentos) ? source.lancamentos : [],
      honorarios: Array.isArray(source.honorarios) ? source.honorarios : base.honorarios,
      custas: Array.isArray(source.custas) ? source.custas : base.custas,
      indexTables: Array.isArray(source.indexTables) ? source.indexTables : base.indexTables,
      dataAtualizacao: source.dataAtualizacao || base.dataAtualizacao
    });
  }

  function resolveStorage(storage){
    if (storage) return storage;
    if (global.CPCommon && global.CPCommon.storage) {
      return {
        getItem: function(key){
          const value = global.CPCommon.storage.load(key, null);
          return value == null ? null : JSON.stringify(value);
        },
        setItem: function(key, value){
          const parsed = safeJsonParse(value);
          global.CPCommon.storage.save(key, parsed == null ? value : parsed);
        }
      };
    }
    if (global.localStorage) return global.localStorage;
    return {
      getItem: function(){ return null; },
      setItem: function(){ }
    };
  }

  function saveSnapshot(storage, storageKey, data){
    resolveStorage(storage).setItem(storageKey || DEFAULT_STORAGE_KEY, JSON.stringify(normalizeSnapshot(data)));
  }

  function loadSnapshot(storage, storageKey, legacyStorageKeys){
    const store = resolveStorage(storage);
    const preferred = [storageKey || DEFAULT_STORAGE_KEY].concat(Array.isArray(legacyStorageKeys) ? legacyStorageKeys : DEFAULT_LEGACY_STORAGE_KEYS);
    for (let index = 0; index < preferred.length; index += 1){
      const value = safeJsonParse(store.getItem(preferred[index]));
      if (value && Object.keys(value).length) return normalizeSnapshot(value);
    }
    return createInitialState();
  }

  function createStateStore(options){
    const config = options || {};
    const storage = resolveStorage(config.storage);
    const storageKey = config.storageKey || DEFAULT_STORAGE_KEY;
    const legacyStorageKeys = Array.isArray(config.legacyStorageKeys) ? config.legacyStorageKeys : DEFAULT_LEGACY_STORAGE_KEYS;
    let state = normalizeSnapshot(config.initialState || createInitialState());

    return {
      get: function(){ return normalizeSnapshot(state); },
      set: function(nextState){ state = normalizeSnapshot(nextState); return this.get(); },
      patch: function(partial){ state = normalizeSnapshot(Object.assign({}, state, partial || {})); return this.get(); },
      save: function(){ saveSnapshot(storage, storageKey, state); return this.get(); },
      load: function(){ state = loadSnapshot(storage, storageKey, legacyStorageKeys); return this.get(); },
      toJSON: function(){ return JSON.stringify(state); }
    };
  }

  const api = {
    DEFAULT_STORAGE_KEY: DEFAULT_STORAGE_KEY,
    DEFAULT_LEGACY_STORAGE_KEYS: DEFAULT_LEGACY_STORAGE_KEYS,
    createInitialState: createInitialState,
    normalizeSnapshot: normalizeSnapshot,
    createStateStore: createStateStore,
    saveSnapshot: saveSnapshot,
    loadSnapshot: loadSnapshot
  };

  global.CPCiveisModules = global.CPCiveisModules || {};
  global.CPCiveisModules[MODULE_KEY] = api;
})(window);
