# Regressão manual — colagem de dados (clipboard)

## Objetivo
Validar a colagem em massa (`Ctrl+V`/`Cmd+V`) na tabela mensal e nos campos de data, garantindo formato monetário, integridade numérica, recálculo e navegação por teclado.

## Escopo
- Tabela mensal (múltiplas linhas/competências).
- Campos de período/atualização.
- Desktop:
  - Windows (clipboard com `Ctrl+V`),
  - macOS (clipboard com `Cmd+V`).

## Pré-condições
1. Abrir a aplicação de cálculos civis em ambiente de homologação/local.
2. Carregar um caso com pelo menos **6 linhas** na tabela mensal.
3. Garantir que há colunas calculadas ativas (ex.: correção/juros/total) para validar recálculo.
4. Limpar cache do navegador (ou usar aba anônima) antes de cada rodada por sistema operacional.

## Massa de dados sugerida

### Bloco monetário (copiar e colar na tabela mensal)
> Observação: usar colagem de bloco tabular (linhas com quebra de linha).

```text
1234,5
2000
0
1000000,99
15,1
99999,999
```

### Bloco de datas (copiar para campos de período/atualização)
Testar cada formato abaixo individualmente:
- `01/02/2025`
- `1/2/2025`
- `2025-02-01`
- `02-2025` (quando aplicável a mês/ano)
- `fev/2025` (se houver suporte textual)

## Checklist principal

### Cenário 1 — Colar valores monetários em sequência na tabela mensal
1. Clicar na primeira célula monetária editável da tabela mensal.
2. Colar o bloco monetário em sequência com:
   - Windows: `Ctrl+V`
   - macOS: `Cmd+V`
3. Confirmar preenchimento contínuo das próximas linhas.
4. Verificar o formato final exibido em cada célula.

**Esperado:**
- Todos os valores colados são normalizados para `0.000,00`.
- Não aparece `NaN` na célula, totais, rodapé ou console.
- Linhas sem valor válido devem ficar como `0,00` (ou regra definida do produto), nunca `NaN`.

---

### Cenário 2 — Colar datas em formatos diferentes
1. Selecionar campo de **período**.
2. Colar cada formato de data da massa sugerida.
3. Repetir no campo de **atualização**.
4. Após cada colagem, desfocar o campo (`Tab` ou clique fora).

**Esperado:**
- Datas válidas são aceitas e normalizadas no padrão esperado da UI.
- Datas inválidas disparam validação amigável (mensagem, borda de erro ou bloqueio de avanço).
- Não ocorre quebra de recálculo nem `NaN` após alteração de período/atualização.

---

### Cenário 3 — Recalcular automaticamente após colagem
1. Após colar valores monetários, observar totais e colunas derivadas.
2. Alterar uma célula intermediária manualmente para confirmar novo recálculo.
3. Colar novamente um segundo bloco menor em 2–3 linhas.

**Esperado:**
- Recalculo dispara automaticamente após cada colagem.
- Totais/juros/correção refletem os novos dados sem necessidade de refresh.
- Não há divergência entre soma da grade e total apresentado.

---

### Cenário 4 — Navegação por Enter/Tab/setas após colagem
1. Depois da colagem, navegar pela grade usando `Enter`.
2. Repetir usando `Tab` e `Shift+Tab`.
3. Navegar com setas `↑ ↓ ← →`.
4. Editar uma célula no meio da navegação e confirmar foco seguinte.

**Esperado:**
- Ordem de foco permanece íntegra (sem “pular” célula indevida).
- Navegação vertical/horizontal respeita a malha atual da tabela.
- Nenhum travamento de foco após ação de paste.

## Matriz de execução (desktop)

| SO | Navegador | Clipboard shortcut | Status | Observações |
|---|---|---|---|---|
| Windows 11 | Chrome | Ctrl+V | ☐ | |
| Windows 11 | Edge | Ctrl+V | ☐ | |
| macOS 14+ | Chrome | Cmd+V | ☐ | |
| macOS 14+ | Safari | Cmd+V | ☐ | |

## Critérios de aprovação
- [ ] Formatação monetária consistente em `0.000,00` após colagem em massa.
- [ ] Ausência total de `NaN` na interface e no console.
- [ ] Recalculo automático correto após qualquer colagem/edição subsequente.
- [ ] Navegação por `Enter`/`Tab`/setas preservada.
- [ ] Comportamento equivalente em Windows e macOS (diferenças documentadas quando existirem).

## Evidências recomendadas
- Captura de tela antes/depois da colagem.
- Vídeo curto da navegação por teclado pós-colagem.
- Log de console limpo (sem erros) durante o fluxo.
- Registro das diferenças entre navegadores/SO na matriz.

## Opcional — roteiro para automação futura
Caso a equipe queira automatizar, priorizar:
1. Teste E2E de paste tabular em grade com validação de máscara monetária.
2. Teste parametrizado de parsing de data (múltiplos formatos).
3. Assert de ausência de `NaN` no DOM e nos totais.
4. Teste de navegação por teclado com simulação de `Enter`/`Tab`/setas após `paste`.
