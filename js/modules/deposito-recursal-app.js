window.CPFeatureFlags = Object.assign({ useCentralIndices: true }, window.CPFeatureFlags || {});
(function(global){
  'use strict';

  function createDepositoRecursalModule(userConfig){
    const ctx = global.CPDepositoRecursalFactory.createModule(userConfig);
    global.CPDepositoRecursal.attachRender(ctx);
    global.CPDepositoRecursal.attachCalc(ctx);
    global.CPDepositoRecursal.attachPrint(ctx);
    const { state, el } = ctx;
    function withBusy(button, busyLabel, task){
      if (!button) return Promise.resolve().then(task);
      if (!button.dataset.idleLabel) button.dataset.idleLabel = button.textContent || '';
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.textContent = busyLabel || 'Processando...';
      return Promise.resolve()
        .then(task)
        .finally(()=>{
          button.disabled = false;
          button.removeAttribute('aria-busy');
          button.textContent = button.dataset.idleLabel;
        });
    }

    function addDeposit(){
      const date = el.depDate && el.depDate.value; const value = el.depValue ? parseFloat(el.depValue.value) : NaN; const obs = el.depObs ? (el.depObs.value || '').trim() : '';
      if (!date) return ctx.toast('Atenção', 'Informe a data do depósito para continuar.', 'warn');
      if (!Number.isFinite(value)) return ctx.toast('Atenção', 'Informe um valor de depósito válido (ex.: 1500,00).', 'warn');
      state.deposits.push({ date, value, obs }); ctx.sortDeposits();
      if (el.depDate) el.depDate.value = ''; if (el.depValue) el.depValue.value = ''; if (el.depObs) el.depObs.value = '';
      state.editingDepIndex = -1; ctx.renderDeposits(); ctx.toast('OK','Depósito incluído com sucesso.','ok');
    }
    function startEditDeposit(i){ state.editingDepIndex = i; ctx.renderDeposits(); }
    function cancelEditDeposit(){ state.editingDepIndex = -1; ctx.renderDeposits(); }
    function saveEditDeposit(i){ const d=document.getElementById('depEditDate_' + i), v=document.getElementById('depEditValue_' + i), o=document.getElementById('depEditObs_' + i); const date=d?d.value:''; const value=v?parseFloat(v.value):NaN; const obs=o?(o.value||'').trim():''; if(!date) return ctx.toast('Atenção','Informe a data para salvar.','warn'); if(!Number.isFinite(value)) return ctx.toast('Atenção','Informe um valor válido para salvar.','warn'); state.deposits[i]={ date, value, obs }; ctx.sortDeposits(); state.editingDepIndex=-1; ctx.renderDeposits(); ctx.toast('OK','Depósito atualizado com sucesso.','ok'); }
    async function delDep(i){ if(!(await ctx.openConfirm('Deseja excluir este depósito? Esta ação não pode ser desfeita.'))) return; state.deposits.splice(i,1); ctx.sortDeposits(); state.editingDepIndex=-1; ctx.renderDeposits(); ctx.toast('OK','Depósito removido.','ok'); }

    function addManualIndex(){ const month = el.idxMonth && el.idxMonth.value; const value = el.idxValue ? parseFloat(el.idxValue.value) : NaN; if(!month) return ctx.toast('Atenção','Informe o mês de referência do índice.','warn'); if(!Number.isFinite(value)) return ctx.toast('Atenção','Informe um índice válido (ex.: 0,45).','warn'); const found = state.indices.find((i)=>i.month===month); if(found) found.value=value; else state.indices.push({ month, value }); state.indices.sort(ctx.compareMonth); state.editingIdxIndex=-1; ctx.renderIndices(); if (el.idxMonth) el.idxMonth.value=''; if (el.idxValue) el.idxValue.value=''; ctx.toast('OK','Índice salvo com sucesso.','ok'); }
    function startEditIndex(i){ state.editingIdxIndex=i; ctx.renderIndices(); }
    function cancelEditIndex(){ state.editingIdxIndex=-1; ctx.renderIndices(); }
    function saveEditIndex(i){ const m=document.getElementById('idxEditMonth_' + i), v=document.getElementById('idxEditValue_' + i); const month=m?m.value:''; const value=v?parseFloat(v.value):NaN; if(!month) return ctx.toast('Atenção','Informe o mês para salvar.','warn'); if(!Number.isFinite(value)) return ctx.toast('Atenção','Informe um índice válido (ex.: 0,45).','warn'); const otherIndex=state.indices.findIndex((x,j)=>j!==i&&x.month===month); if(otherIndex>=0){ state.indices[otherIndex].value=value; state.indices.splice(i,1); } else { state.indices[i] = { month, value }; } state.indices.sort(ctx.compareMonth); state.editingIdxIndex=-1; ctx.renderIndices(); ctx.toast('OK','Índice atualizado com sucesso.','ok'); }
    async function delIdx(i){ if(!(await ctx.openConfirm('Deseja excluir este índice?'))) return; state.indices.splice(i,1); state.editingIdxIndex=-1; ctx.renderIndices(); ctx.toast('OK','Índice removido.','ok'); }

    async function onCalculateOnly(){ const result = await ctx.calculateAll(); if (result) ctx.toast('OK', 'Cálculo concluído. Gere o relatório para revisar os detalhes.', 'ok'); }
    async function onShowReport(){ const result = await ctx.calculateAll(); if (result) { await ctx.renderReport(result); ctx.switchTab('report'); } }
    async function onPrint(){ const reportRoot = document.getElementById('reportRoot'); const hasReport = !!(reportRoot && reportRoot.querySelector('.page')); let result = state.lastCalc || null; if (!hasReport) { result = await ctx.calculateAll(); if (!result) return; await ctx.renderReport(result); } else if (!result) { result = await ctx.calculateAll(); if (!result) return; } await ctx.openPrintWindow(); }

    function downloadJson(filename, dataObj){ const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type:'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 1500); }
    function exportToJson(){ const payload = { app:'CalculoPro.DepositoRecursal', version:4, exportedAt:new Date().toISOString(), settings:{ indexType: el.indexType ? el.indexType.value : 'manual', endDate: el.endDate ? el.endDate.value : '', rounding: Number(el.roundingEl ? el.roundingEl.value : 2) || 2 }, info:{ ...state.info }, header:{ ...state.header }, footer:{ ...state.footer }, deposits:(state.deposits||[]).map(d=>({ date:d.date, value:Number(d.value), obs:d.obs||'' })), indices:(state.indices||[]).map(x=>({ month:x.month, value:Number(x.value) })) }; downloadJson('deposito-recursal_' + ((payload.settings.endDate || '').slice(0,10) || 'export') + '.json', payload); ctx.toast('OK','Arquivo JSON exportado com sucesso.','ok'); }
    function applyImportedJson(obj){ if(!obj||typeof obj!=='object') throw new Error('Arquivo JSON inválido.'); state.deposits = (Array.isArray(obj.deposits)?obj.deposits:[]).filter(d=>d&&typeof d==='object').map(d=>({ date:String(d.date||''), value:Number(d.value), obs:String(d.obs||'') })).filter(d=>/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(d.date) && Number.isFinite(d.value)); state.indices = (Array.isArray(obj.indices)?obj.indices:[]).filter(x=>x&&typeof x==='object').map(x=>({ month:String(x.month||''), value:Number(x.value) })).filter(x=>/^[0-9]{4}-[0-9]{2}$/.test(x.month) && Number.isFinite(x.value)).sort(ctx.compareMonth); if(obj.info&&typeof obj.info==='object'){ state.info.reclamante=String(obj.info.reclamante ?? state.info.reclamante); state.info.reclamada=String(obj.info.reclamada ?? state.info.reclamada); state.info.processo=String(obj.info.processo ?? state.info.processo); } if(obj.settings&&typeof obj.settings==='object'){ if(el.indexType&&obj.settings.indexType) el.indexType.value=String(obj.settings.indexType); if(el.endDate&&obj.settings.endDate) el.endDate.value=String(obj.settings.endDate); if(el.roundingEl&&obj.settings.rounding!=null) el.roundingEl.value=String(obj.settings.rounding); } ctx.sortDeposits(); ctx.updateIndexTypeUI(); state.editingDepIndex=-1; state.editingIdxIndex=-1; ctx.renderDeposits(); ctx.renderIndices(); ctx.renderReportInfo(); ctx.toast('OK','Importação concluída com sucesso.','ok'); }
    function importFromJsonFile(file){ return new Promise((resolve,reject)=>{ const fr = new FileReader(); fr.onerror=()=>reject(new Error('Não foi possível ler o arquivo selecionado.')); fr.onload=()=>{ try{ applyImportedJson(JSON.parse(String(fr.result || ''))); resolve(true); }catch(e){ reject(new Error('Não foi possível importar: JSON inválido ou fora do padrão esperado.')); } }; fr.readAsText(file); }); }

    function bindEvents(){
      const btnClose = document.getElementById('btnModalClose'); if(btnClose) btnClose.addEventListener('click', ctx.closeConfirm);
      const backdrop = document.getElementById('modalBackdrop'); if(backdrop) backdrop.addEventListener('click', (e)=>{ if(e.target === backdrop) ctx.closeConfirm(); });
      if (el.btnAddDep) el.btnAddDep.addEventListener('click', addDeposit);
      [el.depDate, el.depValue, el.depObs].filter(Boolean).forEach((field)=>{
        field.addEventListener('keydown', (ev)=>{
          if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); addDeposit(); }
        });
      });
      if (el.depTable) el.depTable.addEventListener('click', (ev)=>{ const b=ev.target.closest('button[data-action]'); if(!b) return; const i=Number(b.getAttribute('data-i')); const action=b.getAttribute('data-action'); if(action==='edit') startEditDeposit(i); if(action==='save') saveEditDeposit(i); if(action==='cancel') cancelEditDeposit(); if(action==='del') delDep(i); });
      if (el.btnAddIdx) el.btnAddIdx.addEventListener('click', addManualIndex);
      [el.idxMonth, el.idxValue].filter(Boolean).forEach((field)=>{
        field.addEventListener('keydown', (ev)=>{
          if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); addManualIndex(); }
        });
      });
      if (el.idxTable) el.idxTable.addEventListener('click', (ev)=>{ const b=ev.target.closest('button[data-action]'); if(!b) return; const i=Number(b.getAttribute('data-i')); const action=b.getAttribute('data-action'); if(action==='edit') startEditIndex(i); if(action==='save') saveEditIndex(i); if(action==='cancel') cancelEditIndex(); if(action==='del') delIdx(i); });
      if (el.btnSortIdx) el.btnSortIdx.addEventListener('click', ()=>{ state.indices.sort(ctx.compareMonth); ctx.renderIndices(); ctx.toast('OK','Índices ordenados por competência.','ok'); });
      if (el.btnClearIdx) el.btnClearIdx.addEventListener('click', async ()=>{ if(!(await ctx.openConfirm('Deseja limpar todos os índices? Esta ação não pode ser desfeita.'))) return; state.indices=[]; state.editingIdxIndex=-1; ctx.renderIndices(); ctx.toast('OK','Todos os índices foram removidos.','ok'); });
      if (el.indexType) el.indexType.addEventListener('change', ctx.updateIndexTypeUI);
      if (el.btnCalc) el.btnCalc.addEventListener('click', ()=>withBusy(el.btnCalc, 'Calculando...', onCalculateOnly));
      if (el.btnShowReport) el.btnShowReport.addEventListener('click', ()=>withBusy(el.btnShowReport, 'Gerando relatório...', onShowReport));
      if (el.btnPrint) el.btnPrint.addEventListener('click', ()=>withBusy(el.btnPrint, 'Preparando impressão...', onPrint));
      if (el.tabBtnEditor) el.tabBtnEditor.addEventListener('click', ()=>ctx.switchTab('editor'));
      if (el.tabBtnReport) el.tabBtnReport.addEventListener('click', ()=>ctx.switchTab('report'));
      const btnGoReport = document.getElementById('btnGoReport'); if (btnGoReport) btnGoReport.addEventListener('click', ()=>ctx.switchTab('report'));
      const btnBack = document.getElementById('btnBack'); if (btnBack) btnBack.addEventListener('click', ()=>{ location.href = 'index.html'; });
      if (el.btnBackToData) el.btnBackToData.addEventListener('click', ()=>ctx.switchTab('editor'));
      if (el.btnPrint2) el.btnPrint2.addEventListener('click', ()=>withBusy(el.btnPrint2, 'Preparando impressão...', onPrint));
      if (el.infoReclamante) el.infoReclamante.addEventListener('input', (e)=>{ state.info.reclamante=String(e.target.value||''); ctx.renderReportInfo(); });
      if (el.infoReclamada) el.infoReclamada.addEventListener('input', (e)=>{ state.info.reclamada=String(e.target.value||''); ctx.renderReportInfo(); });
      if (el.infoProcesso) el.infoProcesso.addEventListener('input', (e)=>{ state.info.processo=String(e.target.value||''); ctx.renderReportInfo(); });
      if (el.btnExportJson) el.btnExportJson.addEventListener('click', ()=>withBusy(el.btnExportJson, 'Exportando JSON...', exportToJson));
      if (el.btnImportJson) el.btnImportJson.addEventListener('click', ()=>{ if (!el.fileImportJson) return; el.fileImportJson.value=''; el.fileImportJson.click(); });
      if (el.fileImportJson) el.fileImportJson.addEventListener('change', async (e)=>{ const file=(e.target.files||[])[0]; if(!file) return; try{ await withBusy(el.btnImportJson, 'Importando JSON...', ()=>importFromJsonFile(file)); }catch(err){ ctx.toast('Erro', err.message || 'Erro ao importar o JSON.', 'err'); } });
      document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ ctx.closeConfirm(); state.editingDepIndex=-1; state.editingIdxIndex=-1; ctx.renderDeposits(); ctx.renderIndices(); } });
    }

    function init(){
      ctx.initElements();
      ctx.updateIndexTypeUI();
      ctx.renderDeposits();
      ctx.renderIndices();
      ctx.renderReportHeaderFooter();
      ctx.renderReportInfo();
      bindEvents();
      ctx.switchTab('editor');
    }

    return { state, el, init, calculateAll: ctx.calculateAll, renderReport: ctx.renderReport };
  }

  function boot(){
    const app = createDepositoRecursalModule();
    app.init();
    global.CPDepositoRecursalApp = app;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  global.createDepositoRecursalModule = createDepositoRecursalModule;
})(window);
