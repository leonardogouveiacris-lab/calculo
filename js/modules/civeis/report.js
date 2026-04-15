(function(global){
  const MODULE_KEY = 'report';

  function formatMoney(value){
    return Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function renderSummaryTable(summary){
    const info = summary || {};
    return '' +
      '<table class="report-table">' +
      '<thead><tr><th>Item</th><th class="right">Valor</th></tr></thead>' +
      '<tbody>' +
      '<tr><td>Valor devido</td><td class="right">' + formatMoney(info.launches && info.launches.valorDevido) + '</td></tr>' +
      '<tr><td>Honorários</td><td class="right">' + formatMoney(info.honorarios) + '</td></tr>' +
      '<tr><td>Custas</td><td class="right">' + formatMoney(info.custas) + '</td></tr>' +
      '</tbody>' +
      '<tfoot><tr><td><b>Total geral</b></td><td class="right"><b>' + formatMoney(info.totalGeral) + '</b></td></tr></tfoot>' +
      '</table>';
  }

  function renderReport(data){
    const payload = data || {};
    const summary = payload.summary || {};
    return '' +
      '<section class="report-launch">' +
      '<h3>Relatório do cálculo cível</h3>' +
      '<div><b>Processo:</b> ' + String(payload.processo || '—') + '</div>' +
      renderSummaryTable(summary) +
      '</section>';
  }

  function printReport(root, html, printer){
    if (root && typeof root.innerHTML === 'string') root.innerHTML = String(html || '');
    if (printer && typeof printer.print === 'function') printer.print();
  }

  global.CPCiveisModules = global.CPCiveisModules || {};
  global.CPCiveisModules[MODULE_KEY] = {
    renderReport: renderReport,
    renderSummaryTable: renderSummaryTable,
    printReport: printReport
  };
})(window);
