window.CPFeatureFlags = Object.assign({ useCentralIndices: true }, window.CPFeatureFlags || {});
(function(global){
  'use strict';

  function createDepositoRecursalModule(userConfig){
    const ctx = global.CPDepositoRecursalFactory.createModule(userConfig);
    global.CPDepositoRecursal.attachRender(ctx);
    global.CPDepositoRecursal.attachCalc(ctx);
    global.CPDepositoRecursal.attachPrint(ctx);
    const { state, el } = ctx;

    function addDeposit(){
      const date = el.depDate && el.depDate.value; const value = el.depValue ? parseFloat(el.depValue.value) : NaN; const obs = el.depObs ? (el.depObs.value || '').trim() : '';
      if (!date) return ctx.toast('Atenção', 'Informe a data do depósito.', 'warn');
      if (!Number.isFinite(value)) return ctx.toast('Atenção', 'Informe um valor de depósito válido.', 'warn');
      state.deposits.push({ date, value, obs }); ctx.sortDeposits();
      if (el.depDate) el.depDate.value = ''; if (el.depValue) el.depValue.value = ''; if (el.depObs) el.depObs.value = '';
      state.editingDepIndex = -1; ctx.renderDeposits(); ctx.toast('OK','Depósito adicionado.','ok');
    }
    function startEditDeposit(i){ state.editingDepIndex = i; ctx.renderDeposits(); }
    function cancelEditDeposit(){ state.editingDepIndex = -1; ctx.renderDeposits(); }
    function saveEditDeposit(i){ const d=document.getElementById('depEditDate_' + i), v=document.getElementById('depEditValue_' + i), o=document.getElementById('depEditObs_' + i); const date=d?d.value:''; const value=v?parseFloat(v.value):NaN; const obs=o?(o.value||'').trim():''; if(!date) return ctx.toast('Atenção','Informe a data.','warn'); if(!Number.isFinite(value)) return ctx.toast('Atenção','Informe um valor válido.','warn'); state.deposits[i]={ date, value, obs }; ctx.sortDeposits(); state.editingDepIndex=-1; ctx.renderDeposits(); ctx.toast('OK','Depósito atualizado.','ok'); }
    async function delDep(i){ if(!(await ctx.openConfirm('Excluir este depósito?'))) return; state.deposits.splice(i,1); ctx.sortDeposits(); state.editingDepIndex=-1; ctx.renderDeposits(); ctx.toast('OK','Depósito excluído.','ok'); }

    function addManualIndex(){ const month = el.idxMonth && el.idxMonth.value; const value = el.idxValue ? parseFloat(el.idxValue.value) : NaN; if(!month) return ctx.toast('Atenção','Informe o mês do índice.','warn'); if(!Number.isFinite(value)) return ctx.toast('Atenção','Informe um índice válido.','warn'); const found = state.indices.find((i)=>i.month===month); if(found) found.value=value; else state.indices.push({ month, value }); state.indices.sort(ctx.compareMonth); state.editingIdxIndex=-1; ctx.renderIndices(); if (el.idxMonth) el.idxMonth.value=''; if (el.idxValue) el.idxValue.value=''; ctx.toast('OK','Índice atualizado/adicionado.','ok'); }
    function startEditIndex(i){ state.editingIdxIndex=i; ctx.renderIndices(); }
    function cancelEditIndex(){ state.editingIdxIndex=-1; ctx.renderIndices(); }
    function saveEditIndex(i){ const m=document.getElementById('idxEditMonth_' + i), v=document.getElementById('idxEditValue_' + i); const month=m?m.value:''; const value=v?parseFloat(v.value):NaN; if(!month) return ctx.toast('Atenção','Informe o mês.','warn'); if(!Number.isFinite(value)) return ctx.toast('Atenção','Informe um índice válido.','warn'); const otherIndex=state.indices.findIndex((x,j)=>j!==i&&x.month===month); if(otherIndex>=0){ state.indices[otherIndex].value=value; state.indices.splice(i,1); } else { state.indices[i] = { month, value }; } state.indices.sort(ctx.compareMonth); state.editingIdxIndex=-1; ctx.renderIndices(); ctx.toast('OK','Índice atualizado.','ok'); }
    async function delIdx(i){ if(!(await ctx.openConfirm('Excluir este índice?'))) return; state.indices.splice(i,1); state.editingIdxIndex=-1; ctx.renderIndices(); ctx.toast('OK','Índice excluído.','ok'); }

    async function onCalculateOnly(){ const result = await ctx.calculateAll(); if (result) ctx.toast('OK', 'Cálculo pronto. Agora gere o relatório.', 'ok'); }
    async function onShowReport(){ const result = await ctx.calculateAll(); if (result) await ctx.renderReport(result); }
    async function onPrint(){ const reportRoot = document.getElementById('reportRoot'); const hasReport = !!(reportRoot && reportRoot.querySelector('.page')); let result = state.lastCalc || null; if (!hasReport) { result = await ctx.calculateAll(); if (!result) return; await ctx.renderReport(result); } else if (!result) { result = await ctx.calculateAll(); if (!result) return; } await ctx.openPrintWindow(); }

    function downloadJson(filename, dataObj){ const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type:'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 1500); }
    function exportToJson(){ const payload = { app:'CalculoPro.DepositoRecursal', version:4, exportedAt:new Date().toISOString(), settings:{ indexType: el.indexType ? el.indexType.value : 'manual', endDate: el.endDate ? el.endDate.value : '', rounding: Number(el.roundingEl ? el.roundingEl.value : 2) || 2 }, info:{ ...state.info }, header:{ ...state.header }, footer:{ ...state.footer }, deposits:(state.deposits||[]).map(d=>({ date:d.date, value:Number(d.value), obs:d.obs||'' })), indices:(state.indices||[]).map(x=>({ month:x.month, value:Number(x.value) })) }; downloadJson('deposito-recursal_' + ((payload.settings.endDate || '').slice(0,10) || 'export') + '.json', payload); ctx.toast('OK','JSON exportado.','ok'); }
    function applyImportedJson(obj){ if(!obj||typeof obj!=='object') throw new Error('JSON inválido.'); state.deposits = (Array.isArray(obj.deposits)?obj.deposits:[]).filter(d=>d&&typeof d==='object').map(d=>({ date:String(d.date||''), value:Number(d.value), obs:String(d.obs||'') })).filter(d=>/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(d.date) && Number.isFinite(d.value)); state.indices = (Array.isArray(obj.indices)?obj.indices:[]).filter(x=>x&&typeof x==='object').map(x=>({ month:String(x.month||''), value:Number(x.value) })).filter(x=>/^[0-9]{4}-[0-9]{2}$/.test(x.month) && Number.isFinite(x.value)).sort(ctx.compareMonth); if(obj.info&&typeof obj.info==='object'){ state.info.reclamante=String(obj.info.reclamante ?? state.info.reclamante); state.info.reclamada=String(obj.info.reclamada ?? state.info.reclamada); state.info.processo=String(obj.info.processo ?? state.info.processo); } if(obj.settings&&typeof obj.settings==='object'){ if(el.indexType&&obj.settings.indexType) el.indexType.value=String(obj.settings.indexType); if(el.endDate&&obj.settings.endDate) el.endDate.value=String(obj.settings.endDate); if(el.roundingEl&&obj.settings.rounding!=null) el.roundingEl.value=String(obj.settings.rounding); } ctx.sortDeposits(); ctx.updateIndexTypeUI(); state.editingDepIndex=-1; state.editingIdxIndex=-1; ctx.renderDeposits(); ctx.renderIndices(); ctx.renderReportInfo(); ctx.toast('OK','JSON importado com sucesso.','ok'); }
    function importFromJsonFile(file){ return new Promise((resolve,reject)=>{ const fr = new FileReader(); fr.onerror=()=>reject(new Error('Falha ao ler o arquivo.')); fr.onload=()=>{ try{ applyImportedJson(JSON.parse(String(fr.result || ''))); resolve(true); }catch(e){ reject(new Error('Não foi possível importar: JSON inválido ou estrutura inesperada.')); } }; fr.readAsText(file); }); }

    function bindEvents(){
      const btnClose = document.getElementById('btnModalClose'); if(btnClose) btnClose.addEventListener('click', ctx.closeConfirm);
      const backdrop = document.getElementById('modalBackdrop'); if(backdrop) backdrop.addEventListener('click', (e)=>{ if(e.target === backdrop) ctx.closeConfirm(); });
      if (el.btnAddDep) el.btnAddDep.addEventListener('click', addDeposit);
      if (el.depTable) el.depTable.addEventListener('click', (ev)=>{ const b=ev.target.closest('button[data-action]'); if(!b) return; const i=Number(b.getAttribute('data-i')); const action=b.getAttribute('data-action'); if(action==='edit') startEditDeposit(i); if(action==='save') saveEditDeposit(i); if(action==='cancel') cancelEditDeposit(); if(action==='del') delDep(i); });
      if (el.btnAddIdx) el.btnAddIdx.addEventListener('click', addManualIndex);
      if (el.idxTable) el.idxTable.addEventListener('click', (ev)=>{ const b=ev.target.closest('button[data-action]'); if(!b) return; const i=Number(b.getAttribute('data-i')); const action=b.getAttribute('data-action'); if(action==='edit') startEditIndex(i); if(action==='save') saveEditIndex(i); if(action==='cancel') cancelEditIndex(); if(action==='del') delIdx(i); });
      if (el.btnSortIdx) el.btnSortIdx.addEventListener('click', ()=>{ state.indices.sort(ctx.compareMonth); ctx.renderIndices(); ctx.toast('OK','Índices ordenados.','ok'); });
      if (el.btnClearIdx) el.btnClearIdx.addEventListener('click', async ()=>{ if(!(await ctx.openConfirm('Limpar todos os índices?'))) return; state.indices=[]; state.editingIdxIndex=-1; ctx.renderIndices(); ctx.toast('OK','Índices limpos.','ok'); });
      if (el.indexType) el.indexType.addEventListener('change', ctx.updateIndexTypeUI);
      if (el.btnCalc) el.btnCalc.addEventListener('click', onCalculateOnly);
      if (el.btnShowReport) el.btnShowReport.addEventListener('click', onShowReport);
      if (el.btnPrint) el.btnPrint.addEventListener('click', onPrint);
      if (el.tabBtnEditor) el.tabBtnEditor.addEventListener('click', ()=>ctx.switchTab('editor'));
      if (el.tabBtnReport) el.tabBtnReport.addEventListener('click', ()=>ctx.switchTab('report'));
      const btnGoReport = document.getElementById('btnGoReport'); if (btnGoReport) btnGoReport.addEventListener('click', ()=>ctx.switchTab('report'));
      const btnBack = document.getElementById('btnBack'); if (btnBack) btnBack.addEventListener('click', ()=>{ location.href = 'index.html'; });
      if (el.btnBackToData) el.btnBackToData.addEventListener('click', ()=>ctx.switchTab('editor'));
      if (el.btnPrint2) el.btnPrint2.addEventListener('click', onPrint);
      if (el.infoReclamante) el.infoReclamante.addEventListener('input', (e)=>{ state.info.reclamante=String(e.target.value||''); ctx.renderReportInfo(); });
      if (el.infoReclamada) el.infoReclamada.addEventListener('input', (e)=>{ state.info.reclamada=String(e.target.value||''); ctx.renderReportInfo(); });
      if (el.infoProcesso) el.infoProcesso.addEventListener('input', (e)=>{ state.info.processo=String(e.target.value||''); ctx.renderReportInfo(); });
      if (el.btnExportJson) el.btnExportJson.addEventListener('click', exportToJson);
      if (el.btnImportJson) el.btnImportJson.addEventListener('click', ()=>{ if (!el.fileImportJson) return; el.fileImportJson.value=''; el.fileImportJson.click(); });
      if (el.fileImportJson) el.fileImportJson.addEventListener('change', async (e)=>{ const file=(e.target.files||[])[0]; if(!file) return; try{ await importFromJsonFile(file); }catch(err){ ctx.toast('Erro', err.message || 'Erro ao importar JSON.', 'err'); } });
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
