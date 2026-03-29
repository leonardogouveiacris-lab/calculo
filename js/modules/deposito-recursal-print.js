(function(global){
  'use strict';
  if (global.CPDepositoRecursalPrintLoaded) return;

  const ns = global.CPDepositoRecursal = global.CPDepositoRecursal || {};

  ns.attachPrint = function(ctx){
    const { state, fmtBRL, toDateBR, monthLabel } = ctx;

    function rowHtml(cells){
      return '<tr>' + cells.map(function(cell){
        return '<td class="' + (cell.cls || '') + '">' + (cell.text == null ? '' : cell.text) + '</td>';
      }).join('') + '</tr>';
    }

    function createLayout(result){
      return CPPrintLayout.createLayout({
        root: document.getElementById('reportRoot'),
        title: 'ATUALIZAÇÃO BANCÁRIA — DEPÓSITO RECURSAL',
        meta: 'Índice bancário: ' + (result.indexLabel || '-') + ' • Data final: ' + (result.end ? toDateBR(result.end) : '-') + ' • Total atualizado: ' + fmtBRL(result.totalUpdated || 0),
        branding: ctx.getReportBranding(),
        contextName: 'deposito-recursal-print',
        documentTitle: 'Atualização Bancária - Depósito Recursal'
      });
    }

    function appendIntro(layout, result){
      CPPrintLayout.appendSection(layout, {
        title: 'Informações do processo',
        html: '<table class="report-table kv-like"><tbody>' +
          rowHtml([{ cls:'bold', text:'Reclamante' }, { text: state.info.reclamante || '-' }]) +
          rowHtml([{ cls:'bold', text:'Reclamada' }, { text: state.info.reclamada || '-' }]) +
          rowHtml([{ cls:'bold', text:'Processo' }, { text: state.info.processo || '-' }]) +
        '</tbody></table>'
      });
      CPPrintLayout.appendSection(layout, {
        title: 'Informações do cálculo',
        html: '<table class="report-table kv-like"><tbody>' +
          rowHtml([{ cls:'bold', text:'Índice bancário' }, { text: result.indexLabel || '-' }]) +
          rowHtml([{ cls:'bold', text:'Data final' }, { text: result.end ? toDateBR(result.end) : '-' }]) +
          rowHtml([{ cls:'bold', text:'Total atualizado' }, { text: fmtBRL(result.totalUpdated || 0) }]) +
        '</tbody></table>'
      });
    }

    function buildDetailRows(dep, lines){
      return (lines || []).map(function(line){
        const idxText = (line.idxMes * 100).toLocaleString('pt-BR', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
        return rowHtml([
          { text: line.i === 0 ? toDateBR(dep.date) : '-', cls: 'center' },
          { text: line.i === 0 ? fmtBRL(dep.value) : '-', cls: 'right' },
          { text: idxText, cls: 'right' },
          { text: monthLabel(line.mk), cls: 'center' },
          { text: fmtBRL(line.saldoAnterior), cls: 'right' },
          { text: fmtBRL(line.jurosMes), cls: 'right' },
          { text: fmtBRL(line.saldo), cls: 'right bold' }
        ]);
      });
    }

    function appendDepositTables(layout, result){
      (result.depBlocks || []).forEach(function(block){
        CPPrintLayout.appendTable(layout, {
          title: 'Depósito em ' + toDateBR(block.dep.date) + ' • ' + fmtBRL(block.dep.value) + (block.dep.obs ? ' • ' + block.dep.obs : ''),
          continuationLabel: 'Depósito em ' + toDateBR(block.dep.date) + ' (continuação)',
          smallTitle: true,
          tableClass: 'report-table dep-detail-table',
          columns: [
            'Data do Depósito',
            'Valor Depositado',
            'Índice (%)',
            'Data da Atualização',
            'Saldo Anterior',
            'Juros/Atualização',
            'Valor Atualizado'
          ],
          rows: buildDetailRows(block.dep, block.lines),
          tfootHtml: '<tr><td colspan="6" class="bold right">Subtotal atualizado</td><td class="bold right">' + fmtBRL(block.subtotal || 0) + '</td></tr>'
        });
      });
    }

    function appendSources(layout, result){
      const wrap = document.createElement('div');
      wrap.innerHTML = ctx.fontesHTML(result.indexType) || '';
      const content = Array.from(wrap.children).map(function(item){ return item.outerHTML; }).join('') || (wrap.textContent || '').trim();
      CPPrintLayout.appendSection(layout, {
        title: 'Fontes dos índices utilizados',
        html: content || 'Sem informações adicionais.'
      });
    }

    async function renderReport(result){
      if (!result) return;
      const reportRoot = document.getElementById('reportRoot');
      if (!reportRoot) return ctx.toast('Erro', 'Área de relatório não encontrada.', 'err');
      ctx.switchTab('report');
      const layout = createLayout(result);
      appendIntro(layout, result);
      appendDepositTables(layout, result);
      appendSources(layout, result);
      CPPrintLayout.applyReportBranding(reportRoot, ctx.getReportBranding());
      await CPPrintLayout.waitForLayout(reportRoot);
      reportRoot.scrollIntoView({ behavior:'smooth', block:'start' });
    }

    async function openPrintWindow(){
      const reportRoot = document.getElementById('reportRoot');
      if (!reportRoot || !reportRoot.querySelector('.page')) {
        return ctx.toast('Erro', 'Gere o relatório antes de imprimir.', 'err');
      }
      if (!global.CPPrintLayout || !global.CPPrintLayout.finalizeAndPrint) {
        return ctx.toast('Erro', 'Engine de impressão indisponível.', 'err');
      }
      const fakeResult = ctx.calc && ctx.calc();
      if (!fakeResult) return ctx.toast('Erro', 'Não foi possível preparar impressão.', 'err');
      const layout = createLayout(fakeResult);
      appendIntro(layout, fakeResult);
      appendDepositTables(layout, fakeResult);
      appendSources(layout, fakeResult);
      return CPPrintLayout.finalizeAndPrint(layout, {
        contextName: 'deposito-recursal-print',
        title: 'Atualização Bancária - Depósito Recursal'
      });
    }

    Object.assign(ctx, { renderReport, openPrintWindow });
  };

  global.CPDepositoRecursalPrintLoaded = true;
})(window);
