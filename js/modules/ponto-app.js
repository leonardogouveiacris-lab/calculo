(function(){
  const STORAGE_KEY_V1 = 'cp_apuracao_ponto_v1';
  const STORAGE_KEY_V2 = 'cp_apuracao_ponto_v2';
  const $ = (id)=>document.getElementById(id);
  const fields = {
    autor:$('autor'), reu:$('reu'), processo:$('processo'), vara:$('vara'), municipio:$('municipio'),
    periodoInicial:$('periodoInicial'), periodoFinal:$('periodoFinal'), obsGerais:$('obsGerais')
  };
  const DEFAULT_TEMPLATE = [
    ['data','Data','dd/mm/aaaa'],['dia','Dia','seg/ter/qua...'],['entrada','Ent. 1','hhmm'],['saida','Sai. 1','hhmm'],
    ['entrada','Ent. 2','hhmm'],['saida','Sai. 2','hhmm'],['ocorrencia','Ocorrência','texto livre'],['observacao','Observações','texto livre'],
    ['apuracao','Carga','definir'],['apuracao','Total Trabalhado','fórmula/editável'],['apuracao','HE Diária','fórmula/editável'],
    ['apuracao','HE Semanal','fórmula/editável'],['apuracao','HE Repousos/Feriados','fórmula/editável'],['apuracao','Horas Noturnas','fórmula/editável'],['apuracao','HN Reduzida','manual']
  ];
  const ALLOWED_TYPES = new Set(['data','dia','entrada','saida','ocorrencia','observacao','apuracao','texto']);
  const WEEKDAYS = ['dom','seg','ter','qua','qui','sex','sáb'];
  const MONTHS = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  const REPORT_HEADER = {
    nome: 'Leonardo G. Cristiano',
    tel: '(14) 99606-7654',
    email: 'suporte@calculopro.com.br'
  };
  const REPORT_FOOTER = {
    l1: 'R. Mário Gonzaga Junqueira, 25-80',
    l2: 'Jardim Viaduto, Bauru - SP, 17055-210',
    site: 'www.calculopro.com.br',
    emp: 'CalculoPro Ltda. 51.540.075/0001-04'
  };
  const PRINT_CONTEXT = 'apuracao-ponto-print';
  const PRINT_TITLE = 'Relatório - Apuração de Ponto';

  const WIDE_EDITOR_THRESHOLD = 10;
  const RUBRICAS = ['trabalhadas','extras50','extras100','noturnas','noturnasReduzidas','atrasos','faltas','dsr','feriados','adicionalNoturno'];
  const DEFAULT_VISIBILITY = { horarios:true, textos:true, apuracoes:true };
  const DEFAULT_CONFIG_APURACAO = {jornadaDiariaMin:480,jornadaSemanalMin:2640,escala:'5x2',escalaPersonalizada:'',toleranciaMarcacaoMin:5,janelaNoturnaInicio:'22:00',janelaNoturnaFim:'05:00',reducaoNoturnaFator:60/52.5,heDiasUteisPercentual:50,heDomingosFeriadosPercentual:100,bancoHorasAtivo:false,bancoHorasLimiteMin:0,dsrSobreHe:true,dsrConsideraFeriados:true};
  let state = { identificacao:{}, configApuracao:Object.assign({}, DEFAULT_CONFIG_APURACAO), columns:[], monthOrder:[], months:{}, activeMonth:'', imported:false, prefixes:{}, visibility:Object.assign({}, DEFAULT_VISIBILITY), feriadosLocais:[], feriadosManuais:[], raw:{ months:{} }, calc:{ diasPorMes:{}, meses:{} }, storageVersion:2 };

  function init(){
    bindTabs(); bindActions(); load(); renderAll();
  }

  function bindTabs(){
    document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b===btn));
      document.querySelectorAll('.tabpane').forEach(p=>p.classList.toggle('active', p.id === 'tab-'+target));
      if (target === 'report') renderReport();
    }));
  }

  function bindActions(){
    $('btnBack').addEventListener('click', ()=>{ window.location.href='index.html'; });
    $('btnGerarPeriodo').addEventListener('click', generatePeriod);
    $('btnExportModeloCsv').addEventListener('click', exportTemplateCsv);
    $('btnImportCsv').addEventListener('click', ()=>$('inputImportCsv').click());
    $('inputImportCsv').addEventListener('change', importCsv);
    $('btnPrint').addEventListener('click', ()=>{
      if (window.CPPrintLayout && typeof window.CPPrintLayout.printRootInHost === 'function') {
        window.CPPrintLayout.printRootInHost($('reportRoot'), 'apuracao-ponto-print', 'Relatório de Apuração de Ponto');
        return;
      }
      window.print();
    });
    $('btnExportJson').addEventListener('click', exportJson);
    $('btnImportJson').addEventListener('click', ()=>$('inputImportJson').click());
    $('inputImportJson').addEventListener('change', importJson);
    $('toggleDifferences').addEventListener('change', (e)=>{
      state.summaryOptions.apurarDiferencas = !!e.target.checked;
      save(); renderMonthlySummary();
    });
    Object.values(fields).forEach(el=>el && el.addEventListener('input', ()=>{ syncIdentificacao(); save(); renderReport(); }));
    bindConfigApuracao();
  }

  

  function bindConfigApuracao(){
    ['jornadaDiaria','jornadaSemanal','escala','escalaPersonalizada','toleranciaMarcacao','janelaNoturnaInicio','janelaNoturnaFim','reducaoNoturnaMinutos','heDiasUteis','heDomingosFeriados','bancoHorasAtivo','bancoHorasLimite','dsrSobreHe','dsrConsideraFeriados'].forEach((id)=>{ const el=$(id); if(!el) return; el.addEventListener('input', saveConfigApuracaoFromUi); el.addEventListener('change', saveConfigApuracaoFromUi); });
  }
  function parseHmToMinutes(v){ const m=String(v||'').trim().match(/^(\d{1,2}):(\d{2})$/); if(!m) return null; const h=Number(m[1]), mm=Number(m[2]); if(h>23||mm>59) return null; return h*60+mm; }
  function saveConfigApuracaoFromUi(){ const p=parseConfigApuracaoFromUi(); if(!p.ok) return; state.configApuracao=p.config; recalcCalcCache(); save(); renderMonthlySummary(); renderReport(); }
  function parseConfigApuracaoFromUi(){
    const e=[];
    const jornadaDiariaMin=CPPontoCalcUtils.parseDurationToMinutes($('jornadaDiaria').value);
    const jornadaSemanalMin=CPPontoCalcUtils.parseDurationToMinutes($('jornadaSemanal').value);
    const toleranciaMarcacaoMin=Number($('toleranciaMarcacao').value||0);
    const reducaoNoturnaMinutos=Number($('reducaoNoturnaMinutos').value||52.5);
    const escala=$('escala').value;
    if(!jornadaDiariaMin) e.push('Informe jornada diária válida (HH:MM).'); if(!jornadaSemanalMin) e.push('Informe jornada semanal válida (HH:MM).');
    if(toleranciaMarcacaoMin<0) e.push('Tolerância inválida.'); if(!parseHmToMinutes($('janelaNoturnaInicio').value)||!parseHmToMinutes($('janelaNoturnaFim').value)) e.push('Janela noturna inválida.');
    if(reducaoNoturnaMinutos<=0) e.push('Redução da hora noturna inválida.'); if(escala==='personalizada' && !$('escalaPersonalizada').value.trim()) e.push('Descreva a escala personalizada.');
    $('configApuracaoErrors').innerHTML=e.length?`<div class="hint" style="color:#b42318">${e.join('<br>')}</div>`:'';
    return { ok:!e.length, config:{ jornadaDiariaMin,jornadaSemanalMin,escala,escalaPersonalizada:$('escalaPersonalizada').value.trim(),toleranciaMarcacaoMin,janelaNoturnaInicio:$('janelaNoturnaInicio').value,janelaNoturnaFim:$('janelaNoturnaFim').value,reducaoNoturnaFator:60/reducaoNoturnaMinutos,heDiasUteisPercentual:Number($('heDiasUteis').value||50),heDomingosFeriadosPercentual:Number($('heDomingosFeriados').value||100),bancoHorasAtivo:!!$('bancoHorasAtivo').checked,bancoHorasLimiteMin:CPPontoCalcUtils.parseDurationToMinutes($('bancoHorasLimite').value||'00:00')||0,dsrSobreHe:!!$('dsrSobreHe').checked,dsrConsideraFeriados:!!$('dsrConsideraFeriados').checked } };
  }
  function hydrateConfigApuracao(){ const c=Object.assign({},DEFAULT_CONFIG_APURACAO,state.configApuracao||{}); state.configApuracao=c; $('jornadaDiaria').value=CPPontoCalcUtils.formatMinutes(c.jornadaDiariaMin||0); $('jornadaSemanal').value=CPPontoCalcUtils.formatMinutes(c.jornadaSemanalMin||0); $('escala').value=c.escala||'5x2'; $('escalaPersonalizada').value=c.escalaPersonalizada||''; $('toleranciaMarcacao').value=c.toleranciaMarcacaoMin??5; $('janelaNoturnaInicio').value=c.janelaNoturnaInicio||'22:00'; $('janelaNoturnaFim').value=c.janelaNoturnaFim||'05:00'; $('reducaoNoturnaMinutos').value=(60/(c.reducaoNoturnaFator||(60/52.5))).toFixed(2); $('heDiasUteis').value=c.heDiasUteisPercentual??50; $('heDomingosFeriados').value=c.heDomingosFeriadosPercentual??100; $('bancoHorasAtivo').checked=!!c.bancoHorasAtivo; $('bancoHorasLimite').value=CPPontoCalcUtils.formatMinutes(c.bancoHorasLimiteMin||0); $('dsrSobreHe').checked=!!c.dsrSobreHe; $('dsrConsideraFeriados').checked=!!c.dsrConsideraFeriados; }
function syncIdentificacao(){
    state.identificacao = {
      autor:fields.autor.value.trim(), reu:fields.reu.value.trim(), processo:fields.processo.value.trim(), vara:fields.vara.value.trim(),
      municipio:fields.municipio.value.trim(), periodoInicial:fields.periodoInicial.value, periodoFinal:fields.periodoFinal.value, obsGerais:fields.obsGerais.value.trim()
    };
  }

  function hydrateIdentificacao(){
    const id = state.identificacao || {};
    fields.autor.value = id.autor || ''; fields.reu.value = id.reu || ''; fields.processo.value = id.processo || ''; fields.vara.value = id.vara || '';
    fields.municipio.value = id.municipio || ''; fields.periodoInicial.value = id.periodoInicial || ''; fields.periodoFinal.value = id.periodoFinal || ''; fields.obsGerais.value = id.obsGerais || '';
  }

  function generatePeriod(){
    syncIdentificacao();
    const start = parseISO(fields.periodoInicial.value);
    const end = parseISO(fields.periodoFinal.value);
    if (!start || !end || start > end){ alert('Informe um período válido.'); return; }
    state.columns = [{ id:'data', type:'data', name:'Data', guide:'dd/mm/aaaa' }, { id:'dia', type:'dia', name:'Dia', guide:'seg/ter/qua...' }];
    state.months = {}; state.monthOrder = []; state.imported = false; state.prefixes = {}; state.visibility = Object.assign({}, DEFAULT_VISIBILITY);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)){
      const iso = toISO(d); const monthKey = iso.slice(0,7);
      if (!state.months[monthKey]) { state.months[monthKey] = []; state.monthOrder.push(monthKey); }
      state.months[monthKey].push({ data: formatDateBR(iso), dia: WEEKDAYS[d.getDay()] });
    }
    state.activeMonth = state.monthOrder[0] || '';
    syncRawFromLegacyMonths();
    recalcCalcCache();
    reconcilePaidByMonth();
    save(); renderAll();
  }

  function exportTemplateCsv(){
    if (!state.monthOrder.length){ alert('Gere o período antes de exportar o CSV-modelo.'); return; }
    syncIdentificacao();
    const types = DEFAULT_TEMPLATE.map(c=>c[0]); const names = DEFAULT_TEMPLATE.map(c=>c[1]); const guides = DEFAULT_TEMPLATE.map(c=>c[2]);
    const lines = [types, names, guides];
    const guideNotes = [
      'GUIA: tipos aceitos -> data, dia, entrada, saída, ocorrência, observação, apuração e texto.',
      'GUIA: linha 1 = tipo técnico | linha 2 = nome visível | linha 3 = orientação da coluna.',
      'GUIA: a partir da linha seguinte, preencha os dados diários (Data e Dia já vêm prontos).',
      'GUIA: horários em hhmm (0800 -> 08:00 após importação na interface).',
      'GUIA: colunas de apuração podem receber fórmula/editável; a coluna Carga deve ficar livre para ajuste.'
    ];
    guideNotes.forEach((note)=>{
      const row = names.map(()=> '');
      row[0] = note;
      lines.push(row);
    });
    state.monthOrder.forEach(k=> state.months[k].forEach(r=>{
      const row = names.map(()=> '');
      row[0] = r.data; row[1] = r.dia;
      lines.push(row);
    }));
    const csv = lines.map(arr=>arr.map(csvEsc).join(';')).join('\r\n');
    downloadFile('modelo_apuracao_ponto.csv', '\ufeff'+csv, 'text/csv;charset=utf-8;');
  }

  async function importCsv(ev){
    const file = ev.target.files && ev.target.files[0]; if (!file) return;
    const text = await file.text(); ev.target.value = '';
    const rows = parseCsv(text.replace(/^\ufeff/,''));
    if (rows.length < 4){ alert('CSV inválido: mínimo de 4 linhas (tipo, nome, orientação e dados).'); return; }
    const types = rows[0]; const names = rows[1]; const guides = rows[2];
    const maxCols = Math.max(types.length, names.length, guides.length);
    const cols = [];
    for (let i=0;i<maxCols;i++){
      const type = normalizeType(types[i]);
      cols.push({ id:'c'+i, type:ALLOWED_TYPES.has(type)?type:'texto', name:(names[i]||('Coluna '+(i+1))).trim(), guide:(guides[i]||'').trim() });
    }
    const dataIdx = cols.findIndex(c=>c.type==='data');
    const dayIdx = cols.findIndex(c=>c.type==='dia');
    if (dataIdx < 0 || dayIdx < 0){ alert('CSV precisa conter pelo menos uma coluna tipo data e uma tipo dia.'); return; }
    const months = {}, order = [];
    rows.slice(3).forEach(raw=>{
      if (!raw.length || raw.every(c=>!String(c||'').trim())) return;
      const obj = {}; cols.forEach((c,idx)=>{ obj[c.id] = String(raw[idx] || '').trim(); });
      const iso = parseDateFlexible(obj[cols[dataIdx].id]);
      if (!iso) return;
      obj[cols[dataIdx].id] = formatDateBR(iso);
      const mk = iso.slice(0,7); if (!months[mk]){ months[mk]=[]; order.push(mk); }
      months[mk].push(obj);
    });
    state.columns = cols; state.months = months; state.monthOrder = order.sort(); state.activeMonth = state.monthOrder[0] || ''; state.imported = true;
    syncRawFromLegacyMonths();
    recalcCalcCache();
    recalcPrefixes(); reconcilePaidByMonth(); save(); renderAll();
  }

  function recalcPrefixes(){
    const apCols = state.columns.filter(c=>c.type==='apuracao');
    const prefixes = {}; apCols.forEach((c,idx)=>{ prefixes[c.id] = `${String.fromCharCode(65+(idx%26))}.${String(Math.floor(idx/26)+1).padStart(2,'0')}`; });
    state.prefixes = prefixes;
  }

  function renderAll(){ renderTimeline(); renderEditor(); renderMonthlySummary(); renderReport(); }

  function renderTimeline(){
    const host = $('timeline');
    if (!state.monthOrder.length){ host.innerHTML = '<span class="hint">Sem competências geradas.</span>'; return; }
    host.innerHTML = state.monthOrder.map(m=>`<button type="button" data-month="${m}" class="${m===state.activeMonth?'active':''}">${monthLabel(m)}</button>`).join('');
    host.querySelectorAll('button').forEach(btn=>btn.addEventListener('click', ()=>{ state.activeMonth = btn.dataset.month; save(); renderEditor(); renderTimeline(); }));
  }

  function renderEditor(){
    const host = $('editorHost');
    host.classList.remove('is-wide');
    if (!state.activeMonth || !state.months[state.activeMonth]){ host.innerHTML = '<div style="padding:14px;color:#667085">Nenhum período disponível.</div>'; return; }
    const rows = state.months[state.activeMonth];
    const cols = state.imported ? state.columns : state.columns.filter(c=>c.type==='data'||c.type==='dia');
    const grouped = groupCols(cols);
    const activeGroups = {
      horarios: state.visibility.horarios ? grouped.horarios : [],
      textos: state.visibility.textos ? grouped.textos : [],
      apuracoes: state.visibility.apuracoes ? grouped.apuracoes : []
    };
    const dynamicCols = activeGroups.horarios.concat(activeGroups.textos).concat(activeGroups.apuracoes);
    const usefulColsCount = grouped.horarios.length + grouped.textos.length + grouped.apuracoes.length;
    const isWide = usefulColsCount > WIDE_EDITOR_THRESHOLD;
    host.classList.toggle('is-wide', isWide);
    const head1 = `<tr><th class="sticky-col sticky-data" rowspan="2">Data</th><th class="sticky-col sticky-dia" rowspan="2">Dia</th>${activeGroups.horarios.length?`<th colspan="${activeGroups.horarios.length}">Horários Registrados</th>`:''}${activeGroups.textos.length?`<th colspan="${activeGroups.textos.length}">Ocorrências / Observações</th>`:''}${activeGroups.apuracoes.length?`<th colspan="${activeGroups.apuracoes.length}">Horas Apuradas</th>`:''}</tr>`;
    const head2 = `<tr>${dynamicCols.map(c=>`<th>${esc(c.name)}</th>`).join('')}</tr>`;
    const fixedCols = getFixedCols(cols);
    host.innerHTML = `${renderVisibilityBar(grouped)}<table class="editor-table${isWide?' is-wide':''}"><colgroup>${buildEditorColgroup(dynamicCols)}</colgroup><thead>${head1}${head2}</thead><tbody>${rows.map((r,ri)=>rowHtml(r,fixedCols,dynamicCols,ri)).join('')}</tbody></table>`;
    host.querySelectorAll('.editor-visibility-toggle').forEach((input)=>{
      input.addEventListener('change', (e)=>{
        const key = e.target.dataset.group;
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_VISIBILITY, key)) return;
        state.visibility[key] = !!e.target.checked;
        save();
        renderEditor();
      });
    });
    host.querySelectorAll('input[data-col]').forEach(input=>{
      input.addEventListener('input', (e)=>{
        const month = e.target.dataset.month, col = e.target.dataset.col, idx = Number(e.target.dataset.row);
        if (!state.months[month] || !state.months[month][idx]) return;
        let v = e.target.value;
        const colType = (state.columns.find(c=>c.id===col)||{}).type;
        if (colType==='entrada' || colType==='saida'){ v = CPPontoCalcUtils.maskTime(v); e.target.value = v; }
        if (colType==='apuracao'){ e.target.value = state.months[month][idx][col] || ''; return; }
        state.months[month][idx][col] = v;
        syncRawFromLegacyMonths();
        recalcCalcCache();
        save(); renderMonthlySummary(); renderReport();
      });
    });
  }

  function rowHtml(row, fixedCols, cols, rowIndex){
    return '<tr>' + fixedCols.concat(cols).map(c=>{
      const ro = c.type==='data' || c.type==='dia' || c.type==='apuracao';
      let val = row[c.id] || '';
      if ((c.type==='entrada'||c.type==='saida') && val) val = CPPontoCalcUtils.maskTime(val);
      const stickyClass = c.type==='data' ? ' class="sticky-col sticky-data"' : (c.type==='dia' ? ' class="sticky-col sticky-dia"' : '');
      const inputClass = ro ? 'readonly' : ((c.type==='entrada'||c.type==='saida') ? 'input-time' : '');
      return `<td${stickyClass}>${ro?`<input class="readonly" readonly value="${esc(val)}">`:`<input class="${inputClass}" data-month="${state.activeMonth}" data-row="${rowIndex}" data-col="${c.id}" value="${esc(val)}">`}</td>`;
    }).join('') + '</tr>';
  }

  function renderVisibilityBar(grouped){
    const groups = [
      { key:'horarios', label:'Horários', count:grouped.horarios.length },
      { key:'textos', label:'Ocorrências', count:grouped.textos.length },
      { key:'apuracoes', label:'Apurações', count:grouped.apuracoes.length }
    ];
    return `<div class="editor-actions">${groups.map((g)=>{
      const checked = state.visibility[g.key] ? 'checked' : '';
      const disabled = g.count ? '' : 'disabled';
      return `<label><input class="editor-visibility-toggle" type="checkbox" data-group="${g.key}" ${checked} ${disabled}> ${g.label} <span class="hint">(${g.count})</span></label>`;
    }).join('')}</div>`;
  }

  function buildEditorColgroup(cols){
    const staticCols = '<col class="col-data"><col class="col-dia">';
    const dynamic = cols.map((c)=>{
      if (c.type==='entrada' || c.type==='saida') return '<col class="col-time">';
      if (c.type==='ocorrencia' || c.type==='observacao' || c.type==='texto') return '<col class="col-text">';
      if (c.type==='apuracao') return '<col class="col-apuracao">';
      return '<col class="col-default">';
    }).join('');
    return staticCols + dynamic;
  }

  function getFixedCols(cols){
    const dataCol = cols.find((c)=>c.type==='data') || { id:'data', type:'data' };
    const dayCol = cols.find((c)=>c.type==='dia') || { id:'dia', type:'dia' };
    return [dataCol, dayCol];
  }

  function renderMonthlySummary(){
    const host = $('monthlySummary');
    if (!state.monthOrder.length){ host.innerHTML = '<div style="padding:12px;color:#667085">Sem competências para resumir.</div>'; return; }
    const head = `<tr><th>Competência</th>${RUBRICAS.map((r)=>`<th>${esc(r)}</th>`).join('')}</tr>`;
    const body = state.monthOrder.map((m)=>{
      const resultado = (state.calc && state.calc.meses && state.calc.meses[m]) || calcularCompetenciaEngine(m);
      return `<tr><td>${monthLabel(m)}</td>${RUBRICAS.map((r)=>`<td>${esc(CPPontoCalcUtils.formatMinutes(resultado.rubricas[r] || 0))}</td>`).join('')}</tr>`;
    }).join('');
    host.innerHTML = `<table class="editor-table"><thead>${head}</thead><tbody>${body}</tbody></table>`;
  }

function buildReportMeta(){
    return `<b>Autor:</b> ${esc(fields.autor.value || '—')} · <b>Réu:</b> ${esc(fields.reu.value || '—')} · <b>Processo:</b> ${esc(fields.processo.value || '—')}<br><b>Vara:</b> ${esc(fields.vara.value || '—')} · <b>Município:</b> ${esc(fields.municipio.value || '—')} · <b>Período:</b> ${esc(fields.periodoInicial.value||'—')} a ${esc(fields.periodoFinal.value||'—')}`;
  }

  function getReportBranding(){
    return {
      header: { nome:REPORT_HEADER.nome, tel:REPORT_HEADER.tel, email:REPORT_HEADER.email },
      footer: { l1:REPORT_FOOTER.l1, l2:REPORT_FOOTER.l2, site:REPORT_FOOTER.site, emp:REPORT_FOOTER.emp }
    };
  }

  function buildReportLayout(){
    if (!window.CPPrintLayout || !CPPrintLayout.createLayout) return null;
    const root = $('reportRoot');
    return CPPrintLayout.createLayout({
      root,
      title: 'Relatório Analítico de Apuração de Ponto',
      meta: buildReportMeta(),
      branding: getReportBranding(),
      contextName: PRINT_CONTEXT,
      documentTitle: PRINT_TITLE
    });
  }

  function fillReportLayout(layout){
    const cols = state.columns;
    const grouped = groupCols(cols);
    state.monthOrder.forEach((m, index)=>{
      if (index > 0) CPPrintLayout.createPage(layout, { includeTitle:false });
      const rows = state.months[m] || [];
      const legendItems = cols
        .filter(c=>c.type==='apuracao')
        .map(c=>`<div><b>${state.prefixes[c.id] || c.name}</b> – ${esc(c.name)}</div>`)
        .join('') || '<div>Sem colunas de apuração.</div>';
      CPPrintLayout.appendSection(layout, {
        title: `Relatório Analítico de Apuração de Ponto — ${monthLabel(m)}`,
        html: `<div class="legend"><div><b>Legenda técnica das apurações</b></div><div class="legend-grid">${legendItems}</div></div><div class="legend"><div><b>Critérios Utilizados</b></div><div>${buildCriteriosUtilizadosHtml()}</div></div>`
      });
      CPPrintLayout.appendTable(layout, {
        columns: reportTableColumns(grouped),
        rows: reportTableRows(rows, cols, grouped),
        tableClass: 'report-table',
        continuationLabel: `Relatório Analítico de Apuração de Ponto — ${monthLabel(m)} (continuação)`
      });
    });
  }

  function renderReport(){
    const root = $('reportRoot');
    if (!state.monthOrder.length){ root.innerHTML = ''; return; }
    if (!window.CPPrintLayout || typeof window.CPPrintLayout.createLayout !== 'function') {
      root.innerHTML = '<div style="padding:14px;color:#667085">Não foi possível carregar o mecanismo de paginação de impressão.</div>';
      return;
    }

    const cols = state.columns;
    const grouped = groupCols(cols);
    const legendItems = cols
      .filter(c=>c.type==='apuracao')
      .map(c=>`<div><b>${state.prefixes[c.id] || c.name}</b> – ${esc(c.name)}</div>`)
      .join('') || '<div>Sem colunas de apuração.</div>';

    const layout = window.CPPrintLayout.createLayout({
      root,
      contextName: 'apuracao-ponto-print',
      documentTitle: 'Relatório de Apuração de Ponto',
      branding: { logo: 'https://calculopro.com.br/wp-content/uploads/2024/11/logonegativa.png', header: REPORT_HEADER, footer: REPORT_FOOTER },
      includeTitleOnFirstPage: false,
      spacing: { safetyBottom: 10 }
    });

    const tableCols = [
      'Data',
      'Sem.',
      'Feriado',
      'Justificativa',
      ...grouped.horarios.map(c=>esc(c.name)),
      ...grouped.textos.map(c=>esc(c.name)),
      ...RUBRICAS.map((r)=>esc(r))
    ];

    state.monthOrder.forEach((m)=>{
      const rows = state.months[m] || [];
      const rowHtml = rows.map(r=>{
        const diaCalc = calcularDiaEngine(cols,r);
        const infoFeriado = getHolidayInfo(findValueByType(cols,r,'data'));
        const justificativa = infoFeriado.feriado ? 'HE 100% e sem atraso/falta por feriado.' : '';
        const values = [
          findValueByType(cols,r,'data'),
          findValueByType(cols,r,'dia'),
          infoFeriado.feriado ? infoFeriado.nome : '—',
          justificativa,
          ...grouped.horarios.map(c=>formatCell(c,r[c.id]||'')),
          ...grouped.textos.map(c=>formatCell(c,r[c.id]||'')),
          ...RUBRICAS.map((rubrica)=>CPPontoCalcUtils.formatMinutes(diaCalc.rubricas[rubrica] || 0))
        ];
        return `<tr>${values.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`;
      });

      window.CPPrintLayout.appendSection(layout, {
        html: `<h2 class="report-title">Relatório Analítico de Apuração de Ponto — ${monthLabel(m)}</h2>
          <div class="report-meta"><b>Autor:</b> ${esc(fields.autor.value || '—')} · <b>Réu:</b> ${esc(fields.reu.value || '—')} · <b>Processo:</b> ${esc(fields.processo.value || '—')}<br><b>Vara:</b> ${esc(fields.vara.value || '—')} · <b>Município:</b> ${esc(fields.municipio.value || '—')} · <b>Período:</b> ${esc(fields.periodoInicial.value||'—')} a ${esc(fields.periodoFinal.value||'—')}</div>
          <div class="legend"><div><b>Legenda técnica das apurações</b></div><div class="legend-grid">${legendItems}</div></div><div class="legend"><div><b>Critérios Utilizados</b></div><div>${buildCriteriosUtilizadosHtml()}</div></div>`
      });

      window.CPPrintLayout.appendTable(layout, {
        title: `Competência ${monthLabel(m)}`,
        continuationLabel: `Competência ${monthLabel(m)} (continuação)`,
        columns: tableCols,
        rows: rowHtml,
        tableClass: 'report-table point-report-table'
      });

      window.CPPrintLayout.appendSection(layout, { html: '<div style="height:2mm"></div>' });
    });

    const pages = Array.from(root.querySelectorAll('.page'));
    pages.forEach((page, index)=>{
      const right = page.querySelector('.footer div:last-child');
      if (!right) return;
      right.innerHTML = `<div>${esc(REPORT_FOOTER.emp)}</div><div>Página ${index + 1} de ${pages.length}</div>`;
    });
  }

  function findValueByType(cols, row, type){ const c = cols.find(x=>x.type===type); return c ? (row[c.id]||'') : ''; }
  function formatCell(col,val){ return (col.type==='entrada'||col.type==='saida') ? CPPontoCalcUtils.maskTime(val) : val; }

  function groupCols(cols){
    const horarios = cols.filter(c=>c.type==='entrada'||c.type==='saida');
    const textos = cols.filter(c=>['ocorrencia','observacao','texto'].includes(c.type));
    const apuracoes = cols.filter(c=>c.type==='apuracao');
    return { horarios, textos, apuracoes };
  }

  function sumApuracaoMinutes(rows,colId){
    let minutes = 0;
    rows.forEach(r=>{ minutes += CPPontoCalcUtils.parseDurationToMinutes(r[colId]); });
    return minutes;
  }

  function normalizePaidDuration(value){
    const raw = String(value || '').trim();
    if (!raw) return '';
    const masked = CPPontoCalcUtils.maskTime(raw);
    const hm = masked.match(/^(\d{1,2}):(\d{2})$/);
    if (!hm) return null;
    const hh = Number(hm[1]), mm = Number(hm[2]);
    if (mm > 59) return null;
    return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  }

  function getPaidValue(monthKey, colId){
    if (!state.paidByMonth[monthKey]) state.paidByMonth[monthKey] = {};
    return state.paidByMonth[monthKey][colId] || '';
  }

  function setPaidValue(monthKey, colId, value){
    if (!state.paidByMonth[monthKey]) state.paidByMonth[monthKey] = {};
    if (!value){ delete state.paidByMonth[monthKey][colId]; return; }
    state.paidByMonth[monthKey][colId] = value;
  }

  function reconcilePaidByMonth(){
    state.paidByMonth = (state.paidByMonth && typeof state.paidByMonth === 'object') ? state.paidByMonth : {};
    const validMonths = new Set(state.monthOrder || []);
    Object.keys(state.paidByMonth).forEach((monthKey)=>{
      if (!validMonths.has(monthKey)) { delete state.paidByMonth[monthKey]; return; }
      const row = state.paidByMonth[monthKey];
      if (!row || typeof row !== 'object'){ state.paidByMonth[monthKey] = {}; return; }
      const validColIds = new Set(state.columns.filter(c=>c.type==='apuracao').map(c=>c.id));
      Object.keys(row).forEach((colId)=>{
        if (!validColIds.has(colId)){ delete row[colId]; return; }
        const normalized = normalizePaidDuration(row[colId]);
        if (normalized === null) delete row[colId];
        else row[colId] = normalized;
      });
    });
  }

  function toRegistroPontoDia(cols, row){
    const dataISO = parseDateFlexible(findValueByType(cols,row,'data')) || '';
    const marcacoes = cols.filter((c)=>c.type==='entrada'||c.type==='saida').map((c)=>CPPontoCalcUtils.maskTime(row[c.id] || ''));
    const ocorrencias = cols.filter((c)=>c.type==='ocorrencia').map((c)=>String(row[c.id] || '').trim()).filter(Boolean);
    const observacao = cols.filter((c)=>c.type==='observacao'||c.type==='texto').map((c)=>String(row[c.id] || '').trim()).filter(Boolean).join(' | ');
    return { dataISO, diaSemana: findValueByType(cols,row,'dia'), marcacoes, ocorrencias, observacao, metadados:{ origem:'csv-v1-adapter' } };
  }

  function syncRawFromLegacyMonths(){
    const rawMonths = {};
    (state.monthOrder || []).forEach((monthKey)=>{
      const rows = state.months[monthKey] || [];
      rawMonths[monthKey] = rows.map((row)=>toRegistroPontoDia(state.columns, row));
    });
    state.raw = Object.assign({}, state.raw || {}, { months: rawMonths });
  }

  function calcularDiaEngineFromRegistro(registro){
    const dia = { data: registro.dataISO || '', diaSemana: registro.diaSemana || '', entradasSaidas: Array.isArray(registro.marcacoes) ? registro.marcacoes : [], ocorrencias: Array.isArray(registro.ocorrencias) ? registro.ocorrencias : [], flags:{} };
    return window.CPPontoCalcEngine.calcularDia(dia, state.configApuracao || {}, { isFeriado:(iso)=> isHoliday(iso) });
  }
  function calcularDiaEngine(cols, row){ return calcularDiaEngineFromRegistro(toRegistroPontoDia(cols, row)); }

  function calcularCompetenciaEngine(monthKey){
    const diasRaw = (state.raw && state.raw.months && state.raw.months[monthKey]) || [];
    const registros = diasRaw.map((registro)=>calcularDiaEngineFromRegistro(registro).entradaNormalizada);
    return window.CPPontoCalcEngine.calcularMes(registros, state.configApuracao || {}, { isFeriado:(iso)=> isHoliday(iso) });
  }

  function recalcCalcCache(){
    const diasPorMes = {};
    const meses = {};
    (state.monthOrder || []).forEach((monthKey)=>{
      const diasRaw = (state.raw && state.raw.months && state.raw.months[monthKey]) || [];
      diasPorMes[monthKey] = diasRaw.map((registro)=>calcularDiaEngineFromRegistro(registro));
      const entradas = diasPorMes[monthKey].map((d)=>d.entradaNormalizada);
      meses[monthKey] = window.CPPontoCalcEngine.calcularMes(entradas, state.configApuracao || {}, { isFeriado:(iso)=> isHoliday(iso) });
    });
    state.calc = { diasPorMes, meses };
  }

  function buildCriteriosUtilizadosHtml(){ const c=Object.assign({},DEFAULT_CONFIG_APURACAO,state.configApuracao||{}); return [`Jornada diária: ${CPPontoCalcUtils.formatMinutes(c.jornadaDiariaMin)} | semanal: ${CPPontoCalcUtils.formatMinutes(c.jornadaSemanalMin)}`,`Escala: ${esc(c.escala)}${c.escala==='personalizada'?` (${esc(c.escalaPersonalizada||'—')})`:''}`,`Tolerância marcação: ${c.toleranciaMarcacaoMin} min`,`Noturno: ${esc(c.janelaNoturnaInicio)} às ${esc(c.janelaNoturnaFim)} | hora reduzida: ${(60/(c.reducaoNoturnaFator||1)).toFixed(2)} min`,`HE: ${c.heDiasUteisPercentual}% / ${c.heDomingosFeriadosPercentual}%`,`Banco de horas: ${c.bancoHorasAtivo?`ativo (limite ${CPPontoCalcUtils.formatMinutes(c.bancoHorasLimiteMin||0)})`:'inativo'}`,`DSR sobre HE: ${c.dsrSobreHe?'sim':'não'} | DSR considera feriados: ${c.dsrConsideraFeriados?'sim':'não'}`].map((t)=>`<div>${t}</div>`).join(''); }

function getHolidayInfo(dateValue){
    const iso = parseDateFlexible(dateValue) || dateValue;
    if (!window.CPPontoFeriados || typeof window.CPPontoFeriados.isFeriado !== 'function') return { feriado:false, nome:'' };
    return window.CPPontoFeriados.isFeriado(iso, { municipio:state.identificacao?.municipio || '', feriadosLocais:state.feriadosLocais || [], feriadosManuais:state.feriadosManuais || [] });
  }

  function isHoliday(iso){
    return !!getHolidayInfo(iso).feriado;
  }

function monthLabel(key){ const [y,m] = key.split('-').map(Number); return `${MONTHS[(m||1)-1]}/${y}`; }
    function parseISO(v){ if(!v) return null; const d = new Date(v+'T00:00:00'); return Number.isNaN(d.getTime())?null:d; }
  function toISO(d){ const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
  function formatDateBR(iso){ const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; }
  function parseDateFlexible(v){
    const s=String(v||'').trim();
    let m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if(m) return `${m[3]}-${m[2]}-${m[1]}`;
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(m) return `${m[1]}-${m[2]}-${m[3]}`;
    return null;
  }
  function normalizeType(v){ return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function csvEsc(v){ const s=String(v??''); return /[";\n\r]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; }
  function parseCsv(text){
    const rows=[]; let row=[]; let cell=''; let q=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i], nx=text[i+1];
      if (q){ if (ch==='"' && nx==='"'){ cell+='"'; i++; } else if (ch==='"'){ q=false; } else cell+=ch; continue; }
      if (ch==='"'){ q=true; continue; }
      if (ch===';' || ch===','){ row.push(cell); cell=''; continue; }
      if (ch==='\n'){ row.push(cell); rows.push(row); row=[]; cell=''; continue; }
      if (ch==='\r') continue;
      cell += ch;
    }
    row.push(cell); if (row.length>1 || row[0] !== '') rows.push(row);
    return rows;
  }

  function exportJson(){ syncIdentificacao(); downloadFile('apuracao_ponto.json', JSON.stringify(state,null,2), 'application/json;charset=utf-8;'); }
  async function importJson(ev){
    const file = ev.target.files && ev.target.files[0]; if (!file) return;
    try { state = JSON.parse(await file.text()); }
    catch(_){ alert('JSON inválido.'); }
    ev.target.value='';
    if (!state || typeof state !== 'object') return;
    state.identificacao = state.identificacao || {}; state.columns = state.columns || []; state.monthOrder = state.monthOrder || []; state.months = state.months || {};
    state.visibility = Object.assign({}, DEFAULT_VISIBILITY, state.visibility || {});
    ensureStateV2(state);
    hydrateIdentificacao(); hydrateConfigApuracao(); recalcPrefixes(); recalcCalcCache(); save(); renderAll();
  }

  function esc(v){ return String(v||'').replace(/[&<>\"]/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
  function downloadFile(name, content, type){ const b = new Blob([content], { type }); const u = URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(u),1000); }
  function ensureStateV2(target){
    target.storageVersion = 2;
    target.identificacao = target.identificacao || {};
    target.columns = Array.isArray(target.columns) ? target.columns : [];
    target.monthOrder = Array.isArray(target.monthOrder) ? target.monthOrder : [];
    target.months = target.months || {};
    target.visibility = Object.assign({}, DEFAULT_VISIBILITY, target.visibility || {});
    target.feriadosLocais = Array.isArray(target.feriadosLocais) ? target.feriadosLocais : [];
    target.feriadosManuais = Array.isArray(target.feriadosManuais) ? target.feriadosManuais : [];
    if (!target.raw || !target.raw.months) syncRawFromLegacyMonths();
    else target.raw.months = target.raw.months || {};
    target.calc = target.calc || { diasPorMes:{}, meses:{} };
  }

  function migrateV1ToV2(v1Data){
    const migrated = Object.assign({}, state, v1Data || {});
    state = migrated;
    ensureStateV2(state);
    syncRawFromLegacyMonths();
    recalcPrefixes();
    recalcCalcCache();
    return state;
  }

  function save(){ try { localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state)); } catch(_){} }
  function load(){
    try {
      const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
      if (rawV2) {
        state = Object.assign(state, JSON.parse(rawV2));
      } else {
        const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
        if (rawV1) migrateV1ToV2(JSON.parse(rawV1));
      }
    } catch(_){}
    ensureStateV2(state);
    reconcilePaidByMonth();
    hydrateIdentificacao(); hydrateConfigApuracao(); recalcPrefixes(); recalcCalcCache();
  }

  init();
})();
