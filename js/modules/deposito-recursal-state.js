(function(global){
  'use strict';
  if (global.CPDepositoRecursalStateLoaded) return;

  const DEFAULT_HEADER = {
    nome: 'Leonardo G. Cristiano',
    tel: '(14) 99606-7654',
    email: 'suporte@calculopro.com.br'
  };
  const DEFAULT_FOOTER = {
    l1: 'R. Mário Gonzaga Junqueira, 25-80',
    l2: 'Jardim Viaduto, Bauru - SP, 17055-210',
    site: 'www.calculopro.com.br',
    emp: 'CalculoPro Ltda. 51.540.075/0001-04'
  };

  const defaults = {
    depDate: 'depDate', depValue: 'depValue', depObs: 'depObs', btnAddDep: 'btnAddDep', depTable: 'depTable',
    indexType: 'indexType', manualWrap: 'manualWrap', idxMonth: 'idxMonth', idxValue: 'idxValue', btnAddIdx: 'btnAddIdx', idxTable: 'idxTable', btnSortIdx: 'btnSortIdx', btnClearIdx: 'btnClearIdx',
    endDate: 'endDate', roundingEl: 'roundingEl', btnCalc: 'btnCalc', btnShowReport: 'btnShowReport', btnPrint: 'btnPrint', autoStatus: 'autoStatus', indexHint: 'indexHint', enableAuditLog: 'enableAuditLog',
    infoReclamante: 'infoReclamante', infoReclamada: 'infoReclamada', infoProcesso: 'infoProcesso',
    tabBtnEditor: 'tabBtnEditor', tabBtnReport: 'tabBtnReport', tabEditor: 'tab-editor', tabReport: 'tab-report', btnBackToData: 'btnBackToData', btnPrint2: 'btnPrint2',
    btnExportJson: 'btnExportJson', btnImportJson: 'btnImportJson', fileImportJson: 'fileImportJson',
    rHdrNome: 'rHdrNome', rHdrTel: 'rHdrTel', rHdrEmailLink: 'rHdrEmailLink', rFtrL1: 'rFtrL1', rFtrL2: 'rFtrL2', rFtrSite: 'rFtrSite', rFtrEmp: 'rFtrEmp',
    rInfoReclamante: 'rInfoReclamante', rInfoReclamada: 'rInfoReclamada', rInfoProcesso: 'rInfoProcesso',
    rIdxLabel: 'rIdxLabel', rEndDate: 'rEndDate', rTotalUpdated: 'rTotalUpdated', rBlocks: 'rBlocks', rSources: 'rSources'
  };

  function createModule(userConfig){
    const config = Object.assign({}, defaults, userConfig || {});
    const state = {
      deposits: [], indices: [], autoIndexPayload: null, lastCalc: null,
      header: { ...DEFAULT_HEADER }, footer: { ...DEFAULT_FOOTER }, info: { reclamante:'', reclamada:'', processo:'' }, logoDataUrl: '',
      editingDepIndex: -1, editingIdxIndex: -1
    };
    const el = {};
    function getEl(id){ return document.getElementById(config[id]); }
    function initElements(){ Object.keys(config).forEach(function(key){ el[key] = getEl(key); }); return el; }
    function fmtBRL(n){ return Number(n || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
    function toDateBR(iso){ if (!iso) return ''; const p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }

    function parseISODateUTC(iso){
      const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return null;
      return { y:Number(m[1]), m:Number(m[2]), d:Number(m[3]) };
    }
    function formatISODateUTC(parts){
      return String(parts.y).padStart(4,'0') + '-' + String(parts.m).padStart(2,'0') + '-' + String(parts.d).padStart(2,'0');
    }
    function toBR(iso){ return toDateBR(iso); }
    function monthKeyFromDate(iso){ return String(iso || '').slice(0,7); }
    function addMonths(monthKey, step){ const m = String(monthKey || '').match(/^(\d{4})-(\d{2})$/); if (!m) return ''; var total = (Number(m[1]) * 12) + (Number(m[2]) - 1) + Number(step || 0); var y = Math.floor(total / 12); var mm = (total % 12) + 1; return String(y).padStart(4,'0') + '-' + String(mm).padStart(2,'0'); }
    function monthsBetweenInclusive(startKey, endKey){ const out=[]; if(!startKey||!endKey||startKey>endKey) return out; let cur=startKey; while(cur<=endKey){ out.push(cur); cur=addMonths(cur,1);} return out; }
    function compareMonth(a,b){
      const am = typeof a === 'string' ? a : String((a && a.month) || '');
      const bm = typeof b === 'string' ? b : String((b && b.month) || '');
      return am.localeCompare(bm);
    }
    function sortDeposits(){ state.deposits.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))); }
    function minDepositDate(){ return state.deposits.length ? state.deposits.map(d=>d.date).sort()[0] : ''; }
    function parseBCBNumber(v){ const s = String(v ?? '').trim(); if(!s) return 0; return s.includes(',') ? Number(s.replace(/\./g,'').replace(/,/g,'.')) || 0 : Number(s) || 0; }
    function monthLabel(monthKey){ const p = monthKey.split('-'); return p[1] + '/' + p[0]; }
    function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
    return { config, state, el, initElements, getEl, fmtBRL, toDateBR, toBR, monthKeyFromDate, addMonths, monthsBetweenInclusive, compareMonth, sortDeposits, minDepositDate, parseBCBNumber, monthLabel, esc, parseISODateUTC, formatISODateUTC, DEFAULT_HEADER, DEFAULT_FOOTER };
  }

  global.CPDepositoRecursalFactory = { createModule };
  global.CPDepositoRecursalStateLoaded = true;
})(window);
