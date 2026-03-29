(function(global){
  'use strict';
  if (global.CPDepositoRecursalPrintLoaded) return;

  const ns = global.CPDepositoRecursal = global.CPDepositoRecursal || {};

  ns.attachPrint = function(ctx){
    const { state, fmtBRL, toDateBR, monthLabel } = ctx;
    const DETAIL_LINES_FIRST_PAGE = 18;
    const DETAIL_LINES_NEXT_PAGES = 24;
    const MIN_LINES_LAST_PAGE = 3;


    function el(tag, className, text){
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text != null) node.textContent = text;
      return node;
    }

    function makePage(rootEl, result, pageIndex, includeTitle){
      return global.CPPrintLayout.createPage(rootEl, {
        pageIndex: pageIndex,
        includeTitle: includeTitle,
        title: 'ATUALIZAÇÃO BANCÁRIA — DEPÓSITO RECURSAL',
        meta: 'Índice bancário: ' + (result.indexLabel || '-') + ' • Data final: ' + (result.end ? toDateBR(result.end) : '-') + ' • Total atualizado: ' + fmtBRL(result.totalUpdated || 0),
        logo: ctx.getReportBranding().logo,
        header: ctx.getReportBranding().header,
        footer: ctx.getReportBranding().footer,
        contentHtml: ''
      });
    }

    function pageContent(page){
      return page.querySelector('.content');
    }

    function appendNode(page, node){
      pageContent(page).appendChild(node);
      return node;
    }

    function sectionTitle(text, small){
      return el(small ? 'div' : 'h3', small ? 'sec-title sec-title-small' : 'sec-title', text);
    }

    function detailHeadingText(dep, continuation){
      return 'Depósito em ' + toDateBR(dep.date) + ' • ' + fmtBRL(dep.value) + (dep.obs ? ' • ' + dep.obs : '') + (continuation ? ' (continuação)' : '');
    }

    function createKVTable(rows){
      const table = el('table', 'report-table kv-like');
      const tbody = document.createElement('tbody');
      rows.forEach(function(row){
        const tr = document.createElement('tr');
        const tdLabel = el('td', 'bold', row.label);
        tdLabel.style.width = '34%';
        const tdValue = el('td', '', row.value || '-');
        tr.appendChild(tdLabel);
        tr.appendChild(tdValue);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      return table;
    }

    function createDetailTable(){
      const table = el('table', 'report-table dep-detail-table');
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');
      [
        'Data do Depósito',
        'Valor Depositado',
        'Índice (%)',
        'Data da Atualização',
        'Saldo Anterior',
        'Juros/Atualização',
        'Valor Atualizado'
      ].forEach(function(title){
        tr.appendChild(el('th', '', title));
      });
      thead.appendChild(tr);
      table.appendChild(thead);
      table.appendChild(document.createElement('tbody'));
      return table;
    }

    function createDetailRow(line, dep){
      const tr = document.createElement('tr');
      const idxText = (line.idxMes * 100).toLocaleString('pt-BR', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
      [
        { text: line.i === 0 ? toDateBR(dep.date) : '-', cls: 'center' },
        { text: line.i === 0 ? fmtBRL(dep.value) : '-', cls: 'right' },
        { text: idxText, cls: 'right' },
        { text: monthLabel(line.mk), cls: 'center' },
        { text: fmtBRL(line.saldoAnterior), cls: 'right' },
        { text: fmtBRL(line.jurosMes), cls: 'right' },
        { text: fmtBRL(line.saldo), cls: 'right bold' }
      ].forEach(function(cell){
        tr.appendChild(el('td', cell.cls, cell.text));
      });
      return tr;
    }

    function appendIntro(page, result){
      [
        sectionTitle('Informações do processo'),
        createKVTable([
          { label: 'Reclamante', value: state.info.reclamante || '-' },
          { label: 'Reclamada', value: state.info.reclamada || '-' },
          { label: 'Processo', value: state.info.processo || '-' }
        ]),
        sectionTitle('Informações do cálculo'),
        createKVTable([
          { label: 'Índice bancário', value: result.indexLabel || '-' },
          { label: 'Data final', value: result.end ? toDateBR(result.end) : '-' },
          { label: 'Total atualizado', value: fmtBRL(result.totalUpdated || 0) }
        ]),
        sectionTitle('Detalhamento por depósito')
      ].forEach(function(node){ appendNode(page, node); });
    }

    function appendDetailPage(rootEl, result, pageIndex, dep, lines, continuation){
      const page = makePage(rootEl, result, pageIndex, false);
      appendNode(page, sectionTitle(detailHeadingText(dep, continuation), true));
      const table = createDetailTable();
      const tbody = table.querySelector('tbody');
      lines.forEach(function(line){ tbody.appendChild(createDetailRow(line, dep)); });
      appendNode(page, table);
      return page;
    }

    function appendSubtotal(page, subtotal){
      appendNode(page, el('div', 'dep-subtotal', 'Subtotal atualizado: ' + fmtBRL(subtotal || 0)));
    }

    function splitDetailLines(lines){
      const src = Array.isArray(lines) ? lines.slice() : [];
      if (!src.length) return [[]];
      const chunks = [];
      let index = 0;
      let size = DETAIL_LINES_FIRST_PAGE;
      while (index < src.length) {
        chunks.push(src.slice(index, index + size));
        index += size;
        size = DETAIL_LINES_NEXT_PAGES;
      }
      if (chunks.length > 1) {
        const last = chunks[chunks.length - 1];
        const prev = chunks[chunks.length - 2];
        if (last.length < MIN_LINES_LAST_PAGE && prev.length > MIN_LINES_LAST_PAGE) {
          const need = MIN_LINES_LAST_PAGE - last.length;
          const movable = Math.max(0, prev.length - MIN_LINES_LAST_PAGE);
          const move = Math.min(need, movable);
          if (move > 0) {
            chunks[chunks.length - 1] = prev.slice(prev.length - move).concat(last);
            chunks[chunks.length - 2] = prev.slice(0, prev.length - move);
          }
        }
      }
      return chunks.filter(function(chunk){ return chunk.length > 0; });
    }

    function appendDepositBlocks(rootEl, result, startPageIndex){
      let pageIndex = startPageIndex;
      result.depBlocks.forEach(function(block){
        const allChunks = splitDetailLines(block.lines || []);
        allChunks.forEach(function(chunk, idx){
          const page = appendDetailPage(rootEl, result, pageIndex, block.dep, chunk, idx > 0);
          if (idx === allChunks.length - 1) appendSubtotal(page, block.subtotal || 0);
          pageIndex += 1;
        });
      });
      return pageIndex;
    }

    function parseSourcesFragment(html){
      const wrap = document.createElement('div');
      wrap.innerHTML = html || '';
      return wrap;
    }

    function appendSources(rootEl, result, pageIndex){
      const page = makePage(rootEl, result, pageIndex, false);
      appendNode(page, sectionTitle('Fontes dos índices utilizados'));
      const wrap = parseSourcesFragment(ctx.fontesHTML(result.indexType));
      const items = Array.from(wrap.children);
      if (!items.length) {
        appendNode(page, el('p', '', wrap.textContent.trim() || 'Sem informações adicionais.'));
      } else {
        items.forEach(function(item){ appendNode(page, item.cloneNode(true)); });
      }
      return pageIndex + 1;
    }

    function cleanupPages(reportRoot){
      Array.from(reportRoot.querySelectorAll('.page')).forEach(function(page){
        const content = page.querySelector('.content');
        if (content && !content.textContent.trim()) page.remove();
      });
    }

    function waitForLayout(root){
      return new Promise(function(resolve){
        const done = function(){
          global.requestAnimationFrame(function(){
            global.requestAnimationFrame(resolve);
          });
        };
        const images = Array.from(root.querySelectorAll('img'));
        if (!images.length) return done();
        let pending = images.length;
        let settled = false;
        const oneDone = function(){
          if (settled) return;
          pending -= 1;
          if (pending <= 0) {
            settled = true;
            done();
          }
        };
        images.forEach(function(img){
          if (img.complete) oneDone();
          else {
            img.addEventListener('load', oneDone, { once:true });
            img.addEventListener('error', oneDone, { once:true });
          }
        });
        global.setTimeout(function(){ if (!settled) { settled = true; done(); } }, 1200);
      });
    }

    async function renderReport(result){
      if (!result) return;
      const reportRoot = document.getElementById('reportRoot');
      if (!reportRoot) return ctx.toast('Erro', 'Área de relatório não encontrada.', 'err');

      ctx.switchTab('report');
      await new Promise(function(resolve){
        global.requestAnimationFrame(function(){
          global.requestAnimationFrame(resolve);
        });
      });

      reportRoot.innerHTML = '';
      reportRoot.className = 'cp-report-root deposito-report-root';

      const introPage = makePage(reportRoot, result, 1, true);
      appendIntro(introPage, result);
      let nextPageIndex = 2;
      nextPageIndex = appendDepositBlocks(reportRoot, result, nextPageIndex);
      appendSources(reportRoot, result, nextPageIndex);
      cleanupPages(reportRoot);

      global.CPPrintLayout.applyReportBranding(reportRoot, ctx.getReportBranding());
      await waitForLayout(reportRoot);
      reportRoot.scrollIntoView({ behavior:'smooth', block:'start' });
    }

    async function openPrintWindow(){
      const reportRoot = document.getElementById('reportRoot');
      if (!reportRoot || !reportRoot.querySelector('.page')) {
        return ctx.toast('Erro', 'Gere o relatório antes de imprimir.', 'err');
      }
      if (!global.CPPrintLayout || !global.CPPrintLayout.printRootInHost) {
        return ctx.toast('Erro', 'Engine de impressão indisponível.', 'err');
      }

      await waitForLayout(reportRoot);
      return global.CPPrintLayout.printRootInHost(
        reportRoot,
        'deposito-recursal-print',
        'Atualização Bancária - Depósito Recursal'
      );
    }

    Object.assign(ctx, { renderReport, openPrintWindow });
  };

  global.CPDepositoRecursalPrintLoaded = true;
})(window);
