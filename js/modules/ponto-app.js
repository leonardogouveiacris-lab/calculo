(function(){
  const STORAGE_KEY = 'cp_apuracao_ponto_v1';
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

  let state = {
    identificacao:{}, columns:[], monthOrder:[], months:{}, activeMonth:'', imported:false, prefixes:{}, feriados:window.CPPontoFeriados || [],
    summaryOptions:{ apurarDiferencas:false }, paidByMonth:{}
  };

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
  }

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
    state.months = {}; state.monthOrder = []; state.imported = false; state.prefixes = {}; state.paidByMonth = {};
    for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)){
      const iso = toISO(d); const monthKey = iso.slice(0,7);
      if (!state.months[monthKey]) { state.months[monthKey] = []; state.monthOrder.push(monthKey); }
      state.months[monthKey].push({ data: formatDateBR(iso), dia: WEEKDAYS[d.getDay()] });
    }
    state.activeMonth = state.monthOrder[0] || '';
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
    if (!state.activeMonth || !state.months[state.activeMonth]){ host.innerHTML = '<div style="padding:14px;color:#667085">Nenhum período disponível.</div>'; return; }
    const rows = state.months[state.activeMonth];
    const cols = state.imported ? state.columns : state.columns.filter(c=>c.type==='data'||c.type==='dia');
    const grouped = groupCols(cols);
    const head1 = `<tr><th rowspan="2">Data</th><th rowspan="2">Dia</th>${grouped.horarios.length?`<th colspan="${grouped.horarios.length}">Horários Registrados</th>`:''}${grouped.textos.length?`<th colspan="${grouped.textos.length}">Ocorrências / Observações</th>`:''}${grouped.apuracoes.length?`<th colspan="${grouped.apuracoes.length}">Horas Apuradas</th>`:''}</tr>`;
    const head2 = `<tr>${grouped.horarios.concat(grouped.textos).concat(grouped.apuracoes).map(c=>`<th>${esc(c.name)}</th>`).join('')}</tr>`;
    host.innerHTML = `<table class="editor-table"><thead>${head1}${head2}</thead><tbody>${rows.map((r,ri)=>rowHtml(r,cols,ri)).join('')}</tbody></table>`;
    host.querySelectorAll('input[data-col]').forEach(input=>{
      input.addEventListener('input', (e)=>{
        const month = e.target.dataset.month, col = e.target.dataset.col, idx = Number(e.target.dataset.row);
        if (!state.months[month] || !state.months[month][idx]) return;
        let v = e.target.value;
        const colType = (state.columns.find(c=>c.id===col)||{}).type;
        if (colType==='entrada' || colType==='saida'){ v = maskTime(v); e.target.value = v; }
        state.months[month][idx][col] = v;
        save(); renderMonthlySummary(); renderReport();
      });
    });
  }

  function rowHtml(row, cols, rowIndex){
    return '<tr>' + cols.map(c=>{
      const ro = c.type==='data' || c.type==='dia';
      let val = row[c.id] || '';
      if ((c.type==='entrada'||c.type==='saida') && val) val = maskTime(val);
      return `<td>${ro?`<input class="readonly" readonly value="${esc(val)}">`:`<input data-month="${state.activeMonth}" data-row="${rowIndex}" data-col="${c.id}" value="${esc(val)}">`}</td>`;
    }).join('') + '</tr>';
  }

  function renderMonthlySummary(){
    const host = $('monthlySummary');
    const diffEnabled = !!(state.summaryOptions && state.summaryOptions.apurarDiferencas);
    const apCols = state.columns.filter(c=>c.type==='apuracao');
    if (!apCols.length || !state.monthOrder.length){ host.innerHTML = '<div style="padding:12px;color:#667085">Sem colunas de apuração disponíveis para resumo.</div>'; return; }
    if (!diffEnabled){
      const head = `<tr><th>Competência</th>${apCols.map(c=>`<th>${esc(state.prefixes[c.id] || c.name)}</th>`).join('')}</tr>`;
      const body = state.monthOrder.map(m=>{
        const sums = apCols.map(c=>formatMinutes(sumApuracaoMinutes(state.months[m], c.id)));
        return `<tr><td>${monthLabel(m)}</td>${sums.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`;
      }).join('');
      host.innerHTML = `<table class="editor-table"><thead>${head}</thead><tbody>${body}</tbody></table>`;
      return;
    }
    const head1 = `<tr><th rowspan="2">Competência</th>${apCols.map(c=>`<th colspan="3">${esc(state.prefixes[c.id] || c.name)}</th>`).join('')}</tr>`;
    const head2 = `<tr>${apCols.map(()=>'<th>Apurado</th><th>Pago</th><th>Diferença</th>').join('')}</tr>`;
    const body = state.monthOrder.map(m=>{
      const colsHtml = apCols.map(c=>{
        const apuradoMin = sumApuracaoMinutes(state.months[m], c.id);
        const paidVal = getPaidValue(m, c.id);
        const paidMin = parseDurationToMinutes(paidVal);
        const diffMin = apuradoMin - paidMin;
        return `<td>${esc(formatMinutes(apuradoMin))}</td>
          <td><input data-paid="1" data-month="${m}" data-col="${c.id}" value="${esc(paidVal)}" placeholder="00:00" inputmode="numeric"></td>
          <td>${esc(formatMinutes(diffMin))}</td>`;
      }).join('');
      return `<tr><td>${monthLabel(m)}</td>${colsHtml}</tr>`;
    }).join('');
    host.innerHTML = `<table class="editor-table"><thead>${head1}${head2}</thead><tbody>${body}</tbody></table>`;
    host.querySelectorAll('input[data-paid]').forEach((input)=>{
      input.addEventListener('input', (e)=>{
        e.target.value = maskTime(e.target.value);
        if (e.target.classList.contains('invalid')) e.target.classList.remove('invalid');
      });
      input.addEventListener('change', (e)=>{
        const monthKey = e.target.dataset.month;
        const colId = e.target.dataset.col;
        const normalized = normalizePaidDuration(e.target.value);
        if (normalized === null){
          e.target.classList.add('invalid');
          e.target.title = 'Informe hora válida em hh:mm (minutos entre 00 e 59).';
          return;
        }
        e.target.classList.remove('invalid');
        e.target.title = '';
        setPaidValue(monthKey, colId, normalized);
        e.target.value = normalized;
        save();
        renderMonthlySummary();
      });
    });
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
        html: `<div class="legend"><div><b>Legenda técnica das apurações</b></div><div class="legend-grid">${legendItems}</div></div>`
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
      ...grouped.horarios.map(c=>esc(c.name)),
      ...grouped.textos.map(c=>esc(c.name)),
      ...grouped.apuracoes.map(c=>esc(state.prefixes[c.id] || c.name))
    ];

    state.monthOrder.forEach((m)=>{
      const rows = state.months[m] || [];
      const rowHtml = rows.map(r=>{
        const values = [
          findValueByType(cols,r,'data'),
          findValueByType(cols,r,'dia'),
          ...grouped.horarios.map(c=>formatCell(c,r[c.id]||'')),
          ...grouped.textos.map(c=>formatCell(c,r[c.id]||'')),
          ...grouped.apuracoes.map(c=>formatCell(c,r[c.id]||''))
        ];
        return `<tr>${values.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`;
      });

      window.CPPrintLayout.appendSection(layout, {
        html: `<h2 class="report-title">Relatório Analítico de Apuração de Ponto — ${monthLabel(m)}</h2>
          <div class="report-meta"><b>Autor:</b> ${esc(fields.autor.value || '—')} · <b>Réu:</b> ${esc(fields.reu.value || '—')} · <b>Processo:</b> ${esc(fields.processo.value || '—')}<br><b>Vara:</b> ${esc(fields.vara.value || '—')} · <b>Município:</b> ${esc(fields.municipio.value || '—')} · <b>Período:</b> ${esc(fields.periodoInicial.value||'—')} a ${esc(fields.periodoFinal.value||'—')}</div>
          <div class="legend"><div><b>Legenda técnica das apurações</b></div><div class="legend-grid">${legendItems}</div></div>`
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
  function formatCell(col,val){ return (col.type==='entrada'||col.type==='saida') ? maskTime(val) : val; }

  function groupCols(cols){
    const horarios = cols.filter(c=>c.type==='entrada'||c.type==='saida');
    const textos = cols.filter(c=>['ocorrencia','observacao','texto'].includes(c.type));
    const apuracoes = cols.filter(c=>c.type==='apuracao');
    return { horarios, textos, apuracoes };
  }

  function sumApuracaoMinutes(rows,colId){
    let minutes = 0;
    rows.forEach(r=>{ minutes += parseDurationToMinutes(r[colId]); });
    return minutes;
  }

  function parseDurationToMinutes(value){
    const v = String(value || '').trim(); if (!v) return 0;
    const hm = v.match(/^(\d{1,2}):(\d{2})$/); if (hm) return Number(hm[1])*60 + Number(hm[2]);
    const only = v.replace(/\D/g,''); if (only.length===4) return Number(only.slice(0,2))*60 + Number(only.slice(2));
    const num = Number(v.replace(/\./g,'').replace(',','.')); if (!Number.isFinite(num)) return 0;
    return Math.round(num*60);
  }

  function formatMinutes(total){
    const sign = total < 0 ? '-' : ''; const abs = Math.abs(total); const h = Math.floor(abs/60); const m = abs%60;
    return `${sign}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  function normalizePaidDuration(value){
    const raw = String(value || '').trim();
    if (!raw) return '';
    const masked = maskTime(raw);
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

  function monthLabel(key){ const [y,m] = key.split('-').map(Number); return `${MONTHS[(m||1)-1]}/${y}`; }
  function maskTime(v){ const d=String(v||'').replace(/\D/g,'').slice(0,4); if (d.length<=2) return d; return d.slice(0,2)+':'+d.slice(2); }
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
    state.summaryOptions = Object.assign({ apurarDiferencas:false }, state.summaryOptions || {});
    state.paidByMonth = state.paidByMonth || {};
    recalcPrefixes();
    reconcilePaidByMonth();
    if ($('toggleDifferences')) $('toggleDifferences').checked = !!state.summaryOptions.apurarDiferencas;
    hydrateIdentificacao(); save(); renderAll();
  }

  function esc(v){ return String(v||'').replace(/[&<>\"]/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
  function downloadFile(name, content, type){ const b = new Blob([content], { type }); const u = URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(u),1000); }
  function save(){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(_){} }
  function load(){
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) state = Object.assign(state, JSON.parse(raw)); } catch(_){}
    state.summaryOptions = Object.assign({ apurarDiferencas:false }, state.summaryOptions || {});
    state.paidByMonth = state.paidByMonth || {};
    hydrateIdentificacao();
    recalcPrefixes();
    reconcilePaidByMonth();
    if ($('toggleDifferences')) $('toggleDifferences').checked = !!state.summaryOptions.apurarDiferencas;
  }

  init();
})();
