(function(global){
  'use strict';
  if (global.CPPrintLayout) return;

  const DEFAULTS = {
    logo: 'https://calculopro.com.br/wp-content/uploads/2024/11/logonegativa.png'
  };



  function setReportLogoSize(root){
    const doc = root && root.nodeType === 9 ? root : (root && root.ownerDocument ? root.ownerDocument : document);
    const el = doc && doc.documentElement ? doc.documentElement : document.documentElement;
    if (!el) return;
    el.style.setProperty('--cp-print-logo-w', '164.41px');
    el.style.setProperty('--cp-print-logo-h', '45.34px');
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

  function setText(id, value, root){
    const el = (root || document).querySelector('#' + id);
    if (el) el.textContent = value || '';
  }

  function setLink(id, value, href, root){
    const el = (root || document).querySelector('#' + id);
    if (!el) return;
    el.textContent = value || '';
    el.setAttribute('href', href || '#');
    if (href && href !== '#') {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noreferrer');
    }
  }

  function applyReportBranding(reportRoot, data){
    const root = reportRoot || document.getElementById('reportRoot');
    if (!root) return;
    setReportLogoSize(root);
    root.classList.add('cp-report-root');
    const header = Object.assign({ nome:'', tel:'', email:'' }, data && data.header || {});
    const footer = Object.assign({ l1:'', l2:'', site:'', emp:'' }, data && data.footer || {});
    const logo = (data && data.logo) || DEFAULTS.logo;

    root.querySelectorAll('img[data-logo="1"]').forEach(function(img){ img.src = logo; });

    ['rHdrNome','pHdrNome','rHdrNome2','rHdrNome3'].forEach(id => setText(id, header.nome, root));
    ['rHdrTel','pHdrTel','rHdrTel2','rHdrTel3'].forEach(id => setText(id, header.tel, root));
    ['rFtrL1','pFtrL1','rFtrL1_2','rFtrL1_3'].forEach(id => setText(id, footer.l1, root));
    ['rFtrL2','pFtrL2','rFtrL2_2','rFtrL2_3'].forEach(id => setText(id, footer.l2, root));
    ['rFtrEmp','pFtrEmp','rFtrEmp_2','rFtrEmp_3'].forEach(id => setText(id, footer.emp, root));
    ['rHdrEmailLink','pHdrEmailLink','rHdrEmailLink2','rHdrEmailLink3'].forEach(id => setLink(id, header.email, safeMail(header.email), root));
    ['rFtrSite','pFtrSite','rFtrSite_2','rFtrSite_3'].forEach(id => setLink(id, footer.site, safeHref(footer.site), root));

    root.querySelectorAll('.page .contact').forEach(function(contact){
      const b = contact.querySelector('b');
      const spans = contact.querySelectorAll('span');
      const a = contact.querySelector('a');
      if (b) b.textContent = header.nome || '';
      if (spans[0]) spans[0].textContent = header.tel || '';
      if (a) {
        a.textContent = header.email || '';
        a.href = safeMail(header.email);
        a.rel = 'noreferrer';
      }
    });
    root.querySelectorAll('.page .footer').forEach(function(footerEl){
      const left = footerEl.querySelector('div:first-child');
      const right = footerEl.querySelector('div:last-child');
      if (left) {
        const nodes = left.querySelectorAll('div, a');
        if (nodes[0]) nodes[0].textContent = footer.l1 || '';
        if (nodes[1]) nodes[1].textContent = footer.l2 || '';
        if (nodes[2]) {
          nodes[2].textContent = footer.site || '';
          if (nodes[2].tagName === 'A') {
            nodes[2].setAttribute('href', safeHref(footer.site));
            nodes[2].setAttribute('target', '_blank');
            nodes[2].setAttribute('rel', 'noreferrer');
          }
        }
      }
      if (right) right.textContent = footer.emp || '';
    });
  }

  function renderPageShell(opts){
    const title = opts && opts.title || '';
    const meta = opts && opts.meta || '';
    const includeTitle = opts && opts.includeTitle !== false;
    const logo = opts && opts.logo || DEFAULTS.logo;
    const header = Object.assign({ nome:'', tel:'', email:'' }, opts && opts.header || {});
    const footer = Object.assign({ l1:'', l2:'', site:'', emp:'' }, opts && opts.footer || {});
    return '' +
      '<section class="page" data-page-index="' + (opts.pageIndex || 1) + '">' +
        '<div class="header">' +
          '<img alt="Logo" class="logo" data-logo="1" src="' + logo + '"/>' +
          '<div class="contact">' +
            '<div><b>' + (header.nome || '') + '</b></div>' +
            '<div>Tel.: <span>' + (header.tel || '') + '</span></div>' +
            '<div><a href="' + safeMail(header.email) + '" rel="noreferrer">' + (header.email || '') + '</a></div>' +
          '</div>' +
        '</div>' +
        '<div class="content">' +
          (includeTitle ? '<div class="title">' + title + '</div>' + (meta ? '<div class="meta">' + meta + '</div>' : '') : '') +
          (opts.contentHtml || '') +
        '</div>' +
        '<div class="footer">' +
          '<div><div>' + (footer.l1 || '') + '</div><div>' + (footer.l2 || '') + '</div><div><a href="' + safeHref(footer.site) + '" rel="noreferrer" target="_blank">' + (footer.site || '') + '</a></div></div>' +
          '<div style="text-align:right;"><div>' + (footer.emp || '') + '</div></div>' +
        '</div>' +
      '</section>';
  }

  function createPage(rootEl, opts){
    const wrap = document.createElement('div');
    wrap.innerHTML = renderPageShell(opts).trim();
    const page = wrap.firstElementChild;
    rootEl.appendChild(page);
    return page;
  }

  function pageHasRoom(page, bottomSelector, gap){
    const body = page.querySelector(bottomSelector || '.footer');
    const table = page.querySelector('.report-table');
    if (!body || !table) return true;
    const tableBottom = table.offsetTop + table.offsetHeight;
    const bodyTop = body.offsetTop;
    return tableBottom <= (bodyTop - (gap || 8));
  }

  function pageContentBottom(page){
    const content = page && page.querySelector ? page.querySelector('.content') : null;
    if (!content) return 0;
    let max = 0;
    Array.from(content.children || []).forEach(function(node){
      if (!node || node.nodeType !== 1) return;
      const style = global.getComputedStyle ? global.getComputedStyle(node) : null;
      const marginBottom = style ? (parseFloat(style.marginBottom || '0') || 0) : 0;
      max = Math.max(max, node.offsetTop + node.offsetHeight + marginBottom);
    });
    return max;
  }

  function pageContentLimit(page, bottomSelector, gap){
    const content = page && page.querySelector ? page.querySelector('.content') : null;
    const body = page && page.querySelector ? page.querySelector(bottomSelector || '.footer') : null;
    if (!content) return 0;
    if (!body) return Math.max(0, content.clientHeight - (gap || 8));
    return Math.max(0, body.offsetTop - content.offsetTop - (gap || 8));
  }

  function pageContentFits(page, bottomSelector, gap){
    return pageContentBottom(page) <= pageContentLimit(page, bottomSelector, gap);
  }

  function waitForLayout(root){
    return new Promise(function(resolve){
      const done = function(){
        window.requestAnimationFrame(function(){
          window.requestAnimationFrame(resolve);
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
      window.setTimeout(function(){ if (!settled) { settled = true; done(); } }, 1200);
    });
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
      try { cloned.classList.add('cp-report-root'); } catch (e) {}
      host.appendChild(cloned);
      document.body.setAttribute('data-report-context', context);
      const cleanup = function(){
        document.body.removeAttribute('data-report-context');
        host.innerHTML = '';
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      document.title = title || originalTitle;
      return waitForLayout(host).then(function(){
        return new Promise(function(resolve){
          window.requestAnimationFrame(function(){
            window.requestAnimationFrame(function(){
              window.print();
              window.setTimeout(function(){
                document.title = originalTitle;
                resolve(true);
              }, 700);
            });
          });
        });
      });
    });
  }

  function openPrintWindowFromRoot(reportRoot, title){
    if (!reportRoot) return false;
    const win = window.open('', '_blank');
    if (!win) return false;
    const cloned = reportRoot.cloneNode(true);
    try { cloned.classList.add('cp-report-root'); } catch (e) {}
    win.document.open();
    win.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>' + (title || 'Relatório') + '</title><link rel="stylesheet" href="css/print-report.css"></head><body></body></html>');
    win.document.close();
    win.document.body.appendChild(cloned);
    const imgs = Array.from(win.document.images || []);
    Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; }))).then(function(){
      win.focus();
      win.print();
      setTimeout(function(){ try { win.close(); } catch (e) {} }, 300);
    });
    return true;
  }

  setReportLogoSize(document);

  global.CPPrintLayout = {
    defaults: DEFAULTS,
    applyReportBranding: applyReportBranding,
    renderPageShell: renderPageShell,
    createPage: createPage,
    pageHasRoom: pageHasRoom,
    pageContentBottom: pageContentBottom,
    pageContentLimit: pageContentLimit,
    pageContentFits: pageContentFits,
    waitForLayout: waitForLayout,
    ensurePrintHost: ensurePrintHost,
    printRootInHost: printRootInHost,
    openPrintWindowFromRoot: openPrintWindowFromRoot
  };
})(window);
