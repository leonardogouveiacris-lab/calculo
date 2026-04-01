# Arquitetura oficial de impressão (CPPrintLayout)

## Contrato único
Toda feature de impressão deve usar **somente** a API do core:

- `CPPrintLayout.createLayout(config)`
- `CPPrintLayout.createPage(layout, options)`
- `CPPrintLayout.appendSection(layout, section)`
- `CPPrintLayout.appendTable(layout, tableSpec)`
- `CPPrintLayout.measureAndPaginate(layout)`
- `CPPrintLayout.finalizeAndPrint(layout, options)`

## Regras obrigatórias

1. **Branding obrigatório**
   - `branding.logo`
   - `branding.header.{nome,tel,email}`
   - `branding.footer.{l1,l2,site,emp}`

2. **Área útil e margens de segurança**
   - `contentTop = content.offsetTop + contentTop + safetyTop`
   - `contentBottom = footer.offsetTop - safetyBottom`
   - Nenhum bloco pode ultrapassar `contentBottom`.

3. **Paginação determinística**
   - Blocos são medidos antes de fixação.
   - Tabelas quebram por linha com repetição de cabeçalho.
   - Header/Footer nunca podem ser cobertos por conteúdo.

4. **Tokens visuais centralizados**
   - Toda tipografia e espaçamento de impressão vivem em `css/print-report.css`.
   - Módulos não devem sobrescrever fonte/tamanho/bordas localmente.

## Smoke checks recomendados

- cenários com tabela longa (100+ linhas)
- textos extensos em seção
- mais de 3 páginas
- `measureAndPaginate(layout).issues.length === 0`
