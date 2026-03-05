(function (global) {
  'use strict';

  function createDepositoRecursalModule(userConfig) {
    const config = Object.assign({
      depDate: 'depDate',
      depValue: 'depValue',
      depObs: 'depObs',
      btnAddDep: 'btnAddDep',
      depTable: 'depTable',
      indexType: 'indexType',
      manualWrap: 'manualWrap',
      idxMonth: 'idxMonth',
      idxValue: 'idxValue',
      btnAddIdx: 'btnAddIdx',
      idxTable: 'idxTable',
      btnSortIdx: 'btnSortIdx',
      btnClearIdx: 'btnClearIdx',
      endDate: 'endDate',
      roundingEl: 'roundingEl',
      btnCalc: 'btnCalc',
      btnShowReport: 'btnShowReport',
      btnPrint: 'btnPrint',
      autoStatus: 'autoStatus',
      report: 'report',
      repMeta: 'repMeta',
      repBlocks: 'repBlocks',
      repSources: 'repSources',
      repEnd: 'repEnd',
      repTotal: 'repTotal',
      indexHint: 'indexHint'
    }, userConfig || {});

    const state = {
      deposits: [],
      indices: [],
      lastCalc: null
    };

    const el = {};

    function getEl(id) {
      return document.getElementById(config[id]);
    }

    function fmtBRL(n) {
      return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function toDateBR(iso) {
      if (!iso) return '';
      const [y, m, d] = iso.split('-');
      return `${d}/${m}/${y}`;
    }

    function toBR(iso) {
      return toDateBR(iso);
    }

    function monthKeyFromDate(iso) {
      return (iso || '').slice(0, 7);
    }

    function addMonths(monthKey, step) {
      const [y, m] = monthKey.split('-').map(Number);
      const dt = new Date(y, m - 1 + step, 1);
      const yy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      return `${yy}-${mm}`;
    }

    function monthsBetweenInclusive(startKey, endKey) {
      const out = [];
      if (!startKey || !endKey || startKey > endKey) return out;
      let cur = startKey;
      while (cur <= endKey) {
        out.push(cur);
        cur = addMonths(cur, 1);
      }
      return out;
    }

    function compareMonth(a, b) {
      return a.month.localeCompare(b.month);
    }

    function minDepositDate() {
      if (!state.deposits.length) return '';
      return state.deposits.map((d) => d.date).sort()[0];
    }

    function parseBCBNumber(v) {
      return Number(String(v).replace('.', '').replace(',', '.'));
    }

    function monthLabel(monthKey) {
      const [y, m] = monthKey.split('-');
      return `${m}/${y}`;
    }

    function setAutoStatus(msg) {
      if (el.autoStatus) el.autoStatus.textContent = msg || '';
    }

    function updateIndexTypeUI() {
      const t = el.indexType ? el.indexType.value : 'manual';
      if (el.manualWrap) el.manualWrap.style.display = t === 'manual' ? '' : 'none';
      if (!el.indexHint) return;
      if (t === 'poupanca_auto') {
        el.indexHint.textContent = 'Busca automática no BCB: TR mensal (SGS 7811) + adicional pela Meta Selic (SGS 432).';
      } else if (t === 'jam_auto') {
        el.indexHint.textContent = 'Busca automática no BCB: TR mensal (SGS 7811) + juros fixos de 3% a.a. (0,25% a.m.).';
      } else {
        el.indexHint.textContent = '';
      }
    }

    function renderDeposits() {
      if (!el.depTable) return;
      const tbody = el.depTable.querySelector('tbody') || el.depTable;
      tbody.innerHTML = '';

      state.deposits.forEach((dep, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${toDateBR(dep.date)}</td>
          <td>${fmtBRL(dep.value)}</td>
          <td>${dep.obs || ''}</td>
          <td>
            <button type="button" data-action="edit" data-i="${i}">Editar</button>
            <button type="button" data-action="del" data-i="${i}">Del</button>
          </td>`;
        tbody.appendChild(tr);
      });
    }

    function addDeposit() {
      const date = el.depDate && el.depDate.value;
      const value = el.depValue ? parseFloat(el.depValue.value) : NaN;
      const obs = el.depObs ? (el.depObs.value || '').trim() : '';

      if (!date) {
        alert('Informe a data do depósito.');
        return;
      }
      if (!Number.isFinite(value)) {
        alert('Informe um valor de depósito válido.');
        return;
      }

      state.deposits.push({ date, value, obs });
      if (el.depDate) el.depDate.value = '';
      if (el.depValue) el.depValue.value = '';
      if (el.depObs) el.depObs.value = '';
      renderDeposits();
    }

    function editDep(i) {
      const dep = state.deposits[i];
      if (!dep) return;
      const date = prompt('Data (YYYY-MM-DD):', dep.date);
      if (date === null) return;
      const valueStr = prompt('Valor:', String(dep.value));
      if (valueStr === null) return;
      const obs = prompt('Observação:', dep.obs || '');
      if (!date) return alert('Data inválida.');
      const value = parseFloat(valueStr);
      if (!Number.isFinite(value)) return alert('Valor inválido.');
      state.deposits[i] = { date, value, obs: obs || '' };
      renderDeposits();
    }

    function delDep(i) {
      state.deposits.splice(i, 1);
      renderDeposits();
    }

    function renderIndices() {
      if (!el.idxTable) return;
      const tbody = el.idxTable.querySelector('tbody') || el.idxTable;
      tbody.innerHTML = '';

      state.indices.forEach((idx, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${monthLabel(idx.month)}</td>
          <td>${Number(idx.value).toLocaleString('pt-BR', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}</td>
          <td>
            <button type="button" data-action="edit" data-i="${i}">Editar</button>
            <button type="button" data-action="del" data-i="${i}">Del</button>
          </td>`;
        tbody.appendChild(tr);
      });
    }

    function addManualIndex() {
      const month = el.idxMonth && el.idxMonth.value;
      const value = el.idxValue ? parseFloat(el.idxValue.value) : NaN;
      if (!month) return alert('Informe o mês do índice.');
      if (!Number.isFinite(value)) return alert('Informe um índice válido.');

      const found = state.indices.find((i) => i.month === month);
      if (found) {
        found.value = value;
      } else {
        state.indices.push({ month, value });
      }

      state.indices.sort(compareMonth);
      renderIndices();

      if (el.idxMonth) el.idxMonth.value = '';
      if (el.idxValue) el.idxValue.value = '';
    }

    function editIdx(i) {
      const idx = state.indices[i];
      if (!idx) return;
      const month = prompt('Mês (YYYY-MM):', idx.month);
      if (month === null) return;
      const valStr = prompt('Índice (% do mês):', String(idx.value));
      if (valStr === null) return;
      const value = parseFloat(valStr);
      if (!month) return alert('Mês inválido.');
      if (!Number.isFinite(value)) return alert('Valor inválido.');
      state.indices[i] = { month, value };
      state.indices.sort(compareMonth);
      renderIndices();
    }

    function delIdx(i) {
      state.indices.splice(i, 1);
      renderIndices();
    }

    async function fetchSeries(code, startDateISO, endDateISO) {
      const all = [];
      let curStart = new Date(`${startDateISO}T00:00:00`);
      const endDate = new Date(`${endDateISO}T00:00:00`);

      while (curStart <= endDate) {
        const curEnd = new Date(curStart);
        curEnd.setFullYear(curEnd.getFullYear() + 9);
        if (curEnd > endDate) curEnd.setTime(endDate.getTime());

        const di = toBR(curStart.toISOString().slice(0, 10));
        const df = toBR(curEnd.toISOString().slice(0, 10));
        const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=${encodeURIComponent(di)}&dataFinal=${encodeURIComponent(df)}`;

        let resp;
        try {
          resp = await fetch(url);
        } catch (err) {
          throw new Error(`Falha de rede ao buscar série ${code} no BCB.`);
        }

        if (!resp.ok) {
          throw new Error(`Erro ao buscar série ${code} no BCB (HTTP ${resp.status}).`);
        }

        const part = await resp.json();
        if (Array.isArray(part)) all.push(...part);

        curStart = new Date(curEnd);
        curStart.setDate(curStart.getDate() + 1);
      }
      return all;
    }

    function dailyToMonthlyEffective(dailyList, seriesCode) {
      const byMonthFactor = new Map();

      (dailyList || []).forEach((it) => {
        const [d, m, y] = String(it.data).split('/');
        const mk = `${y}-${m}`;
        const v = parseBCBNumber(it.valor);

        let dailyRate;
        if (String(seriesCode) === '4389') {
          const aa = v / 100;
          dailyRate = Math.pow(1 + aa, 1 / 252) - 1;
        } else if (String(seriesCode) === '11') {
          dailyRate = v / 100;
        } else {
          return;
        }

        const prev = byMonthFactor.get(mk) || 1;
        byMonthFactor.set(mk, prev * (1 + dailyRate));
      });

      return Array.from(byMonthFactor.entries())
        .map(([month, factor]) => ({ month, value: (factor - 1) * 100 }))
        .sort(compareMonth);
    }

    function monthlyMapFromBCB(list) {
      const map = new Map();
      (list || []).forEach((it) => {
        const [d, m, y] = String(it.data).split('/');
        const mk = `${y}-${m}`;
        map.set(mk, parseBCBNumber(it.valor));
      });
      return map;
    }

    function buildPoupancaMonthly(trList, metaSelicList) {
      const trMap = monthlyMapFromBCB(trList);
      const metaMap = monthlyMapFromBCB(metaSelicList);
      const months = Array.from(new Set([...trMap.keys(), ...metaMap.keys()])).sort();

      return months.map((month) => {
        const tr = trMap.get(month) || 0;
        const metaSelicAA = metaMap.get(month) || 0;
        const adicional = metaSelicAA > 8.5 ? 0.5 : 0.7 * (metaSelicAA / 12);
        return { month, value: tr + adicional };
      });
    }

    function buildJamMonthly(trList) {
      const trMap = monthlyMapFromBCB(trList);
      return Array.from(trMap.entries())
        .map(([month, tr]) => ({ month, value: tr + 0.25 }))
        .sort(compareMonth);
    }

    function getManualIndex(month) {
      const found = state.indices.find((i) => i.month === month);
      return found ? Number(found.value) / 100 : 0;
    }

    function fontesHTML(tipo) {
      if (tipo === 'poupanca_auto') {
        return `
          <ul>
            <li>API SGS/BCB: séries automáticas por período.</li>
            <li>TR mensal (SGS 7811): <a href="https://api.bcb.gov.br/dados/serie/bcdata.sgs.7811/dados?formato=json" target="_blank" rel="noopener">Série 7811</a></li>
            <li>Meta Selic (SGS 432): <a href="https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json" target="_blank" rel="noopener">Série 432</a></li>
            <li>Regra da poupança (BCB): <a href="https://www.bcb.gov.br/meubc/faqs/p/como-e-definida-a-remuneracao-da-poupanca" target="_blank" rel="noopener">Como é definida a remuneração da poupança</a></li>
          </ul>`;
      }
      if (tipo === 'jam_auto') {
        return `
          <ul>
            <li>API SGS/BCB: séries automáticas por período.</li>
            <li>TR mensal (SGS 7811): <a href="https://api.bcb.gov.br/dados/serie/bcdata.sgs.7811/dados?formato=json" target="_blank" rel="noopener">Série 7811</a></li>
            <li>Juros fixos aplicados: 3% a.a. (0,25% a.m.).</li>
          </ul>`;
      }
      if (tipo === 'cdi') {
        return '<ul><li>API SGS/BCB: CDI bancário (SGS 4389): <a href="https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados?formato=json" target="_blank" rel="noopener">Série 4389</a></li></ul>';
      }
      if (tipo === 'selic') {
        return '<ul><li>API SGS/BCB: Selic diária (SGS 11): <a href="https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados?formato=json" target="_blank" rel="noopener">Série 11</a></li></ul>';
      }
      return '<p>Índices inseridos manualmente com base na tabela do Juízo/Tribunal.</p>';
    }

    async function calculateAll() {
      if (!state.deposits.length) {
        alert('Cadastre depósitos.');
        return null;
      }

      const end = el.endDate && el.endDate.value;
      if (!end) {
        alert('Informe data final.');
        return null;
      }

      const rounding = Number(el.roundingEl ? el.roundingEl.value : 2) || 2;
      const indexType = el.indexType ? el.indexType.value : 'manual';
      const start = minDepositDate();
      const endKey = monthKeyFromDate(end);

      try {
        if (indexType === 'cdi' || indexType === 'selic' || indexType === 'poupanca_auto' || indexType === 'jam_auto') {
          setAutoStatus('Buscando índices no BCB...');
        } else {
          setAutoStatus('');
        }

        if (indexType === 'cdi') {
          const raw = await fetchSeries(4389, start, end);
          state.indices = dailyToMonthlyEffective(raw, 4389);
        } else if (indexType === 'selic') {
          const raw = await fetchSeries(11, start, end);
          state.indices = dailyToMonthlyEffective(raw, 11);
        } else if (indexType === 'poupanca_auto') {
          const trList = await fetchSeries(7811, start, end);
          const metaList = await fetchSeries(432, start, end);
          state.indices = buildPoupancaMonthly(trList, metaList);
        } else if (indexType === 'jam_auto') {
          const trList = await fetchSeries(7811, start, end);
          state.indices = buildJamMonthly(trList);
        }

        if (indexType !== 'manual') {
          setAutoStatus(`OK (${state.indices.length} meses).`);
          renderIndices();
        }
      } catch (err) {
        setAutoStatus('Erro ao buscar índices.');
        alert(err.message || 'Erro ao buscar índices automáticos.');
        return null;
      }

      const depBlocks = [];
      let totalUpdated = 0;

      state.deposits.forEach((dep) => {
        const startKey = monthKeyFromDate(dep.date);
        const months = monthsBetweenInclusive(startKey, endKey);
        let saldo = Number(dep.value);
        const lines = [];

        months.forEach((mk, i) => {
          const idxPercent = indexType === 'manual'
            ? getManualIndex(mk)
            : ((state.indices.find((x) => x.month === mk)?.value || 0) / 100);

          const saldoAnterior = saldo;
          const jurosMes = saldoAnterior * idxPercent;
          saldo = saldoAnterior + jurosMes;

          lines.push({
            i,
            mk,
            idxMes: idxPercent,
            saldoAnterior,
            jurosMes,
            saldo
          });
        });

        const pow = Math.pow(10, rounding);
        saldo = Math.round(saldo * pow) / pow;
        totalUpdated += saldo;

        depBlocks.push({ dep, lines, subtotal: saldo });
      });

      const indexLabel = el.indexType
        ? (el.indexType.options[el.indexType.selectedIndex] || {}).text || ''
        : indexType;

      const result = { end, totalUpdated, indexLabel, depBlocks, indexType };
      state.lastCalc = result;
      return result;
    }

    function renderReport(result) {
      if (!result || !el.report) return;

      if (el.repMeta) {
        el.repMeta.textContent = `Índice bancário: ${result.indexLabel} • Data final: ${toDateBR(result.end)}`;
      }
      if (el.repEnd) el.repEnd.textContent = toDateBR(result.end);
      if (el.repTotal) el.repTotal.textContent = fmtBRL(result.totalUpdated);

      if (el.repBlocks) {
        el.repBlocks.innerHTML = '';

        result.depBlocks.forEach((block) => {
          const wrap = document.createElement('div');
          wrap.className = 'dep-block';

          const title = document.createElement('h4');
          const obsPart = block.dep.obs ? ` • ${block.dep.obs}` : '';
          title.textContent = `Depósito em ${toDateBR(block.dep.date)} • ${fmtBRL(block.dep.value)}${obsPart}`;
          wrap.appendChild(title);

          const table = document.createElement('table');
          table.innerHTML = `
            <thead>
              <tr>
                <th>Data do Depósito</th>
                <th>Valor Depositado</th>
                <th>Índice de Atualização Monetária + Juros</th>
                <th>Data da Atualização</th>
                <th>Saldo Anterior</th>
                <th>Juros e Atualização Monetária</th>
                <th>Valor Atualizado</th>
              </tr>
            </thead>
            <tbody></tbody>`;

          const tbody = table.querySelector('tbody');

          block.lines.forEach((ln) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${ln.i === 0 ? toDateBR(block.dep.date) : '-'}</td>
              <td>${ln.i === 0 ? fmtBRL(block.dep.value) : '-'}</td>
              <td>${(ln.idxMes * 100).toLocaleString('pt-BR', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}</td>
              <td>${monthLabel(ln.mk)}</td>
              <td>${fmtBRL(ln.saldoAnterior)}</td>
              <td>${fmtBRL(ln.jurosMes)}</td>
              <td>${fmtBRL(ln.saldo)}</td>`;
            tbody.appendChild(tr);
          });

          wrap.appendChild(table);

          const subtotal = document.createElement('p');
          subtotal.innerHTML = `<strong>Subtotal atualizado: ${fmtBRL(block.subtotal)}</strong>`;
          wrap.appendChild(subtotal);

          el.repBlocks.appendChild(wrap);
        });
      }

      if (el.repSources) {
        el.repSources.innerHTML = fontesHTML(result.indexType);
      }

      el.report.style.display = '';
      el.report.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function onCalculateOnly() {
      const result = await calculateAll();
      if (result) alert('Cálculo pronto. Gere o relatório.');
    }

    async function onShowReport() {
      const result = await calculateAll();
      if (result) renderReport(result);
    }

    async function onPrint() {
      const result = await calculateAll();
      if (result) {
        renderReport(result);
        window.print();
      }
    }

    function bindEvents() {
      if (el.btnAddDep) el.btnAddDep.addEventListener('click', addDeposit);
      if (el.depTable) {
        el.depTable.addEventListener('click', (ev) => {
          const b = ev.target.closest('button[data-action]');
          if (!b) return;
          const i = Number(b.getAttribute('data-i'));
          const action = b.getAttribute('data-action');
          if (action === 'edit') editDep(i);
          if (action === 'del') delDep(i);
        });
      }

      if (el.btnAddIdx) el.btnAddIdx.addEventListener('click', addManualIndex);
      if (el.idxTable) {
        el.idxTable.addEventListener('click', (ev) => {
          const b = ev.target.closest('button[data-action]');
          if (!b) return;
          const i = Number(b.getAttribute('data-i'));
          const action = b.getAttribute('data-action');
          if (action === 'edit') editIdx(i);
          if (action === 'del') delIdx(i);
        });
      }

      if (el.btnSortIdx) {
        el.btnSortIdx.addEventListener('click', () => {
          state.indices.sort(compareMonth);
          renderIndices();
        });
      }

      if (el.btnClearIdx) {
        el.btnClearIdx.addEventListener('click', () => {
          if (confirm('Limpar todos os índices?')) {
            state.indices = [];
            renderIndices();
          }
        });
      }

      if (el.indexType) el.indexType.addEventListener('change', updateIndexTypeUI);
      if (el.btnCalc) el.btnCalc.addEventListener('click', onCalculateOnly);
      if (el.btnShowReport) el.btnShowReport.addEventListener('click', onShowReport);
      if (el.btnPrint) el.btnPrint.addEventListener('click', onPrint);
    }

    function init() {
      Object.keys(config).forEach((k) => {
        el[k] = getEl(k);
      });

      if (el.report) el.report.style.display = 'none';
      updateIndexTypeUI();
      renderDeposits();
      renderIndices();
      bindEvents();
    }

    return {
      init,
      state,
      helpers: {
        fmtBRL,
        toDateBR,
        monthKeyFromDate,
        addMonths,
        monthsBetweenInclusive,
        compareMonth,
        minDepositDate,
        toBR
      },
      actions: {
        addDeposit,
        editDep,
        delDep,
        addManualIndex,
        editIdx,
        delIdx,
        calculateAll,
        renderReport,
        fetchSeries,
        dailyToMonthlyEffective,
        buildPoupancaMonthly,
        buildJamMonthly,
        fontesHTML
      }
    };
  }

  global.DepositoRecursalModule = {
    create: createDepositoRecursalModule
  };
})(window);
