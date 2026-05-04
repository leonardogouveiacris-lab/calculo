(function(global){
  const FIXOS_NACIONAIS = [
    { mes:1, dia:1, nome:'Confraternização Universal', escopo:'nacional' },
    { mes:4, dia:21, nome:'Tiradentes', escopo:'nacional' },
    { mes:5, dia:1, nome:'Dia do Trabalho', escopo:'nacional' },
    { mes:9, dia:7, nome:'Independência do Brasil', escopo:'nacional' },
    { mes:10, dia:12, nome:'Nossa Senhora Aparecida', escopo:'nacional' },
    { mes:11, dia:2, nome:'Finados', escopo:'nacional' },
    { mes:11, dia:15, nome:'Proclamação da República', escopo:'nacional' },
    { mes:11, dia:20, nome:'Dia Nacional de Zumbi e da Consciência Negra', escopo:'nacional' },
    { mes:12, dia:25, nome:'Natal', escopo:'nacional' }
  ];

  function parseISO(iso){
    const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return { ano:Number(m[1]), mes:Number(m[2]), dia:Number(m[3]) };
  }
  function toISO(d){
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
  }
  function offsetISO(iso, days){
    const p = parseISO(iso); if (!p) return null;
    const d = new Date(Date.UTC(p.ano, p.mes-1, p.dia));
    d.setUTCDate(d.getUTCDate() + days);
    return toISO(d);
  }
  function pascoaISO(ano){
    const a = ano % 19;
    const b = Math.floor(ano / 100);
    const c = ano % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return `${ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
  }

  function getFeriadosMoveis(ano){
    const pascoa = pascoaISO(ano);
    return [
      { data: offsetISO(pascoa, -47), nome:'Carnaval', escopo:'nacional-movel' },
      { data: offsetISO(pascoa, -2), nome:'Sexta-feira Santa', escopo:'nacional-movel' },
      { data: offsetISO(pascoa, 60), nome:'Corpus Christi', escopo:'nacional-movel' }
    ];
  }

  function normalizarFeriadoManual(item){
    if (!item) return null;
    const data = item.data || item.date;
    if (!parseISO(data)) return null;
    return { data, nome:item.nome || item.name || 'Feriado manual', escopo:item.escopo || 'manual' };
  }

  function matchEscopoLocal(item, contexto){
    const municipio = String(contexto?.municipio?.nome || contexto?.municipio || '').trim().toLowerCase();
    const uf = String(contexto?.municipio?.uf || contexto?.uf || '').trim().toUpperCase();
    const itemMunicipio = String(item?.municipio || '').trim().toLowerCase();
    const itemUf = String(item?.uf || '').trim().toUpperCase();
    if (itemMunicipio && municipio && itemMunicipio !== municipio) return false;
    if (itemUf && uf && itemUf !== uf) return false;
    return true;
  }

  function getFeriadosLocais(contexto){
    const lista = Array.isArray(contexto?.feriadosLocais) ? contexto.feriadosLocais : [];
    return lista
      .map((item)=>normalizarFeriadoManual(item) ? Object.assign(normalizarFeriadoManual(item), { municipio:item.municipio, uf:item.uf, escopo:'local' }) : null)
      .filter((item)=>item && matchEscopoLocal(item, contexto));
  }

  function getFeriadosNacionaisAno(ano){
    const fixos = FIXOS_NACIONAIS.map((f)=>({ data:`${ano}-${String(f.mes).padStart(2,'0')}-${String(f.dia).padStart(2,'0')}`, nome:f.nome, escopo:f.escopo }));
    return fixos.concat(getFeriadosMoveis(ano));
  }

  function isFeriado(dataISO, contexto){
    const p = parseISO(dataISO);
    if (!p) return { feriado:false, nome:'', escopo:'' };
    const nacionais = getFeriadosNacionaisAno(p.ano);
    const locais = getFeriadosLocais(contexto);
    const manuais = (Array.isArray(contexto?.feriadosManuais) ? contexto.feriadosManuais : []).map(normalizarFeriadoManual).filter(Boolean);
    const todos = nacionais.concat(locais, manuais);
    const encontrado = todos.find((f)=>f.data === dataISO);
    if (!encontrado) return { feriado:false, nome:'', escopo:'' };
    return { feriado:true, nome:encontrado.nome, escopo:encontrado.escopo, data:dataISO };
  }

  global.CPPontoFeriados = { FIXOS_NACIONAIS, getFeriadosMoveis, getFeriadosNacionaisAno, getFeriadosLocais, isFeriado };
})(window);
