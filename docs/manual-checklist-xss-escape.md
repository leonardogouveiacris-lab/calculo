# Checklist manual — validação de escape HTML/XSS

Objetivo: confirmar que campos de entrada/importação não executam HTML/JS ao renderizar telas e relatórios.

## Payloads mínimos

Use os payloads abaixo em campos textuais (nome, descrição, partes, observações, branding/header/footer, import JSON):

1. `<img src=x onerror=alert(1)>`
2. `<script>alert(1)</script>`
3. `" onmouseover="alert(1)`
4. `'><svg/onload=alert(1)>`

## Pontos de validação

### 1) Solicitações (`app_solicitacoes.html`)

- Preencher/importar valores com payloads nas colunas exibidas no relatório.
- Abrir relatório e conferir:
  - o conteúdo aparece como texto literal;
  - nenhuma tag é renderizada;
  - nenhum script/evento é executado.
- Repetir no fluxo de impressão.

### 2) Depósito recursal (`app_deposito_recursal.html`)

- Preencher/importar payloads em:
  - reclamante/reclamada/processo;
  - observação do depósito;
  - campos de auditoria e fontes, quando aplicável.
- Gerar relatório e validar que os textos foram escapados.
- Abrir impressão e confirmar ausência de execução de JS.

### 3) Parcelamento art. 916 (`app_parcelamento_art_916.html`)

- Inserir payloads em descrições de créditos/débitos/abatimentos/índices e campos gerais.
- Validar:
  - toast exibe texto puro (sem HTML interpretado);
  - tabelas do relatório exibem payload literal.

## Critério de aceite

- Nenhum `alert`, popup, redirecionamento, request inesperado ou execução de evento inline.
- DOM final não contém nós `<script>` vindos dos dados de entrada/importação.
- A renderização preserva dados como texto (escaped) em todos os módulos listados.
