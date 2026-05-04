(function(global){
  function parseDurationToMinutes(value){
    const v = String(value || '').trim(); if (!v) return 0;
    const hm = v.match(/^(-?)(\d{1,2}):(\d{2})$/);
    if (hm) return (hm[1] ? -1 : 1) * (Number(hm[2]) * 60 + Number(hm[3]));
    const only = v.replace(/\D/g,''); if (only.length===4) return Number(only.slice(0,2))*60 + Number(only.slice(2));
    const num = Number(v.replace(/\./g,'').replace(',','.')); if (!Number.isFinite(num)) return 0;
    return Math.round(num*60);
  }
  function formatMinutes(total){
    const sign = total < 0 ? '-' : ''; const abs = Math.abs(total); const h = Math.floor(abs/60); const m = abs%60;
    return `${sign}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }
  function maskTime(v){ const d=String(v||'').replace(/\D/g,'').slice(0,4); if (d.length<=2) return d; return d.slice(0,2)+':'+d.slice(2); }
  global.CPPontoCalcUtils = { parseDurationToMinutes, formatMinutes, maskTime };
})(window);
