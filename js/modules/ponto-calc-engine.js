(function(global){
  const EMPTY_RESULT = () => ({ trabalhadas:0, extras50:0, extras100:0, noturnas:0, noturnasReduzidas:0, atrasos:0, faltas:0, dsr:0, feriados:0, adicionalNoturno:0 });

  function parseTimeToMinutes(value){
    const raw = String(value || '').trim();
    if (!raw) return null;
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 3 || digits.length > 4) return null;
    const full = digits.padStart(4, '0');
    const hh = Number(full.slice(0,2));
    const mm = Number(full.slice(2));
    if (hh > 23 || mm > 59) return null;
    return hh * 60 + mm;
  }

  function sumIntervals(intervals){
    return intervals.reduce((acc, it)=>{
      if (!it || it.inicio == null || it.fim == null || it.fim <= it.inicio) return acc;
      return acc + (it.fim - it.inicio);
    }, 0);
  }

  function overlapNight(interval){
    if (!interval || interval.inicio == null || interval.fim == null || interval.fim <= interval.inicio) return 0;
    const nightStart = 22 * 60;
    const nightEnd = 29 * 60;
    const ini = interval.inicio < interval.fim ? interval.inicio : interval.inicio - (24 * 60);
    const fim = interval.fim;
    return Math.max(0, Math.min(fim, nightEnd) - Math.max(ini, nightStart));
  }

  function normalizeDay(registroDia){
    const entradas = Array.isArray(registroDia?.entradasSaidas) ? registroDia.entradasSaidas : [];
    const intervals = [];
    for (let i = 0; i < entradas.length; i += 2){
      const ini = parseTimeToMinutes(entradas[i]);
      const fimRaw = parseTimeToMinutes(entradas[i+1]);
      if (ini == null || fimRaw == null) continue;
      let fim = fimRaw;
      if (fim <= ini) fim += 24 * 60;
      intervals.push({ inicio: ini, fim });
    }
    const diaSemana = String(registroDia?.diaSemana || '').toLowerCase();
    return {
      data: registroDia?.data || '',
      diaSemana,
      entradasSaidas: entradas,
      intervalos: intervals,
      ocorrencias: Array.isArray(registroDia?.ocorrencias) ? registroDia.ocorrencias : [],
      flags: Object.assign({ folga:false, feriado:false, falta:false, justificativa:false }, registroDia?.flags || {})
    };
  }

  function calcularDia(registroDia, configuracao, calendario){
    const cfg = Object.assign({ jornadaDiariaMin: 8*60, adicionalNoturnoPercentual: 20, reducaoNoturnaFator: 60/52.5 }, configuracao || {});
    const day = normalizeDay(registroDia || {});
    const result = EMPTY_RESULT();
    const worked = sumIntervals(day.intervalos);
    result.trabalhadas = worked;
    const isDomingo = day.diaSemana === 'dom';
    const isFeriado = !!day.flags.feriado || (calendario && typeof calendario.isFeriado === 'function' && calendario.isFeriado(day.data));
    if (isFeriado) result.feriados = worked;
    if (day.flags.falta || (!worked && !day.flags.folga && !isDomingo && !isFeriado)) result.faltas = cfg.jornadaDiariaMin;
    if (!isDomingo && !isFeriado && worked < cfg.jornadaDiariaMin) result.atrasos = Math.max(0, cfg.jornadaDiariaMin - worked);
    if (!isDomingo && !isFeriado && worked > cfg.jornadaDiariaMin) result.extras50 = worked - cfg.jornadaDiariaMin;
    if ((isDomingo || isFeriado) && worked > 0) result.extras100 = worked;
    result.noturnas = day.intervalos.reduce((acc, it)=>acc + overlapNight(it), 0);
    result.noturnasReduzidas = Math.round(result.noturnas * cfg.reducaoNoturnaFator);
    result.adicionalNoturno = Math.round(result.noturnas * (cfg.adicionalNoturnoPercentual / 100));
    if (isDomingo && worked > 0) result.dsr = worked;
    return { entradaNormalizada: day, rubricas: result };
  }

  function merge(a,b){ Object.keys(a).forEach((k)=>{ a[k] += b[k] || 0; }); return a; }

  function calcularMes(registrosMes, configuracao, calendario){
    const dias = (registrosMes || []).map((dia)=>calcularDia(dia, configuracao, calendario));
    const totais = dias.reduce((acc, d)=>merge(acc, d.rubricas), EMPTY_RESULT());
    return { dias, rubricas: totais };
  }

  function calcularPeriodo(meses, configuracao, calendario){
    const competencias = (meses || []).map((mes)=>({ competencia: mes.competencia, resultado: calcularMes(mes.registros || [], configuracao, calendario) }));
    const rubricas = competencias.reduce((acc, m)=>merge(acc, m.resultado.rubricas), EMPTY_RESULT());
    return { competencias, rubricas };
  }

  global.CPPontoCalcEngine = { calcularDia, calcularMes, calcularPeriodo, utils:{ parseTimeToMinutes, sumIntervals } };
})(window);
