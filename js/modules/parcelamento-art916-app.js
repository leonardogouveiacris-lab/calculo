/* ===== app.js (inline) ===== */
/**
 * app.js — Lógica do sistema de Parcelamento (Art. 916 CPC)
 *
 * Boas práticas aplicadas aqui:
 * 1) Centralização de seletores/IDs: use o objeto DOM para evitar erros.
 * 2) Estado único (state) + renderização derivada: qualquer mudança chama persistAndRender().
 * 3) Funções puras para cálculos (compute) e funções de render (renderEditors/renderReport).
 * 4) Persistência em localStorage (modo offline).
 */

(() => {
  "use strict";

  /* =====================
     UTILITÁRIOS
  ====================== */
  const DOM = {
    // Tabs
    tabBtnEditor: "tabBtnEditor",
    tabBtnReport: "tabBtnReport",
    tabEditor: "tab-editor",
    tabReport: "tab-report",

    // Header buttons
    btnOpenSolicitacoes: "btnOpenSolicitacoes",
    btnOpenDepositoRecursal: "btnOpenDepositoRecursal",
    btnPrint: "btnPrint",
    btnPrint2: "btnPrint2",
    btnBack: "btnBack",
    btnBackToData: "btnBackToData",

    // Actions
    btnReset: "btnReset",
    btnExport: "btnExport",
    fileImport: "fileImport",

    // Identificação
    inAutor: "inAutor",
    inReu: "inReu",
    inProc: "inProc",

    // Parcelamento
    inReqDate: "inReqDate",
    inMeses: "inMeses",
    inDueDate: "inDueDate",
    inJuros: "inJuros",
    inIndice: "inIndice",

    // Opções avançadas
    inFator: "inFator",
    inPercEntrada: "inPercEntrada",

    // Tabelas editor
    creditsEditor: "creditsEditor",
    debitsEditor: "debitsEditor",
    abatEditor: "abatEditor",
    indicesEditor: "indicesEditor",

    // Add buttons
    addCredit: "addCredit",
    addDebit: "addDebit",
    addAbat: "addAbat",
    addIndice: "addIndice",
    recalcMedia: "recalcMedia",

    // Preview resumo processo
    pvAutor: "pvAutor",
    pvReu: "pvReu",
    pvProc: "pvProc",

    // Resumo
    sTotalCred: "sTotalCred",
    sTotalDeb: "sTotalDeb",
    sEntrada: "sEntrada",
    sParcela: "sParcela",
    sTotalParcel: "sTotalParcel",
    sTotalGeral: "sTotalGeral",

    // Report fields
    rAutor: "rAutor",
    rReu: "rReu",
    rProc: "rProc",
    rCredits: "rCredits",
    rDebits: "rDebits",
    rTotalCredits: "rTotalCredits",
    rTotalDebits: "rTotalDebits",
    rReqDate: "rReqDate",
    rMeses: "rMeses",
    rDueDate: "rDueDate",
    rJuros: "rJuros",
    rIndice: "rIndice",

    // Advanced in report
    rFator: "rFator",
    rPercEntrada: "rPercEntrada",

    // Result table
    rResTotalGeral: "rResTotalGeral",
    rResTotalParcel: "rResTotalParcel",
    rResCorrecao: "rResCorrecao",
    rResJuros: "rResJuros",
    rResEntrada: "rResEntrada",
    rResParcelasTxt: "rResParcelasTxt",

    // Entrada breakdown
    rVE_SomaCreditos: "rVE_SomaCreditos",
    rVE_PercTxt: "rVE_PercTxt",
    rVE_EntradaBase: "rVE_EntradaBase",
    rVE_Debitos: "rVE_Debitos",
    rVE_LabelFinal: "rVE_LabelFinal",
    rVE_EntradaFinal: "rVE_EntradaFinal",

    // Parcela breakdown
    rVP_Abat: "rVP_Abat",
    rVP_PercTxt: "rVP_PercTxt",
    rVP_Restante: "rVP_Restante",
    rVP_Meses: "rVP_Meses",
    rVP_Parcela: "rVP_Parcela",

    // Schedule
    rTabN: "rTabN",
    rSchedule: "rSchedule",
    rTotCorr: "rTotCorr",
    rTotJuros: "rTotJuros",
    rTotGeral: "rTotGeral",

    // Toast
    toastHost: "toastHost",

    // Cabeçalho/Rodapé (inputs - mesmo que o card esteja hidden)
    inHdrNome: "inHdrNome",
    inHdrTel: "inHdrTel",
    inHdrEmail: "inHdrEmail",
    inFtrL1: "inFtrL1",
    inFtrL2: "inFtrL2",
    inFtrSite: "inFtrSite",
    inFtrEmp: "inFtrEmp",

    // Cabeçalho/Rodapé (relatório - páginas 1/2/3)
    rHdrNome: "rHdrNome",
    rHdrTel: "rHdrTel",
    rHdrEmailLegacy1: "suporte@calculopro.com.br",
    rHdrEmailLink1: "rHdrEmailLink",

    rHdrNome2: "rHdrNome2",
    rHdrTel2: "rHdrTel2",
    rHdrEmailLegacy2: "suporte@calculopro.com.br2",
    rHdrEmailLink2: "rHdrEmailLink2",

    rHdrNome3: "rHdrNome3",
    rHdrTel3: "rHdrTel3",
    rHdrEmailLegacy3: "suporte@calculopro.com.br3",
    rHdrEmailLink3: "rHdrEmailLink3",

    rFtrL1: "rFtrL1",
    rFtrL2: "rFtrL2",
    rFtrSite: "rFtrSite",
    rFtrEmp: "rFtrEmp",

    rFtrL1_2: "rFtrL1_2",
    rFtrL2_2: "rFtrL2_2",
    rFtrSite_2: "rFtrSite_2",
    rFtrEmp_2: "rFtrEmp_2",

    rFtrL1_3: "rFtrL1_3",
    rFtrL2_3: "rFtrL2_3",
    rFtrSite_3: "rFtrSite_3",
    rFtrEmp_3: "rFtrEmp_3",
  };

  const $ = (id) => document.getElementById(id);

  const STORAGE_KEY = "calculopro.art916.state.v2";
  const STORAGE_BACKUP_KEY = STORAGE_KEY + ".backup";

  // Logo padrão embutida (fallback). Se você definir state.logoDataUrl, ele tem prioridade.
  const LOGO_DATA = "https://calculopro.com.br/wp-content/uploads/2024/11/logonegativa.png";

  const fmtBRL = (v) => {
    const n = Number(v) || 0;
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const fmtPct = (v) => {
    const n = (Number(v) || 0) * 100;
    return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  };

  const fmtNum = (v) => {
    const n = Number(v) || 0;
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fmtDate = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso + "T00:00:00");
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("pt-BR");
    } catch {
      return iso;
    }
  };

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const addMonthsISO = (iso, m) => {
    // iso: YYYY-MM-DD
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return "";
    const day = d.getDate();
    d.setMonth(d.getMonth() + m);
    // Ajuste para casos em que o mês não tem o mesmo dia
    if (d.getDate() !== day) {
      d.setDate(0); // último dia do mês anterior
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const toast = (title, detail = "") => {
    const host = $(DOM.toastHost);
    if (!host) return;
    const node = document.createElement("div");
    node.className = "toast";
    node.innerHTML = `<div>${title}</div>${detail ? `<small>${detail}</small>` : ""}`;
    host.appendChild(node);
    setTimeout(() => node.remove(), 3200);
  };

  /* =====================
     ESTADO PADRÃO
  ====================== */
  const DEFAULT_STATE = {
    autor: "",
    reu: "",
    processo: "",

    parcelamento: {
      reqDate: "",
      meses: 6,
      dueDate: "",
      dueManual: false,
      jurosMensal: 0.01,
      indice: "IPCA-E",
    },

    opcoes: {
      fator: 1,
      percEntrada: 0.3, // 30%
    },

    creditos: [
      { desc: "Crédito 1", valor: 0 },
    ],

    debitos: [
      { desc: "Honorários + Custas + INSS", valor: 0 },
    ],

    abatimentos: [
      { desc: "Abatimento 1", valor: 0 },
    ],

    indices: [
      { mes: "01/2025", taxa: 0 },
    ],

    // Cabeçalho/rodapé
    header: {
      nome: "Leonardo G. Cristiano",
      tel: "(14) 99606-7654",
      email: "suporte@calculopro.com.br",
    },
    footer: {
      l1: "R. Mário Gonzaga Junqueira, 25-80",
      l2: "Jardim Viaduto, Bauru - SP, 17055-210",
      site: "www.calculopro.com.br",
      emp: "CalculoPro Ltda. 51.540.075/0001-04",
    },

    logoDataUrl: "", // base64
  };

  let state = structuredClone(DEFAULT_STATE);

  /* =====================
     PERSISTÊNCIA
  ====================== */
  function loadState() {
    const fallback = structuredClone(DEFAULT_STATE);
    const loaded = CPCommon.storage.load(STORAGE_KEY, fallback, (parsed) => normalizeImportedState(parsed));
    state = loaded;
    if (loaded === fallback) {
      const backup = CPCommon.storage.load(STORAGE_BACKUP_KEY, null, (parsed) => normalizeImportedState(parsed));
      if (backup) state = backup;
    }
  }

  function saveState() {
    const snapshot = JSON.parse(JSON.stringify(state));
    CPCommon.storage.save(STORAGE_BACKUP_KEY, snapshot);
    CPCommon.storage.save(STORAGE_KEY, snapshot);
  }

  /* =====================
     IMPORT / EXPORT
  ====================== */
  function normalizeImportedState(data) {
    // Merge permissivo com DEFAULT_STATE
    const merged = structuredClone(DEFAULT_STATE);
    const safeObj = (x) => (x && typeof x === "object" ? x : {});

    const d = safeObj(data);
    merged.autor = String(d.autor ?? merged.autor);
    merged.reu = String(d.reu ?? merged.reu);
    merged.processo = String(d.processo ?? merged.processo);

    merged.parcelamento = { ...merged.parcelamento, ...safeObj(d.parcelamento) };
    merged.opcoes = { ...merged.opcoes, ...safeObj(d.opcoes) };

    const fixArr = (arr, mapFn) => (Array.isArray(arr) ? arr.map(mapFn).filter(Boolean) : []);

    merged.creditos = fixArr(d.creditos, (it) => ({
      desc: String(it?.desc ?? ""),
      valor: Number(it?.valor ?? 0) || 0,
    }));
    if (!merged.creditos.length) merged.creditos = structuredClone(DEFAULT_STATE.creditos);

    merged.debitos = fixArr(d.debitos, (it) => ({
      desc: String(it?.desc ?? ""),
      valor: Number(it?.valor ?? 0) || 0,
    }));
    if (!merged.debitos.length) merged.debitos = structuredClone(DEFAULT_STATE.debitos);

    merged.abatimentos = fixArr(d.abatimentos, (it) => ({
      desc: String(it?.desc ?? ""),
      valor: Number(it?.valor ?? 0) || 0,
    }));
    if (!merged.abatimentos.length) merged.abatimentos = structuredClone(DEFAULT_STATE.abatimentos);

    merged.indices = fixArr(d.indices, (it) => ({
      mes: String(it?.mes ?? ""),
      taxa: Number(it?.taxa ?? 0) || 0,
    }));
    if (!merged.indices.length) merged.indices = structuredClone(DEFAULT_STATE.indices);

    merged.header = { ...merged.header, ...safeObj(d.header) };
    merged.footer = { ...merged.footer, ...safeObj(d.footer) };

    // Se o arquivo salvo tiver campos vazios, mantém os defaults (evita relatório “em branco”)
    const h = safeObj(d.header);
    if (typeof h.nome === "string" && h.nome.trim() === "") merged.header.nome = DEFAULT_STATE.header.nome;
    if (typeof h.tel === "string" && h.tel.trim() === "") merged.header.tel = DEFAULT_STATE.header.tel;
    if (typeof h.email === "string" && h.email.trim() === "") merged.header.email = DEFAULT_STATE.header.email;

    const f = safeObj(d.footer);
    if (typeof f.l1 === "string" && f.l1.trim() === "") merged.footer.l1 = DEFAULT_STATE.footer.l1;
    if (typeof f.l2 === "string" && f.l2.trim() === "") merged.footer.l2 = DEFAULT_STATE.footer.l2;
    if (typeof f.site === "string" && f.site.trim() === "") merged.footer.site = DEFAULT_STATE.footer.site;
    if (typeof f.emp === "string" && f.emp.trim() === "") merged.footer.emp = DEFAULT_STATE.footer.emp;

    merged.logoDataUrl = String(d.logoDataUrl ?? merged.logoDataUrl);

    // Normalizações
    merged.parcelamento.meses = clamp(Number(merged.parcelamento.meses) || 6, 1, 6);
    merged.parcelamento.jurosMensal = Number(merged.parcelamento.jurosMensal) || 0;
    merged.opcoes.fator = Number(merged.opcoes.fator) || 1;
    merged.opcoes.percEntrada = clamp(Number(merged.opcoes.percEntrada) || 0, 0, 1);

    return merged;
  }

  const IMPORT_MAX_BYTES = 2 * 1024 * 1024;
  const EXPORT_SCHEMA_VERSION = 1;

  function wrapExportPayload(data) {
    return {
      schemaVersion: EXPORT_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      data,
    };
  }

  function unwrapImportPayload(payload) {
    if (!payload || typeof payload !== "object") return payload;
    const hasEnvelope = Object.prototype.hasOwnProperty.call(payload, "schemaVersion");
    if (!hasEnvelope) return payload;
    if (!Object.prototype.hasOwnProperty.call(payload, "data") || typeof payload.data !== "object") {
      throw new Error("Arquivo inválido: envelope sem campo data.");
    }
    if (Number(payload.schemaVersion) > EXPORT_SCHEMA_VERSION) {
      throw new Error("Versão de arquivo mais nova que o app atual.");
    }
    return payload.data;
  }

  function exportJSON() {
    const payload = wrapExportPayload(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "parcelamento_art916_dados.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  async function importJSON(ev) {
    const file = ev?.target?.files?.[0];
    if (!file) return;
    if (file.size > IMPORT_MAX_BYTES) {
      alert("Arquivo JSON muito grande (limite: 2MB).\n\nDica: exporte novamente pelo sistema e reimporte.");
      try { ev.target.value = ""; } catch (error) { console.warn("Falha ao limpar campo de arquivo.", error); }
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      state = normalizeImportedState(unwrapImportPayload(parsed));
      saveState();
      persistAndRender(true);
      toast("Importado com sucesso", file.name);
    } catch (error) {
      alert("Falha ao importar JSON: " + (error?.message || String(error)));
    } finally {
      try { ev.target.value = ""; } catch (error) { console.warn("Falha ao limpar campo de arquivo.", error); }
    }
  }

  /* =====================
     CÁLCULO
  ====================== */
  function compute() {
    const sum = (arr) => arr.reduce((acc, it) => acc + (Number(it.valor) || 0), 0);
    const totalCred = sum(state.creditos);
    const totalDeb = sum(state.debitos);
    const totalAbat = sum(state.abatimentos);

    const percEntrada = Number(state.opcoes.percEntrada) || 0;
    const entradaBase = totalCred * percEntrada;
    const entrada = entradaBase + totalDeb;

    const meses = clamp(Number(state.parcelamento.meses) || 6, 1, 6);

    const restanteBase = (totalCred * 0.7) - totalAbat;
    const parcelaBase = restanteBase / meses;

    const fator = Number(state.opcoes.fator) || 1;
    const parcelaCorr = parcelaBase * fator;

    const jurosMensal = Number(state.parcelamento.jurosMensal) || 0;

    // Agenda de parcelas
    const schedule = [];
    const due0 = state.parcelamento.dueDate || addMonthsISO(state.parcelamento.reqDate, 1);
    for (let i = 1; i <= meses; i++) {
      const due = addMonthsISO(due0, i - 1);
      const jurosPct = jurosMensal * i;
      const jurosValor = parcelaCorr * jurosPct;
      const total = parcelaCorr + jurosValor;
      schedule.push({
        n: i,
        due,
        parcela: parcelaBase,
        fator,
        corr: parcelaCorr,
        jurosPct,
        jurosValor,
        total,
      });
    }

    const totCorr = schedule.reduce((a, x) => a + x.corr, 0);
    const totJuros = schedule.reduce((a, x) => a + x.jurosValor, 0);
    const totGeralParcelas = schedule.reduce((a, x) => a + x.total, 0);

    return {
      totalCred,
      totalDeb,
      totalAbat,
      percEntrada,
      entradaBase,
      entrada,
      meses,
      restanteBase,
      parcelaBase,
      fator,
      parcelaCorr,
      jurosMensal,
      schedule,
      totCorr,
      totJuros,
      totGeralParcelas,
      totalGeral: totGeralParcelas + entrada,
    };
  }

  /* =====================
     RENDER — EDITORES
  ====================== */
  function renderEditors() {
    // Inputs simples
    $(DOM.inAutor).value = state.autor;
    $(DOM.inReu).value = state.reu;
    $(DOM.inProc).value = state.processo;

    $(DOM.inReqDate).value = state.parcelamento.reqDate;
    $(DOM.inMeses).value = state.parcelamento.meses;
    $(DOM.inDueDate).value = state.parcelamento.dueDate;
    $(DOM.inJuros).value = (Number(state.parcelamento.jurosMensal) || 0) * 100;
    $(DOM.inIndice).value = state.parcelamento.indice;

    $(DOM.inFator).value = state.opcoes.fator;
    $(DOM.inPercEntrada).value = (Number(state.opcoes.percEntrada) || 0) * 100;

    // Cabeçalho/Rodapé (inputs) — podem estar ocultos, mas devem sincronizar e renderizar no relatório
    const iNome = $(DOM.inHdrNome); if (iNome) iNome.value = state.header.nome || "";
    const iTel  = $(DOM.inHdrTel);  if (iTel)  iTel.value  = state.header.tel  || "";
    const iMail = $(DOM.inHdrEmail);if (iMail) iMail.value = state.header.email|| "";

    const f1 = $(DOM.inFtrL1); if (f1) f1.value = state.footer.l1 || "";
    const f2 = $(DOM.inFtrL2); if (f2) f2.value = state.footer.l2 || "";
    const fs = $(DOM.inFtrSite); if (fs) fs.value = state.footer.site || "";
    const fe = $(DOM.inFtrEmp); if (fe) fe.value = state.footer.emp || "";

    // Preview do processo
    $(DOM.pvAutor).textContent = state.autor || "—";
    $(DOM.pvReu).textContent = state.reu || "—";
    $(DOM.pvProc).textContent = state.processo || "—";

    // Tabelas
    renderTable($(DOM.creditsEditor), state.creditos, "creditos");
    renderTable($(DOM.debitsEditor), state.debitos, "debitos");
    renderTable($(DOM.abatEditor), state.abatimentos, "abatimentos");
    renderIndices($(DOM.indicesEditor), state.indices);

    // Resumo
    const c = compute();
    $(DOM.sTotalCred).textContent = fmtBRL(c.totalCred);
    $(DOM.sTotalDeb).textContent = fmtBRL(c.totalDeb);
    $(DOM.sEntrada).textContent = fmtBRL(c.entrada);
    $(DOM.sParcela).textContent = fmtBRL(c.parcelaBase);
    $(DOM.sTotalParcel).textContent = fmtBRL(c.totGeralParcelas);
    $(DOM.sTotalGeral).textContent = fmtBRL(c.totalGeral);
  }

  function renderTable(tbody, arr, arrayKey) {
    if (!tbody) return;
    CPCommon.clear(tbody);

    arr.forEach((it, idx) => {
      const tr = document.createElement("tr");

      const tdDesc = document.createElement("td");
      const inputDesc = document.createElement("input");
      inputDesc.type = "text";
      inputDesc.value = String(it.desc ?? "");
      inputDesc.dataset.array = arrayKey;
      inputDesc.dataset.idx = String(idx);
      inputDesc.dataset.key = "desc";
      tdDesc.appendChild(inputDesc);

      const tdValor = document.createElement("td");
      const inputValor = document.createElement("input");
      inputValor.type = "text";
      inputValor.value = String(it.valor ?? 0);
      inputValor.dataset.array = arrayKey;
      inputValor.dataset.idx = String(idx);
      inputValor.dataset.key = "valor";
      tdValor.appendChild(inputValor);

      const tdActions = document.createElement("td");
      tdActions.className = "row-actions";
      const btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.className = "mini-btn danger";
      btnDel.dataset.action = "del";
      btnDel.dataset.array = arrayKey;
      btnDel.dataset.idx = String(idx);
      btnDel.textContent = "✕";
      tdActions.appendChild(btnDel);

      tr.appendChild(tdDesc);
      tr.appendChild(tdValor);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
  }

  function renderIndices(tbody, arr) {
    if (!tbody) return;
    tbody.innerHTML = "";

    arr.forEach((it, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input type="text" value="${escapeHtml(it.mes)}" data-array="indices" data-idx="${idx}" data-key="mes"></td>
        <td><input type="text" value="${escapeHtml(String(it.taxa ?? 0))}" data-array="indices" data-idx="${idx}" data-key="taxa"></td>
        <td class="row-actions"><button type="button" class="mini-btn danger" data-action="del" data-array="indices" data-idx="${idx}">✕</button></td>
      `;
      tbody.appendChild(tr);
    });
  }

  const escapeHtml = (s) => String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  /* =====================
     RENDER — RELATÓRIO
  ====================== */
  function renderReport() {
    const c = compute();

    // Logo (topo + páginas) — usa data URL se estiver configurado
    try {
      const logos = document.querySelectorAll("img[data-logo='1']");
      logos.forEach((img) => {
        if (!(img instanceof HTMLImageElement)) return;
        // Prioridade: logo personalizada do state → fallback para logo padrão embutida
        img.src = (state.logoDataUrl && String(state.logoDataUrl).trim()) ? state.logoDataUrl : LOGO_DATA;
      });
    } catch { /* ignore */ }

    // Cabeçalho do relatório (páginas 1/2/3)
    const nome = state.header.nome || "";
    const tel = state.header.tel || "";
    const email = state.header.email || "";

    const setText = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    const setEmail = (legacyId, modernId) => {
      const legacy = $(legacyId);
      const modern = $(modernId);
      const txt = email;
      const href = email ? `mailto:${email}` : "#";
      if (legacy) { legacy.textContent = txt; legacy.setAttribute("href", href); }
      if (modern) { modern.textContent = txt; modern.setAttribute("href", href); modern.setAttribute("rel", "noreferrer"); }
    };

    setText(DOM.rHdrNome, nome);
    setText(DOM.rHdrTel, tel);
    setEmail(DOM.rHdrEmailLegacy1, DOM.rHdrEmailLink1);

    setText(DOM.rHdrNome2, nome);
    setText(DOM.rHdrTel2, tel);
    setEmail(DOM.rHdrEmailLegacy2, DOM.rHdrEmailLink2);

    setText(DOM.rHdrNome3, nome);
    setText(DOM.rHdrTel3, tel);
    setEmail(DOM.rHdrEmailLegacy3, DOM.rHdrEmailLink3);

    // Rodapé do relatório (páginas 1/2/3)
    const l1 = state.footer.l1 || "";
    const l2 = state.footer.l2 || "";
    const site = state.footer.site || "";
    const emp = state.footer.emp || "";

    const setHrefText = (id, url) => {
      const a = $(id);
      if (!a) return;
      a.textContent = url || "";
      if (!url) { a.setAttribute("href", "#"); return; }
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      a.setAttribute("href", href);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noreferrer");
    };

    setText(DOM.rFtrL1, l1);
    setText(DOM.rFtrL2, l2);
    setHrefText(DOM.rFtrSite, site);
    setText(DOM.rFtrEmp, emp);

    setText(DOM.rFtrL1_2, l1);
    setText(DOM.rFtrL2_2, l2);
    setHrefText(DOM.rFtrSite_2, site);
    setText(DOM.rFtrEmp_2, emp);

    setText(DOM.rFtrL1_3, l1);
    setText(DOM.rFtrL2_3, l2);
    setHrefText(DOM.rFtrSite_3, site);
    setText(DOM.rFtrEmp_3, emp);

    if (window.CPPrintLayout) {
      window.CPPrintLayout.applyReportBranding(document.getElementById('reportRoot'), {
        header: state.header,
        footer: state.footer,
        logo: (state.logoDataUrl && String(state.logoDataUrl).trim()) ? state.logoDataUrl : LOGO_DATA
      });
    }

    // Processo
    $(DOM.rAutor).textContent = state.autor || "-";
    $(DOM.rReu).textContent = state.reu || "-";
    $(DOM.rProc).textContent = state.processo || "-";

    // Créditos
    const rCredits = $(DOM.rCredits);
    rCredits.innerHTML = "";
    state.creditos.forEach((it, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="center">${i + 1}</td>
        <td class="right">${fmtNum(it.valor)}</td>
        <td>${escapeHtml(it.desc)}</td>
      `;
      rCredits.appendChild(tr);
    });
    $(DOM.rTotalCredits).textContent = fmtNum(c.totalCred);

    // Débitos
    const rDebits = $(DOM.rDebits);
    rDebits.innerHTML = "";
    state.debitos.forEach((it, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="center">${i + 1}</td>
        <td class="right">${fmtNum(it.valor)}</td>
        <td>${escapeHtml(it.desc)}</td>
      `;
      rDebits.appendChild(tr);
    });
    $(DOM.rTotalDebits).textContent = fmtNum(c.totalDeb);

    // Parcelamento params
    $(DOM.rReqDate).textContent = fmtDate(state.parcelamento.reqDate);
    $(DOM.rMeses).textContent = String(c.meses);
    $(DOM.rDueDate).textContent = fmtDate(state.parcelamento.dueDate || addMonthsISO(state.parcelamento.reqDate, 1));
    $(DOM.rJuros).textContent = fmtPct(state.parcelamento.jurosMensal);
    $(DOM.rIndice).textContent = state.parcelamento.indice;

    // Advanced
    $(DOM.rFator).textContent = fmtNum(state.opcoes.fator);
    $(DOM.rPercEntrada).textContent = fmtNum(state.opcoes.percEntrada * 100);

    // Result
    $(DOM.rResTotalGeral).textContent = fmtNum(c.totalGeral);
    $(DOM.rResTotalParcel).textContent = fmtNum(c.totGeralParcelas);
    $(DOM.rResCorrecao).textContent = fmtNum(c.totCorr);
    $(DOM.rResJuros).textContent = fmtNum(c.totJuros);
    $(DOM.rResEntrada).textContent = fmtNum(c.entrada);
    $(DOM.rResParcelasTxt).textContent = `${c.meses} parcelas`;

    // Entrada breakdown
    $(DOM.rVE_SomaCreditos).textContent = fmtNum(c.totalCred);
    $(DOM.rVE_PercTxt).textContent = fmtNum(c.percEntrada * 100);
    $(DOM.rVE_EntradaBase).textContent = fmtNum(c.entradaBase);
    $(DOM.rVE_Debitos).textContent = fmtNum(c.totalDeb);
    $(DOM.rVE_LabelFinal).textContent = "Valor da entrada";
    $(DOM.rVE_EntradaFinal).textContent = fmtNum(c.entrada);

    // Parcela breakdown
    $(DOM.rVP_Abat).textContent = fmtNum(c.totalAbat);
    $(DOM.rVP_PercTxt).textContent = "70%";
    $(DOM.rVP_Restante).textContent = fmtNum(c.restanteBase);
    $(DOM.rVP_Meses).textContent = String(c.meses);
    $(DOM.rVP_Parcela).textContent = fmtNum(c.parcelaBase);

    // Schedule
    $(DOM.rTabN).textContent = String(c.meses);
    const rSchedule = $(DOM.rSchedule);
    rSchedule.innerHTML = "";
    c.schedule.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="center">${row.n}</td>
        <td class="center">${fmtDate(row.due)}</td>
        <td class="right">${fmtNum(row.parcela)}</td>
        <td class="right">${fmtNum(row.fator)}</td>
        <td class="right">${fmtNum(row.corr)}</td>
        <td class="right">${fmtNum(row.jurosPct * 100)}</td>
        <td class="right">${fmtNum(row.jurosValor)}</td>
        <td class="right">${fmtNum(row.total)}</td>
      `;
      rSchedule.appendChild(tr);
    });

    $(DOM.rTotCorr).textContent = fmtNum(c.totCorr);
    $(DOM.rTotJuros).textContent = fmtNum(c.totJuros);
    $(DOM.rTotGeral).textContent = fmtNum(c.totGeralParcelas);
  }


  /* =====================
     TAB / PRINT
  ====================== */
  function setTab(which) {
    const isEditor = which === "editor";
    $(DOM.tabEditor).classList.toggle("active", isEditor);
    $(DOM.tabReport).classList.toggle("active", !isEditor);

    $(DOM.tabBtnEditor).classList.toggle("active", isEditor);
    $(DOM.tabBtnReport).classList.toggle("active", !isEditor);

    $(DOM.tabBtnEditor).setAttribute("aria-selected", isEditor ? "true" : "false");
    $(DOM.tabBtnReport).setAttribute("aria-selected", !isEditor ? "true" : "false");

    if (!isEditor) {
      renderReport();
      if (window.CPPrintLayout && typeof CPPrintLayout.measureAndPaginate === "function") {
        CPPrintLayout.measureAndPaginate({ root: document.getElementById("reportRoot"), spacing: CPPrintLayout.defaults.spacing });
      }
    }
  }

  /* =====================
     EVENTOS / BIND
  ====================== */
  function bind() {
    // Tabs
    $(DOM.tabBtnEditor).addEventListener("click", () => setTab("editor"));
    $(DOM.tabBtnReport).addEventListener("click", () => setTab("report"));

    // Navegação
    $(DOM.btnOpenSolicitacoes)?.addEventListener("click", () => (window.location.href = "app_solicitacoes.html"));
    $(DOM.btnOpenDepositoRecursal)?.addEventListener("click", () => (window.location.href = "app_deposito_recursal.html"));

    // Print
    const doPrint = () => {
      setTab("report");
      const reportRoot = document.getElementById("reportRoot");
      if (!reportRoot || !window.CPPrintLayout || !CPPrintLayout.printRootInHost) {
        setTimeout(() => window.print(), 120);
        return;
      }
      setTimeout(() => {
        renderReport();
        CPPrintLayout.printRootInHost(reportRoot, "parcelamento-art916-print", "Relatorio - Parcelamento Art. 916");
      }, 120);
    };
    $(DOM.btnPrint)?.addEventListener("click", doPrint);
    $(DOM.btnPrint2)?.addEventListener("click", doPrint);

    // Back
    $(DOM.btnBack)?.addEventListener("click", () => { location.href = "index.html"; });
    $(DOM.btnBackToData)?.addEventListener("click", () => setTab("editor"));

    // Reset
    $(DOM.btnReset).addEventListener("click", () => {
      state = structuredClone(DEFAULT_STATE);
      saveState();
      persistAndRender(true);
      toast("Dados restaurados", "Padrão aplicado");
    });

    // Export
    $(DOM.btnExport).addEventListener("click", () => exportJSON());

    // Import
    $(DOM.fileImport).addEventListener("change", importJSON);

    // Inputs simples
    $(DOM.inAutor).addEventListener("input", (e) => {
      state.autor = e.target.value;
      persistAndRender(true);
    });
    $(DOM.inReu).addEventListener("input", (e) => {
      state.reu = e.target.value;
      persistAndRender(true);
    });
    $(DOM.inProc).addEventListener("input", (e) => {
      state.processo = e.target.value;
      persistAndRender(true);
    });

    $(DOM.inReqDate).addEventListener("input", (e) => {
      state.parcelamento.reqDate = e.target.value;
      if (!state.parcelamento.dueManual) {
        state.parcelamento.dueDate = addMonthsISO(state.parcelamento.reqDate, 1);
      }
      persistAndRender(true);
    });
    $(DOM.inMeses).addEventListener("input", (e) => {
      state.parcelamento.meses = clamp(Number(e.target.value) || 6, 1, 6);
      persistAndRender(true);
    });
    $(DOM.inDueDate).addEventListener("input", (e) => {
      state.parcelamento.dueDate = e.target.value;
      state.parcelamento.dueManual = true;
      persistAndRender(true);
    });
    $(DOM.inJuros).addEventListener("input", (e) => {
      state.parcelamento.jurosMensal = (Number(e.target.value) || 0) / 100;
      persistAndRender(true);
    });
    $(DOM.inIndice).addEventListener("change", (e) => {
      state.parcelamento.indice = e.target.value;
      persistAndRender(true);
    });

    $(DOM.inFator).addEventListener("input", (e) => {
      state.opcoes.fator = Number(e.target.value) || 1;
      persistAndRender(true);
    });
    $(DOM.inPercEntrada).addEventListener("input", (e) => {
      state.opcoes.percEntrada = clamp((Number(e.target.value) || 0) / 100, 0, 1);
      persistAndRender(true);
    });

    // Cabeçalho / Rodapé (mesmo oculto, se existir no DOM, mantém vinculado)
    const bindText = (id, setter) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("input", (e) => { setter(e.target.value); persistAndRender(true); });
    };

    bindText(DOM.inHdrNome, (v) => (state.header.nome = v));
    bindText(DOM.inHdrTel, (v) => (state.header.tel = v));
    bindText(DOM.inHdrEmail, (v) => (state.header.email = v));

    bindText(DOM.inFtrL1, (v) => (state.footer.l1 = v));
    bindText(DOM.inFtrL2, (v) => (state.footer.l2 = v));
    bindText(DOM.inFtrSite, (v) => (state.footer.site = v));
    bindText(DOM.inFtrEmp, (v) => (state.footer.emp = v));

    // Delegação tabelas
    document.body.addEventListener("input", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLInputElement)) return;
      const arrayKey = t.dataset.array;
      const idx = Number(t.dataset.idx);
      const key = t.dataset.key;
      if (!arrayKey || !Number.isInteger(idx) || !key) return;

      const arr = state[arrayKey];
      if (!Array.isArray(arr) || !arr[idx]) return;

      if (key === "valor" || key === "taxa") {
        arr[idx][key] = Number(String(t.value).replace(/\./g, "").replace(",", ".")) || 0;
        persistAndRender(false);
      } else {
        arr[idx][key] = t.value;
        persistAndRender(false);
      }
    });

    document.body.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;

      // delete
      const del = t.closest("[data-action='del']");
      if (del) {
        const arrayKey = del.dataset.array;
        const idx = Number(del.dataset.idx);
        if (arrayKey && Number.isInteger(idx) && Array.isArray(state[arrayKey])) {
          state[arrayKey].splice(idx, 1);
          if (state[arrayKey].length === 0) {
            // mantém ao menos 1 linha
            if (arrayKey === "creditos") state.creditos = structuredClone(DEFAULT_STATE.creditos);
            if (arrayKey === "debitos") state.debitos = structuredClone(DEFAULT_STATE.debitos);
            if (arrayKey === "abatimentos") state.abatimentos = structuredClone(DEFAULT_STATE.abatimentos);
            if (arrayKey === "indices") state.indices = structuredClone(DEFAULT_STATE.indices);
          }
          persistAndRender(true);
        }
        return;
      }

      // add rows
      if (t.id === DOM.addCredit) {
        state.creditos.push({ desc: "", valor: 0 });
        persistAndRender(true);
      }
      if (t.id === DOM.addDebit) {
        state.debitos.push({ desc: "", valor: 0 });
        persistAndRender(true);
      }
      if (t.id === DOM.addAbat) {
        state.abatimentos.push({ desc: "", valor: 0 });
        persistAndRender(true);
      }
      if (t.id === DOM.addIndice) {
        state.indices.push({ mes: "", taxa: 0 });
        persistAndRender(true);
      }
      if (t.id === DOM.recalcMedia) {
        // média das taxas -> fator
        const taxas = state.indices.map((x) => Number(x.taxa) || 0);
        const media = taxas.length ? taxas.reduce((a, x) => a + x, 0) / taxas.length : 0;
        // converte taxa mensal média (%) em fator aproximado
        state.opcoes.fator = 1 + (media / 100);
        persistAndRender(true);
        toast("Média recalculada", `Fator: ${fmtNum(state.opcoes.fator)}`);
      }
    });

    // Ao imprimir, sempre mostrar relatório
    window.addEventListener("beforeprint", () => setTab("report"));
  }

  const debouncedPersistAndRenderReport = (() => {
    let timer = null;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        saveState();
        renderReport();
      }, 160);
    };
  })();

  function persistAndRender(rerenderEditors = true) {
    if (rerenderEditors) {
      saveState();
      renderEditors();
      renderReport();
      return;
    }
    debouncedPersistAndRenderReport();
  }

  /* =====================
     INIT
  ====================== */
  function init() {
    loadState();
    bind();
    persistAndRender(true);
    setTab("editor");
  }


  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
