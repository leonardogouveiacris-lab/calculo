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
