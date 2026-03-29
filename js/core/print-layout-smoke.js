(function(global){
  'use strict';
  function createRows(size){
    var rows = [];
    for (var i = 0; i < size; i += 1){
      rows.push('<tr><td>' + (i + 1) + '</td><td>Linha longa de validação ' + (i + 1) + ' com texto adicional para medição.</td><td class="right">' + (1000 + i) + '</td></tr>');
    }
    return rows;
  }

  global.CPPrintLayoutSmoke = {
    run: function(root){
      if (!global.CPPrintLayout || !root) return { ok:false, reason:'CPPrintLayout/root indisponível' };
      var layout = CPPrintLayout.createLayout({
        root: root,
        title: 'SMOKE TEST',
        meta: 'Validação automática de paginação',
        branding: CPPrintLayout.resolveBranding({}),
        contextName: 'print-smoke',
        documentTitle: 'Print Smoke'
      });

      CPPrintLayout.appendSection(layout, {
        title: 'Texto extenso',
        html: '<p>' + new Array(40).fill('Bloco de validação de quebra.').join(' ') + '</p>'
      });

      CPPrintLayout.appendTable(layout, {
        title: 'Tabela longa',
        columns: ['#', 'Descrição', 'Valor'],
        rows: createRows(140),
        tableClass: 'report-table',
        continuationLabel: 'Tabela longa (continuação)'
      });

      var result = CPPrintLayout.measureAndPaginate(layout);
      return { ok: result.issues.length === 0, result: result };
    }
  };
})(window);
