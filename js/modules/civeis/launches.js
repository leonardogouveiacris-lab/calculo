(function(global){
  const MODULE_KEY = 'launches';

  const BASE_COLUMNS = [
    { id: 'data', nome: 'Data', tipo: 'periodo', formato: 'texto', locked: true },
    { id: 'valor', nome: 'Valor', tipo: 'input', formato: 'moeda', locked: true }
  ];

  function uid(prefix){
    return String(prefix || 'id') + '_' + Math.random().toString(16).slice(2, 10);
  }

  function normalizeRows(rows){
    return (Array.isArray(rows) ? rows : []).map(function(row){
      return Object.assign({ periodo: '', valor: 0 }, row || {});
    });
  }

  function createLaunch(payload){
    const source = payload || {};
    return {
      id: source.id || uid('lancamento'),
      verba: String(source.verba || 'Nova verba'),
      observacao: String(source.observacao || ''),
      dataInicial: String(source.dataInicial || ''),
      dataFinal: String(source.dataFinal || ''),
      colunas: Array.isArray(source.colunas) && source.colunas.length ? source.colunas.slice() : BASE_COLUMNS.slice(),
      linhas: normalizeRows(source.linhas)
    };
  }

  function editLaunch(launch, patch){
    return createLaunch(Object.assign({}, launch || {}, patch || {}));
  }

  function upsertColumn(launch, column){
    const base = createLaunch(launch);
    const next = Object.assign({ id: uid('coluna'), nome: 'Nova coluna', tipo: 'input', formato: 'moeda' }, column || {});
    const index = base.colunas.findIndex(function(item){ return item.id === next.id; });
    if (index >= 0) base.colunas[index] = Object.assign({}, base.colunas[index], next);
    else base.colunas.push(next);
    return base;
  }

  function upsertRowValue(launch, period, columnId, value){
    const base = createLaunch(launch);
    const key = String(period || '').trim();
    const col = String(columnId || '').trim() || 'valor';
    const rowIndex = base.linhas.findIndex(function(item){ return String(item.periodo || '') === key; });
    const row = rowIndex >= 0 ? Object.assign({}, base.linhas[rowIndex]) : { periodo: key, valor: 0 };
    row[col] = value;
    if (rowIndex >= 0) base.linhas[rowIndex] = row;
    else base.linhas.push(row);
    return base;
  }

  global.CPCiveisModules = global.CPCiveisModules || {};
  global.CPCiveisModules[MODULE_KEY] = {
    BASE_COLUMNS: BASE_COLUMNS,
    createLaunch: createLaunch,
    editLaunch: editLaunch,
    upsertColumn: upsertColumn,
    upsertRowValue: upsertRowValue
  };
})(window);
