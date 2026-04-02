(function(global){
  'use strict';
  if (global.CPDepositoRecursalRenderLoaded) return;
  const ns = global.CPDepositoRecursal = global.CPDepositoRecursal || {};

  ns.attachRender = function(ctx){
    const { state, el, fmtBRL, toDateBR, monthLabel, esc, compareMonth } = ctx;

    function toast(title, message, kind){
      const wrap = document.getElementById('toastWrap');
      if(!wrap) return;
      const div = document.createElement('div');
      div.className = 'toast ' + (kind || 'ok');
      div.innerHTML = '<p class="t"></p><p class="m"></p>';
      div.querySelector('.t').textContent = title || 'Aviso';
      div.querySelector('.m').textContent = message || '';
      wrap.appendChild(div);
      setTimeout(()=>{ div.style.opacity='0'; div.style.transform='translateY(6px)'; }, 3600);
      setTimeout(()=>{ div.remove(); }, 4200);
    }

    function setAutoStatus(msg){ if (el.autoStatus) el.autoStatus.textContent = msg || ''; }

    function updateIndexTypeUI(){
      const t = el.indexType ? el.indexType.value : 'manual';
      if (el.manualWrap) el.manualWrap.style.display = t === 'manual' ? '' : 'none';
      if (!el.indexHint) return;
      el.indexHint.textContent = t === 'poupanca_auto'
        ? 'Busca automática no BCB: TR mensal (SGS 7811) + adicional pela Meta Selic (SGS 432).'
        : t === 'jam_auto'
          ? 'Busca automática no BCB: TR mensal (SGS 7811) + juros fixos de 3% a.a. (0,25% a.m.).'
          : t === 'ipca'
            ? 'Busca automática no BCB: IPCA mensal (SGS 433).'
            : t === 'inpc'
              ? 'Busca automática no BCB: INPC mensal (SGS 188).'
              : t === 'igpm'
                ? 'Busca automática no BCB: IGP-M mensal (SGS 189).'
                : t === 'igpdi'
                  ? 'Busca automática no BCB: IGP-DI mensal (SGS 190).'
                  : t === 'cdi'
                    ? 'Busca automática no BCB: CDI (SGS 4389, % a.a. base 252) convertido para taxa diária efetiva e depois para taxa mensal efetiva por composição diária.'
                    : t === 'selic'
                      ? 'Busca automática no BCB: Selic (SGS 11, % a.d.) sem conversão de unidade e depois para taxa mensal efetiva por composição diária.'
                  : '';
    }

    function closeConfirm(){
      const back = document.getElementById('modalBackdrop');
      const bd = document.getElementById('modalBody');
      const ft = document.getElementById('modalFooter');
      if(back){ back.classList.remove('open'); back.setAttribute('aria-hidden','true'); }
      if(bd) bd.innerHTML='';
      if(ft) ft.innerHTML='';
    }

    function openConfirm(message){
      return new Promise((resolve)=>{
        const bd = document.getElementById('modalBody');
        const ft = document.getElementById('modalFooter');
        const back = document.getElementById('modalBackdrop');
        const title = document.getElementById('modalTitle');
        if(!bd || !ft || !back || !title) return resolve(false);
        title.textContent = 'Confirmação';
        CPCommon.clear(bd);
        const p = document.createElement('p');
        p.style.margin = '0'; p.style.color = '#344054'; p.style.fontSize = '13px'; p.style.lineHeight = '1.5'; p.textContent = message || '';
        bd.appendChild(p);
        CPCommon.clear(ft);
        const btnCancel = document.createElement('button'); btnCancel.className='btn'; btnCancel.type='button'; btnCancel.textContent='Cancelar'; btnCancel.onclick = ()=>{ closeConfirm(); resolve(false); };
        const btnOk = document.createElement('button'); btnOk.className='btn btn-primary'; btnOk.type='button'; btnOk.textContent='Confirmar'; btnOk.onclick = ()=>{ closeConfirm(); resolve(true); };
        ft.appendChild(btnCancel); ft.appendChild(btnOk);
        back.classList.add('open'); back.setAttribute('aria-hidden','false');
      });
    }

    function renderDeposits(){
      if (!el.depTable) return;
      const tbody = el.depTable.querySelector('tbody') || el.depTable;
      tbody.innerHTML = '';
      state.deposits.forEach((dep, i) => {
        const tr = document.createElement('tr');
        if (state.editingDepIndex === i) {
          tr.innerHTML = '<td>' + (i + 1) + '</td>' +
            '<td><input type="date" id="depEditDate_' + i + '" value="' + esc(dep.date) + '" style="padding:8px 10px;border-radius:10px"/></td>' +
            '<td><input type="number" step="0.01" id="depEditValue_' + i + '" value="' + Number(dep.value||0) + '" style="padding:8px 10px;border-radius:10px"/></td>' +
            '<td><input type="text" id="depEditObs_' + i + '" value="' + esc(dep.obs||'') + '" style="padding:8px 10px;border-radius:10px"/></td>' +
            '<td><button class="btn btn-primary" type="button" data-action="save" data-i="' + i + '">Salvar</button> <button class="btn" type="button" data-action="cancel" data-i="' + i + '">Cancelar</button></td>';
        } else {
          tr.innerHTML = '<td>' + (i + 1) + '</td><td>' + toDateBR(dep.date) + '</td><td>' + fmtBRL(dep.value) + '</td><td>' + esc(dep.obs || '') + '</td><td><button class="btn" type="button" data-action="edit" data-i="' + i + '">Editar</button> <button class="btn btn-danger" type="button" data-action="del" data-i="' + i + '">Excluir</button></td>';
        }
        tbody.appendChild(tr);
      });
    }

    function renderIndices(){
      if (!el.idxTable) return;
      const tbody = el.idxTable.querySelector('tbody') || el.idxTable;
      tbody.innerHTML = '';
      state.indices.forEach((idx, i) => {
        const tr = document.createElement('tr');
        if (state.editingIdxIndex === i) {
          tr.innerHTML = '<td>' + (i + 1) + '</td>' +
            '<td><input type="month" id="idxEditMonth_' + i + '" value="' + esc(idx.month) + '" style="padding:8px 10px;border-radius:10px"/></td>' +
            '<td><input type="number" step="0.000001" id="idxEditValue_' + i + '" value="' + Number(idx.value||0) + '" style="padding:8px 10px;border-radius:10px"/></td>' +
            '<td><button class="btn btn-primary" type="button" data-action="save" data-i="' + i + '">Salvar</button> <button class="btn" type="button" data-action="cancel" data-i="' + i + '">Cancelar</button></td>';
        } else {
          tr.innerHTML = '<td>' + (i + 1) + '</td><td>' + monthLabel(idx.month) + '</td><td>' + Number(idx.value).toLocaleString('pt-BR',{minimumFractionDigits:6,maximumFractionDigits:6}) + '</td><td><button class="btn" type="button" data-action="edit" data-i="' + i + '">Editar</button> <button class="btn btn-danger" type="button" data-action="del" data-i="' + i + '">Excluir</button></td>';
        }
        tbody.appendChild(tr);
      });
    }

    function switchTab(which){
      const isEditor = which === 'editor';
      if (el.tabEditor) el.tabEditor.classList.toggle('active', isEditor);
      if (el.tabReport) el.tabReport.classList.toggle('active', !isEditor);
      if (el.tabBtnEditor){ el.tabBtnEditor.classList.toggle('active', isEditor); el.tabBtnEditor.setAttribute('aria-selected', String(isEditor)); }
      if (el.tabBtnReport){ el.tabBtnReport.classList.toggle('active', !isEditor); el.tabBtnReport.setAttribute('aria-selected', String(!isEditor)); }
    }

    function getReportBranding(){
      return {
        header: state.header || {},
        footer: state.footer || {},
        logo: (state.logoDataUrl && String(state.logoDataUrl).trim()) ? state.logoDataUrl : global.CPPrintLayout.defaults.logo
      };
    }

    function renderReportHeaderFooter(){
      if (global.CPPrintLayout) {
        global.CPPrintLayout.applyReportBranding(document.getElementById('reportRoot'), getReportBranding());
      }
    }

    function renderReportInfo(){
      if (el.rInfoReclamante) el.rInfoReclamante.textContent = state.info.reclamante || '-';
      if (el.rInfoReclamada) el.rInfoReclamada.textContent = state.info.reclamada || '-';
      if (el.rInfoProcesso) el.rInfoProcesso.textContent = state.info.processo || '-';
    }

    function fontesHTML(tipo){
      if (tipo === 'poupanca_auto') return '<ul><li>API SGS/BCB: séries automáticas por período.</li><li>TR mensal (SGS 7811): <a href="https://api.bcb.gov.br/dados/serie/bcdata.sgs.7811/dados?formato=json" target="_blank" rel="noopener">Série 7811</a></li><li>Meta Selic (SGS 432): <a href="https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json" target="_blank" rel="noopener">Série 432</a></li><li>Regra da poupança (BCB): <a href="https://www.bcb.gov.br/meubc/faqs/p/como-e-definida-a-remuneracao-da-poupanca" target="_blank" rel="noopener">Como é definida a remuneração da poupança</a></li></ul>';
      if (tipo === 'jam_auto') return '<ul><li>API SGS/BCB: séries automáticas por período.</li><li>TR mensal (SGS 7811): <a href="https://api.bcb.gov.br/dados/serie/bcdata.sgs.7811/dados?formato=json" target="_blank" rel="noopener">Série 7811</a></li><li>Juros fixos aplicados: 3% a.a. (0,25% a.m.).</li></ul>';
      if (tipo === 'ipca') return '<ul><li>API SGS/BCB: IPCA mensal (SGS 433): <a href="https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json" target="_blank" rel="noopener">Série 433</a></li></ul>';
      if (tipo === 'inpc') return '<ul><li>API SGS/BCB: INPC mensal (SGS 188): <a href="https://api.bcb.gov.br/dados/serie/bcdata.sgs.188/dados?formato=json" target="_blank" rel="noopener">Série 188</a></li></ul>';
      if (tipo === 'igpm') return '<ul><li>API SGS/BCB: IGP-M mensal (SGS 189): <a href="https://api.bcb.gov.br/dados/serie/bcdata.sgs.189/dados?formato=json" target="_blank" rel="noopener">Série 189</a></li></ul>';
      if (tipo === 'igpdi') return '<ul><li>API SGS/BCB: IGP-DI mensal (SGS 190): <a href="https://api.bcb.gov.br/dados/serie/bcdata.sgs.190/dados?formato=json" target="_blank" rel="noopener">Série 190</a></li></ul>';
      if (tipo === 'cdi') return '<ul><li>API SGS/BCB: CDI (SGS 4389, % a.a. base 252) convertido para taxa diária efetiva (<code>(1+v/100)^(1/252)-1</code>) e depois para taxa mensal efetiva por composição diária: <a href="https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados?formato=json" target="_blank" rel="noopener">Série 4389</a></li></ul>';
      if (tipo === 'selic') return '<ul><li>API SGS/BCB: Selic (SGS 11, % a.d.) usada diretamente como taxa diária efetiva (<code>v/100</code>) e depois convertida para taxa mensal efetiva por composição diária: <a href="https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados?formato=json" target="_blank" rel="noopener">Série 11</a></li></ul>';
      return '<p>Índices inseridos manualmente com base na tabela do Juízo/Tribunal.</p>';
    }

    Object.assign(ctx, { toast, setAutoStatus, updateIndexTypeUI, closeConfirm, openConfirm, renderDeposits, renderIndices, switchTab, getReportBranding, renderReportHeaderFooter, renderReportInfo, fontesHTML });
  };

  global.CPDepositoRecursalRenderLoaded = true;
})(window);
