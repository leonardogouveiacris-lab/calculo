(function(global){
  const MODULE_KEY = 'indices';

  function normalizeMonthKey(value){
    const raw = String(value || '').trim();
    const match = raw.match(/^(\d{4})[-\/](\d{1,2})$/);
    if (!match) return '';
    const month = Number(match[2]);
    if (!Number.isInteger(month) || month < 1 || month > 12) return '';
    return match[1] + '-' + String(month).padStart(2, '0');
  }

  function monthRange(startMonth, endMonth){
    if (!startMonth || !endMonth || startMonth > endMonth) return [];
    const result = [];
    let cursor = startMonth;
    while (cursor <= endMonth){
      result.push(cursor);
      const parts = cursor.split('-');
      let year = Number(parts[0]);
      let month = Number(parts[1]) + 1;
      if (month > 12){ month = 1; year += 1; }
      cursor = String(year) + '-' + String(month).padStart(2, '0');
    }
    return result;
  }

  function normalizeIndexTables(list){
    const byId = new Map();
    (Array.isArray(list) ? list : []).forEach(function(table){
      const name = String((table && (table.name || table.nome)) || '').trim();
      const id = String((table && table.id) || name || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
      if (!id) return;
      const previous = byId.get(id) || { id: id, name: name || id, entries: new Map() };
      (Array.isArray(table && table.entries) ? table.entries : []).forEach(function(entry){
        const month = normalizeMonthKey(entry && (entry.month || entry.competencia));
        const value = Number(entry && entry.value);
        const mode = String(entry && (entry.mode || entry.valueMode) || 'percent').toLowerCase() === 'factor' ? 'factor' : 'percent';
        if (!month || !Number.isFinite(value)) return;
        previous.entries.set(month, { month: month, value: value, mode: mode });
      });
      byId.set(id, previous);
    });
    return Array.from(byId.values()).map(function(table){
      return {
        id: table.id,
        name: table.name,
        entries: Array.from(table.entries.values()).sort(function(a, b){ return a.month.localeCompare(b.month); })
      };
    });
  }

  function calculateFactor(options){
    const config = options || {};
    const mode = config.mode === 'simple' ? 'simple' : 'compound';
    const rows = Array.isArray(config.entries) ? config.entries : [];
    const startMonth = normalizeMonthKey(config.startMonth);
    const endMonth = normalizeMonthKey(config.endMonth);
    const map = new Map(rows.map(function(row){
      const month = normalizeMonthKey(row && row.month);
      const value = Number(row && row.value);
      const rowMode = String(row && row.mode || 'percent').toLowerCase() === 'factor' ? 'factor' : 'percent';
      return [month, { value: value, mode: rowMode }];
    }).filter(function(pair){ return pair[0] && Number.isFinite(pair[1].value); }));

    return monthRange(startMonth, endMonth).reduce(function(factor, month){
      const entry = map.get(month);
      if (!entry) return factor;
      const step = entry.mode === 'factor' ? entry.value : (1 + entry.value / 100);
      if (!Number.isFinite(step)) return factor;
      if (mode === 'simple') return factor + (step - 1);
      return factor * step;
    }, 1);
  }

  global.CPCiveisModules = global.CPCiveisModules || {};
  global.CPCiveisModules[MODULE_KEY] = {
    normalizeMonthKey: normalizeMonthKey,
    normalizeIndexTables: normalizeIndexTables,
    calculateFactor: calculateFactor,
    monthRange: monthRange
  };
})(window);
