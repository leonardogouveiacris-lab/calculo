# ERP Financeiro — Plano de migração e paridade funcional

Este documento define o baseline de migração do ERP Financeiro local e deve ser usado como referência obrigatória para validação de paridade funcional durante a implementação.

## 1) Estrutura original identificada

A estrutura original está inventariada em `references/financeiro-local/estrutura-original.md` e é composta por:

- página principal com abas de domínio (`app_erp_financeiro.html`);
- módulo de estado central (`erp-financeiro-state.js`);
- módulos por contexto: lançamentos, pessoas, produtos, vendas, relatórios, conciliação e importação.

### Entidades persistidas no estado atual

- `lancamentos`
- `clientes`
- `fornecedores`
- `produtos`
- `vendas`
- `extratos`
- `conciliacoes`
- `historicoConciliacao`

## 2) Tabela de mapeamento para entidades ERP atuais

| Origem (financeiro-local) | Entidade ERP alvo | Regra de migração | Critério de paridade |
|---|---|---|---|
| `lancamentos` | `financeiro_lancamentos` | Migrar campos financeiros e recalcular `valorLiquido` quando ausente (`valor + juros + multa - desconto`). | Totais por período (receitas, despesas, saldo) iguais ao baseline. |
| `clientes` | `cadastro_clientes` | Migração 1:1 de identificação e contato; manter status. | Quantidade de registros e busca por nome/documento equivalentes. |
| `fornecedores` | `cadastro_fornecedores` | Migração 1:1 com status e documento. | Quantidade de registros e filtros por status equivalentes. |
| `produtos` | `catalogo_produtos_servicos` | Preservar tipo (produto/serviço), preço e status. | Mesma cardinalidade e totais de tabela de preços. |
| `vendas` | `comercial_vendas` | Migrar pedidos/propostas e vínculo com cliente e itens. | Contagem de vendas e total vendido por período equivalentes. |
| `extratos` | `conciliacao_extratos` | Migrar linhas de extrato com data/descrição/valor normalizados. | Mesmo volume de linhas e soma por período. |
| `conciliacoes` | `conciliacao_vinculos` | Preservar status (`sugestao`, `conciliado`, `ignorado`) e score. | Mesmo número de itens conciliados/ignorados e taxa de conciliação. |
| `historicoConciliacao` | `conciliacao_historico` | Migrar timeline de eventos com tipo e detalhes. | Sequência de eventos auditáveis equivalente. |

## 3) Decisões de compatibilidade e itens descartados

## 3.1 Compatibilidade mantida

1. **Modelo por módulos de domínio**: manter separação por financeiro/cadastro/produtos/vendas/relatórios/conciliação.
2. **Normalização de datas**: persistência em ISO (`YYYY-MM-DD`) com exibição local (`DD/MM/YYYY`).
3. **Conciliação com sugestão assistida**: preservar status e operação em lote.
4. **KPIs financeiros principais**: receitas, despesas, contas a pagar e saldo.

## 3.2 Itens descartados / fora de escopo inicial

1. **Contas a receber** (explícito no legado): entradas seguem como **receita realizada**, sem carteira de títulos a receber.
2. **Workflows fiscais avançados** (NF-e/NFS-e, impostos automáticos): manter fora da migração inicial.
3. **Automação bancária externa** (integrações diretas): manter importação manual no primeiro ciclo.

## 4) Protocolo de validação de paridade funcional

Durante a implementação, validar obrigatoriamente:

1. **Paridade estrutural**: cada entidade da tabela de mapeamento deve existir e ser migrável.
2. **Paridade quantitativa**: comparar contagens e somatórios por período entre baseline e ERP alvo.
3. **Paridade comportamental**: conciliação, geração de relatórios e KPIs devem reproduzir o comportamento esperado.
4. **Paridade de regras**: entradas financeiras seguem como realizadas (sem contas a receber), salvo decisão formal de mudança de escopo.

## 5) Checklist de aceite

- [ ] Migração de dados concluída para todas as entidades mapeadas.
- [ ] Relatórios-chave batem com baseline (`consolidado`, `receitas`, `despesas`).
- [ ] Fluxo de conciliação reproduz status e histórico de ações.
- [ ] Decisões de descarte registradas e aprovadas pelo time.

> Este documento deve ser tratado como contrato de paridade até a conclusão da migração.
