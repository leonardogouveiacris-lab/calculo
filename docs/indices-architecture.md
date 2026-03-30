# Arquitetura do módulo central de índices (`modulo-indices`)

## Objetivo
Centralizar tabelas de juros/correção e regras compostas para reuso entre apps (`deposito-recursal`, `solicitacoes`, `parcelamento-art916` e futuros consumidores).

## Estrutura
- `app_indices.html`: UI administrativa (CRUD, import/export, auditoria mínima).
- `js/modules/indices-state.js`: normalização/validação de schema e série temporal.
- `js/modules/indices-repository.js`: repositório local (localStorage) com interface estável para backend futuro.
- `js/modules/indices-import.js`: importação/exportação CSV e JSON.
- `js/modules/indices-service.js`: contrato interno `CPIndices`.
- `js/modules/indices-app.js`: wiring da UI e ações de gestão.

## Contrato interno (`CPIndices`)
- `listTables()`
- `getTable(tableId)`
- `saveTable(tableInput, { upsert })`
- `getValue(tableId, date)`
- `getRange(tableId, startDate, endDate)`
- `resolveRule(ruleId, params)`
- `setActiveTable(contextKey, tableId)`
- `getActiveTable(contextKey)`
- `ensureAutoTable(tableId, startISO, endISO)`
- `importTablesFromText(text, kind, updatedBy)`
- `exportTable(tableId, kind)`

## Catálogo de regras
- `poupanca_auto`
- `jam_auto`
- `ipca`
- `inpc`
- `igpm`
- `selic`
- `cdi`

Cada regra declara tabelas-base, fórmula, arredondamento e política de lacunas.

## Plano de migração (macro)
1. Módulo central em paralelo com feature flag `useCentralIndices`.
2. Depósito recursal migrado integralmente para `CPIndices`.
3. Demais módulos consumidores migram para o mesmo contrato.
4. Remover consultas externas diretas dos apps finais.

## Operação periódica
1. Abrir `app_indices.html`.
2. Importar CSV/JSON oficial (BCB/tribunal) ou sincronizar pelo consumidor com `ensureAutoTable`.
3. Revisar relatório de inconsistências.
4. Marcar tabela ativa por contexto (quando aplicável).
5. Validar versão, fonte e `updated_at` antes de publicar.
