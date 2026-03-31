# Regressão manual — reordenação de colunas em lançamentos

## Objetivo
Validar que a movimentação lateral de colunas não essenciais mantém os dados das linhas e o cálculo das fórmulas.

## Política de bloqueio esperada
- `valor` permanece fixa no início da grade.
- `valor_devido` permanece fixa ao final da grade.
- Colunas padrão obrigatórias (`correcao_monetaria`, `valor_correcao`, `juros`, `valor_juros`) não devem ser movidas.
- Colunas adicionadas manualmente, de fórmula e índices adicionais podem ser movidas entre si.

## Fluxo de teste
1. Criar um lançamento com ao menos 2 competências.
2. Adicionar uma coluna manual (ex.: `Adicional`) e preencher valores.
3. Adicionar uma coluna fórmula (ex.: `Total parcial`) com referência por letra, por exemplo `(B+C)`.
4. Conferir o resultado inicial da fórmula em todas as linhas.
5. Mover a coluna manual e a coluna fórmula usando os botões `←` e `→` no cabeçalho.
6. Confirmar:
   - os valores preenchidos continuam presentes nas mesmas colunas (por `id`);
   - as fórmulas são recalculadas após cada movimento;
   - o resultado segue correto para a nova posição/letras.

## Observação de evolução
Como as fórmulas ainda usam referência por letra, a semântica pode mudar ao reordenar colunas.  
Melhoria futura sugerida: migração para referência por `id` de coluna com camada de compatibilidade para fórmulas legadas.

## Fonte única de verdade do módulo cível (produção)
- A entrada oficial em produção do módulo cível é `app_calculos_civeis.html`.
- A lógica de execução do módulo cível deve ser considerada a partir do script inline existente nesse arquivo.
- Artefatos legados/experimentais fora desse HTML não devem ser tratados como fonte oficial.

## Regressão visual/manual — resumo dos índices aplicados
Objetivo: garantir que o bloco de resumo de índices continue visível e completo após reordenação de colunas e rerender do lançamento.

### Pré-condições
1. Criar ou abrir lançamento que possua ao menos uma coluna de índice (`tipo = indice`).
2. Confirmar que a coluna de índice está visível no cabeçalho da grade (ex.: `(D) Correção Monetária`).

### Passos
1. Reordenar uma coluna não essencial (manual, fórmula ou índice adicional) usando `←`/`→`.
2. Acionar novo render (trocar lançamento no seletor e voltar, ou atualizar índices).
3. Validar o bloco **"Resumo dos índices aplicados"** no cartão do lançamento.

### Critérios de aceite
- O bloco **Resumo dos índices aplicados** está presente quando existir coluna de índice.
- Cada linha do resumo exibe o identificador da coluna (formato `Coluna: (X) Nome`).
- Cada linha do resumo exibe a **Fonte** do índice configurado para a coluna.
- O resumo não fica oculto por estilos opcionais (sem `display:none`, `visibility:hidden` ou `opacity:0` para `.index-summary`).
