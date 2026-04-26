# Estrutura original identificada (baseline local)

## Entrada principal

- `app_erp_financeiro.html`
  - Abas: `dashboard`, `financeiro`, `clientes`, `produtos`, `vendas`, `relatorios`, `conciliacao`.
  - Carrega os módulos JS especializados por domínio.

## Módulos de estado e domínio

- `js/modules/erp-financeiro-state.js`
  - Entidades persistidas: `lancamentos`, `clientes`, `fornecedores`, `produtos`, `vendas`, `extratos`, `conciliacoes`, `historicoConciliacao`.
  - Storage key: `cp.erpFinanceiro.state`.

- `js/modules/erp-financeiro-lancamentos.js`
  - Cadastro e listagem de lançamentos financeiros.
  - Regras: entradas são tratadas como realizadas (sem contas a receber).
  - KPIs: receitas, despesas, contas a pagar, saldo.

- `js/modules/erp-financeiro-pessoas.js`
  - Cadastro unificado de clientes e fornecedores.

- `js/modules/erp-financeiro-produtos.js`
  - Catálogo de produtos/serviços e preços.

- `js/modules/erp-financeiro-vendas.js`
  - Pipeline comercial, pedidos e geração de receita realizada no financeiro.

- `js/modules/erp-financeiro-relatorios.js`
  - Relatórios consolidados, receitas, despesas, clientes, fornecedores, produtos e vendas.

- `js/modules/erp-financeiro-conciliacao.js`
  - Importação/gestão de extratos, sugestão de match, conciliação em lote e histórico.

- `js/modules/erp-financeiro-import.js`
  - Rotinas auxiliares de importação de dados.

- `js/modules/erp-financeiro-app.js`
  - Bootstrap/composição geral do app financeiro.
