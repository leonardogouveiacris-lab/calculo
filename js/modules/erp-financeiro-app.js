(function(global){
  'use strict';

  var root = global.CPERPFinanceiro = global.CPERPFinanceiro || {};
  if (root.appModuleLoaded) return;

  var APP_NAME = 'CalculoPro ERP Financeiro';
  var EXPORT_VERSION = 1;

  function isPlainObject(value){
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function deepClone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function getCurrentState(){
    if (isPlainObject(root.state)) return root.state;
    if (typeof root.loadState === 'function') return root.loadState();
    if (typeof root.createEmptyState === 'function') return root.createEmptyState();
    return {};
  }

  function buildExportSnapshot(){
    var source = getCurrentState();
    var migrated = typeof root.migrateState === 'function' ? root.migrateState(source) : source;

    return {
      metadata: {
        app: APP_NAME,
        exportVersion: EXPORT_VERSION,
        schemaVersion: Number(root.STATE_SCHEMA_VERSION) || Number(migrated.schemaVersion) || 1,
        exportedAt: new Date().toISOString()
      },
      state: deepClone(migrated)
    };
  }

  function ensureUniqueEntityIds(collection, collectionName){
    var seen = new Set();
    for (var i = 0; i < collection.length; i++) {
      var entity = collection[i];
      if (!isPlainObject(entity)) {
        throw new Error('A coleção "' + collectionName + '" possui item inválido na posição ' + (i + 1) + '.');
      }

      var id = String(entity.id || '').trim();
      if (!id) {
        throw new Error('A coleção "' + collectionName + '" possui registro sem ID na posição ' + (i + 1) + '.');
      }

      if (seen.has(id)) {
        throw new Error('A coleção "' + collectionName + '" possui ID duplicado: ' + id + '.');
      }
      seen.add(id);
    }
  }

  function validateRelationships(state){
    var vendasById = new Set(state.vendas.map(function(item){ return String(item.id || '').trim(); }).filter(Boolean));
    var lancamentosById = new Set(state.lancamentos.map(function(item){ return String(item.id || '').trim(); }).filter(Boolean));
    var extratosById = new Set(state.extratos.map(function(item){ return String(item.id || '').trim(); }).filter(Boolean));

    state.lancamentos.forEach(function(lan){
      if (!lan || !lan.vendaId) return;
      var vendaId = String(lan.vendaId).trim();
      if (!vendasById.has(vendaId)) {
        throw new Error('Existe lançamento vinculado à venda "' + vendaId + '", mas essa venda não foi encontrada no arquivo.');
      }
    });

    state.conciliacoes.forEach(function(con){
      var extratoId = String(con.extratoId || '').trim();
      var lancamentoId = String(con.lancamentoId || '').trim();
      if (!extratoId || !extratosById.has(extratoId)) {
        throw new Error('Existe conciliação apontando para extrato inexistente: "' + (extratoId || 'vazio') + '".');
      }
      if (lancamentoId && !lancamentosById.has(lancamentoId)) {
        throw new Error('Existe conciliação apontando para lançamento inexistente: "' + lancamentoId + '".');
      }
    });
  }

  function normalizeImportPayload(payload){
    var input = payload;
    if (typeof input === 'string') {
      try {
        input = JSON.parse(input);
      } catch (_error) {
        throw new Error('Não foi possível ler o JSON enviado. Verifique se o conteúdo está válido.');
      }
    }

    if (!isPlainObject(input)) {
      throw new Error('Formato inválido. Envie um objeto JSON com "metadata" e "state".');
    }

    var hasStateEnvelope = isPlainObject(input.state);
    var hasMetadataEnvelope = !('metadata' in input) || isPlainObject(input.metadata);
    if (!hasMetadataEnvelope) {
      throw new Error('Campo "metadata" inválido. Esperado um objeto com os metadados da exportação.');
    }

    var rawState = hasStateEnvelope ? input.state : input;
    var migrated = typeof root.migrateState === 'function' ? root.migrateState(rawState) : rawState;

    if (!isPlainObject(migrated)) {
      throw new Error('Não foi possível normalizar o estado ERP importado.');
    }

    var requiredArrays = [
      'lancamentos',
      'clientes',
      'fornecedores',
      'produtos',
      'vendas',
      'extratos',
      'conciliacoes',
      'historicoConciliacao'
    ];

    requiredArrays.forEach(function(key){
      if (!Array.isArray(migrated[key])) {
        throw new Error('Estrutura inválida: o campo "' + key + '" deve ser uma lista.');
      }
    });

    requiredArrays.forEach(function(key){
      ensureUniqueEntityIds(migrated[key], key);
    });

    validateRelationships(migrated);
    return migrated;
  }

  function exportERPJson(){
    return JSON.stringify(buildExportSnapshot(), null, 2);
  }

  function importERPJson(payload){
    try {
      var normalized = normalizeImportPayload(payload);
      root.state = normalized;
      if (typeof root.saveState === 'function') root.saveState(normalized);
      global.dispatchEvent(new CustomEvent('cp:erp-state-imported'));
      return {
        ok: true,
        message: 'Importação concluída com sucesso. Os dados já foram persistidos e serão mantidos após recarregar a página.'
      };
    } catch (error) {
      return {
        ok: false,
        message: 'Não foi possível importar: ' + (error && error.message ? error.message : 'payload inválido.')
      };
    }
  }

  root.exportERPJson = exportERPJson;
  root.importERPJson = importERPJson;
  root.appModuleLoaded = true;
})(window);
