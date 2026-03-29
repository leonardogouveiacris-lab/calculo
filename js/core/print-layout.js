(function(global){
  'use strict';
  if (global.CPPrintLayout) return;

  const DEFAULTS = {
    logo: 'https://calculopro.com.br/wp-content/uploads/2024/11/logonegativa.png',
    typography: {
      titleSize: '12.6pt',
      metaSize: '10pt',
      tableSize: '10.5pt',
      footerSize: '9.5pt',
      lineHeight: 1.4
    },
    spacing: {
      pagePaddingTop: '9mm',
      pagePaddingX: '16mm',
      pagePaddingBottom: '10mm',
      contentTop: 6,
      safetyTop: 3,
      safetyBottom: 8,
      blockGap: 8
    },
    limits: {
      minRowsPerSplit: 1,
      maxMeasureWaitMs: 1200
    }
  };


  function ensurePrintCssVars(root){
    const doc = root && root.ownerDocument ? root.ownerDocument : document;
    const el = doc.documentElement;
    if (!el || !el.style) return;
    const map = {
      '--cp-print-logo-w': '164.41px',
      '--cp-print-logo-h': '45.34px',
      '--cp-print-page-w': '210mm',
      '--cp-print-page-h': '297mm',
      '--cp-print-pad-top': '9mm',
      '--cp-print-pad-x': '16mm',
      '--cp-print-pad-bottom': '10mm',
      '--cp-print-content-top': '6mm',
      '--cp-print-safe-bottom': '8mm'
    };
    Object.keys(map).forEach(function(key){
      if (!el.style.getPropertyValue(key)) el.style.setProperty(key, map[key]);
    });
  }

  function safeHref(url){
    const value = String(url || '').trim();
    if (!value) return '#';
    return /^https?:\/\//i.test(value) ? value : 'https://' + value.replace(/^\/+/, '');
  }

  function safeMail(email){
    const value = String(email || '').trim();
    return value ? 'mailto:' + value : '#';
  }

  function resolveBranding(branding){
    const data = branding || {};
    return {
      logo: data.logo || DEFAULTS.logo,
      header: Object.assign({ nome:'', tel:'', email:'' }, data.header || {}),
      footer: Object.assign({ l1:'', l2:'', site:'', emp:'' }, data.footer || {})
    };
  }

  function applyReportBranding(reportRoot, branding){
    const root = reportRoot || document.getElementById('reportRoot');
    if (!root) return;
    const data = resolveBranding(branding);
    ensurePrintCssVars(root);
    root.classList.add('cp-report-root');

    root.querySelectorAll('.page img[data-logo="1"]').forEach(function(img){ img.src = data.logo; });
    root.querySelectorAll('.page .contact').forEach(function(contact){
      const b = contact.querySelector('b');
      const spans = contact.querySelectorAll('span');
      const a = contact.querySelector('a');
      if (b) b.textContent = data.header.nome;
      if (spans[0]) spans[0].textContent = data.header.tel;
      if (a) {
        a.textContent = data.header.email;
        a.href = safeMail(data.header.email);
        a.rel = 'noreferrer';
      }
    });

    root.querySelectorAll('.page .footer').forEach(function(footerEl){
      const left = footerEl.querySelector('div:first-child');
      const right = footerEl.querySelector('div:last-child');
      if (left) {
        const blocks = left.querySelectorAll('div, a');
        if (blocks[0]) blocks[0].textContent = data.footer.l1;
        if (blocks[1]) blocks[1].textContent = data.footer.l2;
        if (blocks[2]) {
          blocks[2].textContent = data.footer.site;
          if (blocks[2].tagName === 'A') {
            blocks[2].setAttribute('href', safeHref(data.footer.site));
            blocks[2].setAttribute('target', '_blank');
            blocks[2].setAttribute('rel', 'noreferrer');
          }
        }
      }
      if (right) right.textContent = data.footer.emp;
    });
  }

  function waitForLayout(root){
    return new Promise(function(resolve){
      const done = function(){
        global.requestAnimationFrame(function(){
          global.requestAnimationFrame(resolve);
        });
      };
      const images = Array.from((root || document).querySelectorAll('img'));
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
      global.setTimeout(function(){ if (!settled) { settled = true; done(); } }, DEFAULTS.limits.maxMeasureWaitMs);
    });
  }

  function renderPageShell(opts){
    const title = opts.title || '';
    const meta = opts.meta || '';
    const includeTitle = opts.includeTitle !== false;
    const b = resolveBranding(opts.branding);
    return '' +
      '<section class="page" data-page-index="' + (opts.pageIndex || 1) + '">' +
        '<div class="header">' +
          '<img alt="Logo" class="logo" data-logo="1" src="' + b.logo + '"/>' +
          '<div class="contact">' +
            '<div><b>' + b.header.nome + '</b></div>' +
            '<div>Tel.: <span>' + b.header.tel + '</span></div>' +
            '<div><a href="' + safeMail(b.header.email) + '" rel="noreferrer">' + b.header.email + '</a></div>' +
          '</div>' +
        '</div>' +
        '<div class="content">' +
          (includeTitle ? '<div class="title">' + title + '</div>' + (meta ? '<div class="meta">' + meta + '</div>' : '') : '') +
        '</div>' +
        '<div class="footer">' +
          '<div><div>' + b.footer.l1 + '</div><div>' + b.footer.l2 + '</div><div><a href="' + safeHref(b.footer.site) + '" rel="noreferrer" target="_blank">' + b.footer.site + '</a></div></div>' +
          '<div style="text-align:right;"><div>' + b.footer.emp + '</div></div>' +
        '</div>' +
      '</section>';
  }

  function createLayout(config){
    const root = config && config.root;
    if (!root) throw new Error('CPPrintLayout: root é obrigatório.');
    const branding = resolveBranding(config.branding);
    const layout = {
      root: root,
      contextName: config.contextName || 'generic-report-print',
      documentTitle: config.documentTitle || document.title,
      title: config.title || '',
      meta: config.meta || '',
      branding: branding,
      limits: Object.assign({}, DEFAULTS.limits, config.limits || {}),
      spacing: Object.assign({}, DEFAULTS.spacing, config.spacing || {}),
      pages: [],
      currentPage: null,
      includeTitleOnFirstPage: config.includeTitleOnFirstPage !== false
    };
    root.innerHTML = '';
    ensurePrintCssVars(root);
    root.classList.add('cp-report-root');
    return layout;
  }

  function getContentMetrics(page, spacing){
    const content = page.querySelector('.content');
    const footer = page.querySelector('.footer');
    const header = page.querySelector('.header');
    if (!content) return null;
    const contentTop = content.offsetTop + (spacing.contentTop || 0) + (spacing.safetyTop || 0);
    const footerTop = footer ? footer.offsetTop : (content.offsetTop + content.clientHeight);
    const contentBottom = footerTop - (spacing.safetyBottom || 0);
    const usableHeight = Math.max(0, contentBottom - contentTop);
    return { content, header, footer, contentTop, contentBottom, usableHeight };
  }

  function usedBottom(content){
    let max = content.offsetTop;
    Array.from(content.children || []).forEach(function(node){
      if (!node || node.nodeType !== 1) return;
      const style = global.getComputedStyle ? global.getComputedStyle(node) : null;
      const marginBottom = style ? (parseFloat(style.marginBottom || '0') || 0) : 0;
      const bottom = node.offsetTop + node.offsetHeight + marginBottom;
      if (bottom > max) max = bottom;
    });
    return max;
  }

  function createPage(layoutOrRoot, options){
    if (layoutOrRoot && layoutOrRoot.nodeType === 1) {
      const root = layoutOrRoot;
      const opts = options || {};
      const wrap = document.createElement('div');
      wrap.innerHTML = renderPageShell({
        pageIndex: opts.pageIndex || (root.querySelectorAll('.page').length + 1),
        includeTitle: opts.includeTitle !== false,
        title: opts.title || '',
        meta: opts.meta || '',
        branding: { logo: opts.logo, header: opts.header, footer: opts.footer }
      }).trim();
      const page = wrap.firstElementChild;
      const content = page.querySelector('.content');
      if (opts.contentHtml && content) content.insertAdjacentHTML('beforeend', opts.contentHtml);
      root.appendChild(page);
      return page;
    }

    const layout = layoutOrRoot;
    const opts = options || {};
    const pageIndex = layout.pages.length + 1;
    const wrap = document.createElement('div');
    wrap.innerHTML = renderPageShell({
      pageIndex: pageIndex,
      includeTitle: opts.includeTitle != null ? opts.includeTitle : (pageIndex === 1 ? layout.includeTitleOnFirstPage : false),
      title: opts.title || layout.title,
      meta: opts.meta || layout.meta,
      branding: layout.branding
    }).trim();
    const page = wrap.firstElementChild;
    layout.root.appendChild(page);
    layout.pages.push(page);
    layout.currentPage = page;
    return page;
  }

  function ensurePage(layout){
    return layout.currentPage || createPage(layout, {});
  }

  function toNodes(html){
    const probe = document.createElement('div');
    probe.innerHTML = html || '';
    return Array.from(probe.childNodes);
  }

  function appendMeasured(layout, html, options){
    const opts = options || {};
    let page = ensurePage(layout);
    let metrics = getContentMetrics(page, layout.spacing);
    const nodes = toNodes(html);
    if (!nodes.length) return page;
    nodes.forEach(function(node){ metrics.content.appendChild(node); });
    const overflows = usedBottom(metrics.content) > metrics.contentBottom;
    if (!overflows) return page;

    nodes.forEach(function(node){ if (node.parentNode === metrics.content) metrics.content.removeChild(node); });
    page = createPage(layout, { includeTitle:false });
    metrics = getContentMetrics(page, layout.spacing);
    nodes.forEach(function(node){ metrics.content.appendChild(node); });
    return page;
  }

  function appendSection(layout, section){
    const opts = section || {};
    const titleHtml = opts.title ? '<div class="sec-title">' + opts.title + '</div>' : '';
    const html = titleHtml + (opts.html || '');
    return appendMeasured(layout, html, opts);
  }

  function buildTableHtml(columns, rows, opts){
    const head = '<thead><tr>' + columns.map(function(col){ return '<th>' + col + '</th>'; }).join('') + '</tr></thead>';
    const body = '<tbody>' + rows.join('') + '</tbody>';
    const cls = opts.tableClass || 'report-table';
    return '<table class="' + cls + '">' + head + body + (opts.tfootHtml ? '<tfoot>' + opts.tfootHtml + '</tfoot>' : '') + '</table>';
  }

  function appendTable(layout, tableSpec){
    const spec = tableSpec || {};
    const columns = Array.isArray(spec.columns) ? spec.columns : [];
    const rows = Array.isArray(spec.rows) ? spec.rows.slice() : [];
    const title = spec.title ? '<div class="sec-title' + (spec.smallTitle ? ' sec-title-small' : '') + '">' + spec.title + '</div>' : '';
    const minRows = Math.max(1, Number(layout.limits.minRowsPerSplit || 1));
    let cursor = 0;
    let continued = false;

    while (cursor < rows.length || (!rows.length && cursor === 0)) {
      const page = ensurePage(layout);
      const metrics = getContentMetrics(page, layout.spacing);
      const start = cursor;
      let end = rows.length;
      if (!rows.length) end = 0;

      if (rows.length) {
        let fit = false;
        while (end > start) {
          const html = title + buildTableHtml(columns, rows.slice(start, end), {
            tableClass: spec.tableClass,
            tfootHtml: end === rows.length ? (spec.tfootHtml || '') : ''
          });
          const blockNodes = toNodes(html);
          blockNodes.forEach(function(node){ metrics.content.appendChild(node); });
          fit = usedBottom(metrics.content) <= metrics.contentBottom;
          blockNodes.forEach(function(node){ if (node.parentNode === metrics.content) metrics.content.removeChild(node); });
          if (fit) break;
          end -= 1;
        }

        if (end <= start) {
          createPage(layout, { includeTitle:false });
          continue;
        }

        if (end - start < minRows && (rows.length - start) > minRows) {
          end = Math.min(rows.length, start + minRows);
        }
      }

      const isLast = end >= rows.length;
      const heading = title && continued && spec.continuationLabel ? '<div class="sec-title sec-title-small">' + spec.continuationLabel + '</div>' : title;
      appendMeasured(layout, heading + buildTableHtml(columns, rows.slice(start, end), {
        tableClass: spec.tableClass,
        tfootHtml: isLast ? (spec.tfootHtml || '') : ''
      }));

      if (!rows.length) break;
      cursor = end;
      continued = cursor < rows.length;
      if (continued) createPage(layout, { includeTitle:false });
    }

    return layout.currentPage;
  }

  function measureAndPaginate(layout){
    const report = layout && layout.root;
    if (!report) return { pages:0, issues:[] };
    const issues = [];
    const pages = Array.from(report.querySelectorAll('.page'));
    pages.forEach(function(page, idx){
      const metrics = getContentMetrics(page, layout.spacing);
      if (!metrics) return;
      const overflow = usedBottom(metrics.content) - metrics.contentBottom;
      if (overflow > 0.5) issues.push({ page: idx + 1, type: 'overflow', px: overflow });
      const contentTop = metrics.content.offsetTop;
      const headerBottom = metrics.header ? metrics.header.offsetTop + metrics.header.offsetHeight : contentTop;
      if (contentTop < headerBottom) issues.push({ page: idx + 1, type: 'header-overlap' });
      const footerTop = metrics.footer ? metrics.footer.offsetTop : metrics.contentBottom;
      if (usedBottom(metrics.content) > footerTop) issues.push({ page: idx + 1, type: 'footer-overlap' });
    });
    return { pages: pages.length, issues: issues };
  }


  function pageContentBottom(page){
    const content = page && page.querySelector ? page.querySelector('.content') : null;
    if (!content) return 0;
    return usedBottom(content) - content.offsetTop;
  }

  function pageContentLimit(page, bottomSelector, gap){
    const content = page && page.querySelector ? page.querySelector('.content') : null;
    const footer = page && page.querySelector ? page.querySelector(bottomSelector || '.footer') : null;
    if (!content) return 0;
    if (!footer) return Math.max(0, content.clientHeight - (gap || 0));
    return Math.max(0, footer.offsetTop - content.offsetTop - (gap || 0));
  }

  function pageContentFits(page, bottomSelector, gap){
    return pageContentBottom(page) <= pageContentLimit(page, bottomSelector, gap);
  }

  function pageHasRoom(page, bottomSelector, gap){
    return pageContentFits(page, bottomSelector || '.footer', gap || 8);
  }

  function ensurePrintHost(){
    let host = document.getElementById('cpPrintHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'cpPrintHost';
      host.setAttribute('aria-hidden', 'true');
      document.body.appendChild(host);
    }
    return host;
  }

  function printRootInHost(reportRoot, contextName, title){
    if (!reportRoot) return Promise.resolve(false);
    const context = String(contextName || 'generic-report-print').trim() || 'generic-report-print';
    const originalTitle = document.title;
    return waitForLayout(reportRoot).then(function(){
      const host = ensurePrintHost();
      host.innerHTML = '';
      const cloned = reportRoot.cloneNode(true);
      cloned.classList.add('cp-report-root');
      host.appendChild(cloned);
      document.body.setAttribute('data-report-context', context);
      const cleanup = function(){
        document.body.removeAttribute('data-report-context');
        host.innerHTML = '';
        global.removeEventListener('afterprint', cleanup);
      };
      global.addEventListener('afterprint', cleanup);
      document.title = title || originalTitle;
      return waitForLayout(host).then(function(){
        global.print();
        global.setTimeout(function(){ document.title = originalTitle; }, 700);
        return true;
      });
    });
  }

  function finalizeAndPrint(layout, options){
    const opts = options || {};
    applyReportBranding(layout.root, layout.branding);
    const result = measureAndPaginate(layout);
    if (opts.validateOnly) return Promise.resolve(result);
    return printRootInHost(layout.root, opts.contextName || layout.contextName, opts.title || layout.documentTitle)
      .then(function(){ return result; });
  }


  function prepareManualPrintContext(){
    if (document.body.getAttribute('data-report-context')) return;
    const reportRoot = document.getElementById('reportRoot');
    if (!reportRoot || !reportRoot.querySelector('.page') || !reportRoot.textContent.trim()) return;
    const host = ensurePrintHost();
    host.innerHTML = '';
    const cloned = reportRoot.cloneNode(true);
    cloned.classList.add('cp-report-root');
    host.appendChild(cloned);
    document.body.setAttribute('data-report-context', 'manual-report-print');
    document.body.setAttribute('data-report-context-auto', '1');
  }

  function cleanupManualPrintContext(){
    if (document.body.getAttribute('data-report-context-auto') !== '1') return;
    const host = ensurePrintHost();
    host.innerHTML = '';
    document.body.removeAttribute('data-report-context-auto');
    document.body.removeAttribute('data-report-context');
  }

  if (!global.__CP_PRINT_LAYOUT_BINDINGS__) {
    global.__CP_PRINT_LAYOUT_BINDINGS__ = true;
    global.addEventListener('beforeprint', prepareManualPrintContext);
    global.addEventListener('afterprint', cleanupManualPrintContext);
  }

  ensurePrintCssVars(document.body || document.documentElement);

  global.CPPrintLayout = {
    defaults: DEFAULTS,
    resolveBranding: resolveBranding,
    createLayout: createLayout,
    createPage: createPage,
    appendSection: appendSection,
    appendTable: appendTable,
    measureAndPaginate: measureAndPaginate,
    finalizeAndPrint: finalizeAndPrint,
    pageHasRoom: pageHasRoom,
    pageContentBottom: pageContentBottom,
    pageContentLimit: pageContentLimit,
    pageContentFits: pageContentFits,
    applyReportBranding: applyReportBranding,
    renderPageShell: renderPageShell,
    waitForLayout: waitForLayout,
    ensurePrintHost: ensurePrintHost,
    printRootInHost: printRootInHost
  };
})(window);
