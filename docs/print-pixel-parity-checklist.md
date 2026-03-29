# Pixel parity checklist (Preview x Print)

Use este checklist em toda entrega de impressão. Critério: **preview e print devem ser visualmente idênticos** (com variação máxima de 1–2px por rasterização).

## 1) Art. 916
- [ ] Abrir aba Relatório sem travamento.
- [ ] Header visível em todas as páginas.
- [ ] Footer visível em todas as páginas.
- [ ] Nenhuma página com logo ampliada indevidamente.
- [ ] `CTRL+P` gera o mesmo conteúdo da área de preview.
- [ ] Botão de imprimir gera o mesmo conteúdo do `CTRL+P`.

## 2) Cálculos Cíveis
- [ ] Entrar no módulo sem bloquear cliques.
- [ ] Primeira página mantém título/meta iguais ao preview.
- [ ] Tabelas longas quebram sem sobrepor rodapé.
- [ ] Header/footer persistem em todas as páginas.
- [ ] Totalizadores não saem da área útil.

## 3) Depósito Recursal
- [ ] Preview e impressão usam o mesmo resultado calculado.
- [ ] Quebra por linhas da tabela sem cortar conteúdo.
- [ ] Subtotal aparece apenas no último bloco do depósito.
- [ ] Fontes/legendas aparecem em página válida sem overflow.

## 4) Solicitações
- [ ] Colunas preservadas no print sem desalinhamento.
- [ ] Quebra por linha mantém cabeçalho da tabela.
- [ ] Header/footer e logo consistentes entre páginas.

## 5) Regras globais
- [ ] `measureAndPaginate(layout).issues.length === 0` nos cenários smoke.
- [ ] Sem sobreposição entre `.content`, `.header` e `.footer`.
- [ ] `#reportRoot` e `#cpPrintHost` com mesmo shell visual.
