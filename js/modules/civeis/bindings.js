(function(global){
  const MODULE_KEY = 'bindings';

  function byId(id, root){
    const ctx = root || global.document;
    return ctx && typeof ctx.getElementById === 'function' ? ctx.getElementById(id) : null;
  }

  function bindInput(id, handler, root){
    const node = byId(id, root);
    if (!node || typeof node.addEventListener !== 'function') return null;
    node.addEventListener('input', handler);
    return node;
  }

  function bindClick(id, handler, root){
    const node = byId(id, root);
    if (!node || typeof node.addEventListener !== 'function') return null;
    node.addEventListener('click', handler);
    return node;
  }

  function bindAll(bindings, root){
    return (Array.isArray(bindings) ? bindings : []).map(function(item){
      if (!item || !item.id || typeof item.handler !== 'function') return null;
      if (item.type === 'input') return bindInput(item.id, item.handler, root);
      return bindClick(item.id, item.handler, root);
    });
  }

  global.CPCiveisModules = global.CPCiveisModules || {};
  global.CPCiveisModules[MODULE_KEY] = {
    byId: byId,
    bindInput: bindInput,
    bindClick: bindClick,
    bindAll: bindAll
  };
})(window);
