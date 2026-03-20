from pathlib import Path
p = Path('/mnt/data/civil_edit/app_calculos_civeis.html')
text = p.read_text(encoding='utf-8')

text = text.replace(
".report-table{width:100%;border-collapse:collapse;font-size:10.8pt;border-top:1px solid #cfd4de;border-bottom:1px solid #cfd4de}.report-table th,.report-table td{border-bottom:1px solid #d9dde6;border-right:1px solid #eceff5;padding:5px 7px;vertical-align:top}.report-table th{background:#fafbfc;border-bottom:1px solid #c7ceda;text-align:center;font-weight:600}.report-table th:last-child,.report-table td:last-child{border-right:none}.report-table tbody tr:last-child td{border-bottom:none}.report-table .right{text-align:right}.report-table .center{text-align:center}.report-table .bold{font-weight:800}",
".report-table{width:100%;border-collapse:collapse;font-size:10.8pt;border-top:1px solid #cfd4de;border-bottom:1px solid #cfd4de}.report-table th,.report-table td{border-bottom:1px solid #d9dde6;border-right:1px solid #eceff5;padding:5px 7px;vertical-align:top}.report-table th{background:#fafbfc;border-bottom:1px solid #c7ceda;text-align:center;font-weight:600}.report-table th:last-child,.report-table td:last-child{border-right:none}.report-table tbody tr:last-child td{border-bottom:none}.report-table .right{text-align:right}.report-table .center{text-align:center}.report-table .bold{font-weight:800}\n.inline-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0 12px}.mini-badge{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;background:var(--soft);border:1px solid var(--border);font-size:11px;color:var(--muted)}.formula-note{font-size:11px;color:var(--muted);margin-top:8px}.editor-table input[readonly]{background:var(--soft-2)}"
)

text = text.replace(
"        <div class=\"card-sub\">Cada verba gera sua própria tabela, separada mês a mês, com coluna de período e coluna de valor.</div>",
"        <div class=\"card-sub\">Cada verba gera sua própria tabela, separada mês a mês, com coluna de período e coluna de valor. Agora também é possível incluir colunas adicionais personalizadas, inclusive com fórmulas como (B+C) ou (BxD).</div>"
)

text = text.replace(
"  const STORAGE_KEY = 'cp_civeis_inicial_v2';",
"  const STORAGE_KEY = 'cp_civeis_inicial_v3';"
)

old_render = '''  function renderLaunches(){
    if (!state.lancamentos.length){
      launchesHost.innerHTML = '<div class="empty-state">Nenhum lançamento cadastrado ainda. Informe a verba e o período para gerar a tabela mensal do cálculo.</div>';
      return;
    }
    launchesHost.innerHTML = state.lancamentos.map(function(lancamento, index){
      const rows = lancamento.linhas.map(function(linha, rowIndex){
        return '' +
          '<tr>' +
            '<td>' + esc(linha.periodo) + '</td>' +
            '<td><input type="number" step="0.01" min="0" data-launch-index="' + index + '" data-row-index="' + rowIndex + '" class="valor-input" value="' + esc(linha.valor) + '" placeholder="0,00"></td>' +
          '</tr>';
      }).join('');
      return '' +
        '<div class="launch-card">' +
          '<div class="launch-head">' +
            '<div>' +
              '<div class="launch-title">' + esc(lancamento.verba) + '</div>' +
              '<div class="launch-sub">Período: ' + esc(formatDateBR(lancamento.dataInicial)) + ' até ' + esc(formatDateBR(lancamento.dataFinal)) + ' — ' + lancamento.linhas.length + ' competência(s)</div>' +
            '</div>' +
            '<button type="button" class="btn-danger btnRemoverLancamento" data-launch-index="' + index + '">Remover verba</button>' +
          '</div>' +
          '<div class="table-wrap">' +
            '<table class="editor-table">' +
              '<thead><tr><th style="width:38%">Data</th><th>Valor</th></tr></thead>' +
              '<tbody>' + rows + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
    }).join('');
  }
'''
new_render = '''  function columnLetter(index){
    let value = index + 1;
    let result = '';
    while (value > 0){
      const mod = (value - 1) % 26;
      result = String.fromCharCode(65 + mod) + result;
      value = Math.floor((value - 1) / 26);
    }
    return result;
  }

  function normalizeLaunch(lancamento){
    lancamento.colunas = Array.isArray(lancamento.colunas) ? lancamento.colunas : [{ id:'valor', nome:'Valor', tipo:'manual' }];
    if (!lancamento.colunas.length) lancamento.colunas = [{ id:'valor', nome:'Valor', tipo:'manual' }];
    lancamento.linhas = Array.isArray(lancamento.linhas) ? lancamento.linhas : [];
    lancamento.linhas = lancamento.linhas.map(function(linha){
      const novaLinha = Object.assign({ periodo: linha.periodo || '', valor: linha.valor || '' }, linha);
      lancamento.colunas.forEach(function(coluna, idx){
        const key = coluna.id || ('col_' + idx);
        if (key === 'valor'){
          if (novaLinha.valor === undefined) novaLinha.valor = '';
        } else if (novaLinha[key] === undefined){
          novaLinha[key] = '';
        }
      });
      return novaLinha;
    });
    return lancamento;
  }

  function getNumericValue(linha, colunaId){
    const raw = colunaId === 'valor' ? linha.valor : linha[colunaId];
    const num = Number(String(raw === undefined ? '' : raw).replace(',', '.'));
    return Number.isFinite(num) ? num : 0;
  }

  function evaluateFormula(formula, valuesByLetter){
    const expression = String(formula || '').toUpperCase().replace(/\s+/g, '').replace(/X/g, '*').replace(/,/g, '.').replace(/([A-Z]+)/g, function(match){
      return Object.prototype.hasOwnProperty.call(valuesByLetter, match) ? '(' + valuesByLetter[match] + ')' : '(0)';
    });
    if (!expression) return '';
    if (/[^0-9+\-*/().]/.test(expression)) return 'Fórmula inválida';
    try {
      const result = Function('return ' + expression)();
      if (!Number.isFinite(result)) return '';
      return Number(result.toFixed(2));
    } catch (error){
      return 'Fórmula inválida';
    }
  }

  function recalculateLaunch(lancamento){
    normalizeLaunch(lancamento);
    lancamento.linhas.forEach(function(linha){
      const valuesByLetter = { A: 0 };
      lancamento.colunas.forEach(function(coluna, idx){
        const letter = columnLetter(idx + 1);
        const key = coluna.id || (idx === 0 ? 'valor' : 'col_' + idx);
        if (coluna.tipo === 'formula'){
          const resultado = evaluateFormula(coluna.formula || '', valuesByLetter);
          if (key === 'valor') linha.valor = resultado;
          else linha[key] = resultado;
          valuesByLetter[letter] = typeof resultado === 'number' ? resultado : 0;
        } else {
          const manual = getNumericValue(linha, key);
          valuesByLetter[letter] = manual;
        }
      });
    });
    return lancamento;
  }

  function renderLaunches(){
    state.lancamentos = state.lancamentos.map(normalizeLaunch).map(recalculateLaunch);
    if (!state.lancamentos.length){
      launchesHost.innerHTML = '<div class="empty-state">Nenhum lançamento cadastrado ainda. Informe a verba e o período para gerar a tabela mensal do cálculo.</div>';
      return;
    }
    launchesHost.innerHTML = state.lancamentos.map(function(lancamento, index){
      const headCols = ['<th style="width:20%">Data</th>'].concat(lancamento.colunas.map(function(coluna, idx){
        const meta = columnLetter(idx + 1) + ' — ' + coluna.nome + (coluna.tipo === 'formula' ? ' (' + esc(coluna.formula || '') + ')' : '');
        return '<th>' + esc(meta) + '</th>';
      })).join('');
      const rows = lancamento.linhas.map(function(linha, rowIndex){
        const valueCells = lancamento.colunas.map(function(coluna){
          const key = coluna.id === 'valor' ? 'valor' : coluna.id;
          const value = key === 'valor' ? linha.valor : linha[key];
          if (coluna.tipo === 'formula'){
            return '<td><input type="text" readonly value="' + esc(value) + '" placeholder="Calculado automaticamente"></td>';
          }
          return '<td><input type="number" step="0.01" data-launch-index="' + index + '" data-row-index="' + rowIndex + '" data-column-id="' + esc(key) + '" class="valor-input" value="' + esc(value) + '" placeholder="0,00"></td>';
        }).join('');
        return '<tr><td>' + esc(linha.periodo) + '</td>' + valueCells + '</tr>';
      }).join('');
      const badges = ['<span class="mini-badge">A = Data</span>'].concat(lancamento.colunas.map(function(coluna, idx){
        return '<span class="mini-badge">' + columnLetter(idx + 1) + ' = ' + esc(coluna.nome) + (coluna.tipo === 'formula' ? ' [' + esc(coluna.formula || '') + ']' : '') + '</span>';
      })).join('');
      return '' +
        '<div class="launch-card">' +
          '<div class="launch-head">' +
            '<div>' +
              '<div class="launch-title">' + esc(lancamento.verba) + '</div>' +
              '<div class="launch-sub">Período: ' + esc(formatDateBR(lancamento.dataInicial)) + ' até ' + esc(formatDateBR(lancamento.dataFinal)) + ' — ' + lancamento.linhas.length + ' competência(s)</div>' +
            '</div>' +
            '<button type="button" class="btn-danger btnRemoverLancamento" data-launch-index="' + index + '">Remover verba</button>' +
          '</div>' +
          '<div class="inline-tools">' +
            '<button type="button" class="btn btnAddManualCol" data-launch-index="' + index + '">Adicionar coluna manual</button>' +
            '<button type="button" class="btn btnAddFormulaCol" data-launch-index="' + index + '">Adicionar coluna fórmula</button>' +
            '<button type="button" class="btn btnRemoveCustomCol" data-launch-index="' + index + '">Remover última coluna</button>' +
          '</div>' +
          '<div>' + badges + '</div>' +
          '<div class="formula-note">Nas fórmulas, use as letras das colunas. Ex.: (B+C), (BxD), (B+C-D) ou ((B+C)*D).</div>' +
          '<div class="table-wrap">' +
            '<table class="editor-table">' +
              '<thead><tr>' + headCols + '</tr></thead>' +
              '<tbody>' + rows + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
    }).join('');
  }
'''
text = text.replace(old_render, new_render)

text = text.replace(
"  function totalLancamento(lancamento){\n    return lancamento.linhas.reduce(function(total, linha){\n      return total + (Number(linha.valor || 0) || 0);\n    }, 0);\n  }\n",
"  function totalLancamento(lancamento, colunaId){\n    const alvo = colunaId || 'valor';\n    return lancamento.linhas.reduce(function(total, linha){\n      return total + getNumericValue(linha, alvo);\n    }, 0);\n  }\n"
)

text = text.replace(
"    state.lancamentos = Array.isArray(data.lancamentos) ? data.lancamentos : [];",
"    state.lancamentos = (Array.isArray(data.lancamentos) ? data.lancamentos : []).map(normalizeLaunch).map(recalculateLaunch);"
)

text = text.replace(
"      rows.push({ periodo: monthLabel(year, month), valor: '' });",
"      rows.push({ periodo: monthLabel(year, month), valor: '' });"
)

old_report = '''    const lancamentosHtml = data.lancamentos.length ? data.lancamentos.map(function(lancamento){
      const linhasHtml = lancamento.linhas.map(function(linha){
        return '<tr><td class="center">' + esc(linha.periodo) + '</td><td class="right">' + esc(formatCurrencyBR(linha.valor || 0)) + '</td></tr>';
      }).join('');
      return '' +
        '<div class="report-launch">' +
          '<h3>' + esc(lancamento.verba) + '</h3>' +
          '<table class="report-table">' +
            '<thead><tr><th style="width:38%">Data</th><th>Valor</th></tr></thead>' +
            '<tbody>' + linhasHtml + '</tbody>' +
            '<tfoot><tr><td class="bold right">Total da verba</td><td class="bold right">' + esc(formatCurrencyBR(totalLancamento(lancamento))) + '</td></tr></tfoot>' +
          '</table>' +
        '</div>';
    }).join('') : '<div class="sec-title">Lançamentos</div><table class="report-table"><tbody><tr><td>Nenhuma verba lançada até o momento.</td></tr></tbody></table>';
'''
new_report = '''    const lancamentosHtml = data.lancamentos.length ? data.lancamentos.map(function(lancamento){
      normalizeLaunch(lancamento);
      recalculateLaunch(lancamento);
      const headers = ['<th style="width:20%">Data</th>'].concat(lancamento.colunas.map(function(coluna, idx){
        return '<th>' + esc(columnLetter(idx + 1) + ' — ' + coluna.nome + (coluna.tipo === 'formula' ? ' (' + (coluna.formula || '') + ')' : '')) + '</th>';
      })).join('');
      const linhasHtml = lancamento.linhas.map(function(linha){
        const cols = lancamento.colunas.map(function(coluna){
          const valor = coluna.id === 'valor' ? linha.valor : linha[coluna.id];
          const exibicao = typeof valor === 'number' || !isNaN(Number(String(valor).replace(',', '.'))) ? formatCurrencyBR(valor || 0) : String(valor || '');
          return '<td class="right">' + esc(exibicao || '—') + '</td>';
        }).join('');
        return '<tr><td class="center">' + esc(linha.periodo) + '</td>' + cols + '</tr>';
      }).join('');
      const totalCells = lancamento.colunas.map(function(coluna){
        return '<td class="bold right">' + esc(formatCurrencyBR(totalLancamento(lancamento, coluna.id === 'valor' ? 'valor' : coluna.id))) + '</td>';
      }).join('');
      return '' +
        '<div class="report-launch">' +
          '<h3>' + esc(lancamento.verba) + '</h3>' +
          '<table class="report-table">' +
            '<thead><tr>' + headers + '</tr></thead>' +
            '<tbody>' + linhasHtml + '</tbody>' +
            '<tfoot><tr><td class="bold right">Total da verba</td>' + totalCells + '</tr></tfoot>' +
          '</table>' +
        '</div>';
    }).join('') : '<div class="sec-title">Lançamentos</div><table class="report-table"><tbody><tr><td>Nenhuma verba lançada até o momento.</td></tr></tbody></table>';
'''
text = text.replace(old_report, new_report)

text = text.replace(
"      linhas: buildMonthlyRows(dataInicial, dataFinal)\n    });",
"      colunas: [{ id:'valor', nome:'Valor', tipo:'manual' }],\n      linhas: buildMonthlyRows(dataInicial, dataFinal)\n    });"
)

old_input = '''  launchesHost.addEventListener('input', function(event){
    const target = event.target;
    if (!target.classList.contains('valor-input')) return;
    const launchIndex = Number(target.getAttribute('data-launch-index'));
    const rowIndex = Number(target.getAttribute('data-row-index'));
    if (!state.lancamentos[launchIndex] || !state.lancamentos[launchIndex].linhas[rowIndex]) return;
    state.lancamentos[launchIndex].linhas[rowIndex].valor = target.value;
    persistAndRefresh();
  });
'''
new_input = '''  launchesHost.addEventListener('input', function(event){
    const target = event.target;
    if (!target.classList.contains('valor-input')) return;
    const launchIndex = Number(target.getAttribute('data-launch-index'));
    const rowIndex = Number(target.getAttribute('data-row-index'));
    const columnId = target.getAttribute('data-column-id') || 'valor';
    if (!state.lancamentos[launchIndex] || !state.lancamentos[launchIndex].linhas[rowIndex]) return;
    if (columnId === 'valor') state.lancamentos[launchIndex].linhas[rowIndex].valor = target.value;
    else state.lancamentos[launchIndex].linhas[rowIndex][columnId] = target.value;
    recalculateLaunch(state.lancamentos[launchIndex]);
    persistAndRefresh();
  });
'''
text = text.replace(old_input, new_input)

old_click = '''  launchesHost.addEventListener('click', function(event){
    const target = event.target;
    if (!target.classList.contains('btnRemoverLancamento')) return;
    const launchIndex = Number(target.getAttribute('data-launch-index'));
    if (Number.isNaN(launchIndex)) return;
    state.lancamentos.splice(launchIndex, 1);
    persistAndRefresh();
  });
'''
new_click = '''  launchesHost.addEventListener('click', function(event){
    const target = event.target;
    const launchIndex = Number(target.getAttribute('data-launch-index'));
    if (target.classList.contains('btnRemoverLancamento')){
      if (Number.isNaN(launchIndex)) return;
      state.lancamentos.splice(launchIndex, 1);
      persistAndRefresh();
      return;
    }
    if (!state.lancamentos[launchIndex]) return;
    const lancamento = state.lancamentos[launchIndex];
    if (target.classList.contains('btnAddManualCol')){
      const nome = window.prompt('Informe o nome da nova coluna manual:');
      if (!nome || !nome.trim()) return;
      const id = 'col_' + Date.now() + '_' + Math.random().toString(16).slice(2, 6);
      lancamento.colunas.push({ id: id, nome: nome.trim(), tipo: 'manual' });
      lancamento.linhas.forEach(function(linha){ linha[id] = ''; });
      persistAndRefresh();
      return;
    }
    if (target.classList.contains('btnAddFormulaCol')){
      const nome = window.prompt('Informe o nome da coluna fórmula:');
      if (!nome || !nome.trim()) return;
      const formula = window.prompt('Informe a fórmula usando as letras das colunas. Ex.: (B+C) ou (BxD)');
      if (!formula || !formula.trim()) return;
      const id = 'col_' + Date.now() + '_' + Math.random().toString(16).slice(2, 6);
      lancamento.colunas.push({ id: id, nome: nome.trim(), tipo: 'formula', formula: formula.trim() });
      lancamento.linhas.forEach(function(linha){ linha[id] = ''; });
      recalculateLaunch(lancamento);
      persistAndRefresh();
      return;
    }
    if (target.classList.contains('btnRemoveCustomCol')){
      if (lancamento.colunas.length <= 1){ alert('A coluna Valor é obrigatória e não pode ser removida.'); return; }
      const removida = lancamento.colunas.pop();
      lancamento.linhas.forEach(function(linha){ delete linha[removida.id]; });
      recalculateLaunch(lancamento);
      persistAndRefresh();
    }
  });
'''
text = text.replace(old_click, new_click)

text = text.replace(
"  const initial = load();\n  fill(initial);\n  renderLaunches();\n  buildReport(collect());",
"  const initial = load();\n  fill(initial);\n  state.lancamentos = state.lancamentos.map(normalizeLaunch).map(recalculateLaunch);\n  renderLaunches();\n  buildReport(collect());"
)

p.write_text(text, encoding='utf-8')
print('[OK] updated html')
