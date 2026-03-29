# Pacote de redesign — Cálculos Cíveis

Este pacote adiciona uma versão de protótipo navegável para o módulo de Cálculos Cíveis, mantendo a versão original intacta.

## Arquivo principal

- `app_calculos_civeis_redesign.html` → protótipo com o redesign aplicado.
- `app_calculos_civeis.html` → arquivo original preservado.

## O que foi incluído no redesign

1. Área operacional ampliada para desktop, sem a limitação visual do bloco de 880px.
2. Dashboard em duas colunas: edição principal à esquerda e resumo financeiro sticky à direita.
3. KPIs compactos no resumo: verbas, total geral, honorários e custas.
4. Navegação lateral por verbas, sincronizada com o seletor existente.
5. Bloco “Nova verba” mais separado do editor técnico.
6. Ajuda técnica recolhível nas fórmulas e observações operacionais.
7. Relatório mantido como aba separada, com aparência mais limpa.

## Arquivos novos

- `css/civeis-redesign.css`
- `js/modules/civeis-redesign-enhancer.js`
- `app_calculos_civeis_redesign.html`

## Observação de dados

A versão de redesign usa a chave de armazenamento local `cp_civeis_redesign_v1`, separada da versão original, para não sobrescrever o estado do módulo atual.
