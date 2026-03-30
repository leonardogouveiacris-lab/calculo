(function(global){
  'use strict';
  if (global.CPIndicesRepositoryLoaded) return;
  var STORAGE_KEY = 'calculopro.indices.repository.v1';

  function getStorage(){
    if (global.localStorage) return global.localStorage;
    var mem = {};
    return {
      getItem: function(k){ return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      setItem: function(k, v){ mem[k] = String(v); }
    };
  }

  function createRepository(opts){
    var storageKey = opts && opts.storageKey ? String(opts.storageKey) : STORAGE_KEY;
    var storage = getStorage();
    function load(){
      try {
        var raw = storage.getItem(storageKey);
        if (!raw) return { tables: [], rules: [] };
        var parsed = JSON.parse(raw);
        return { tables: Array.isArray(parsed.tables) ? parsed.tables : [], rules: Array.isArray(parsed.rules) ? parsed.rules : [] };
      } catch (_e){ return { tables: [], rules: [] }; }
    }
    function save(data){ storage.setItem(storageKey, JSON.stringify(data)); return true; }
    return {
      load: load,
      save: save,
      clear: function(){ return save({ tables: [], rules: [] }); }
    };
  }

  global.CPIndicesRepository = { createRepository: createRepository, STORAGE_KEY: STORAGE_KEY };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.CPIndicesRepository;
  global.CPIndicesRepositoryLoaded = true;
})(typeof window !== 'undefined' ? window : globalThis);
