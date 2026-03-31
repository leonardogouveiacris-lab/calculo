# Checklist pré-release — Relatório (Cálculos Cíveis)

Use esta lista antes de publicar qualquer alteração no relatório (`buildReport`) dentro de `app_calculos_civeis.html`.

## 1) Inventário de funções usadas pelo relatório

- [ ] Revisar `buildReport` e listar novas funções/objetos utilitários chamados por ele.
- [ ] Confirmar que toda função chamada está definida no mesmo escopo carregado pela página (`app_calculos_civeis.html`).
- [ ] Validar a guarda de execução (`assertBuildReportDependencies`) para garantir erro explícito em caso de referência ausente.

## 2) Verificação automática de referências indefinidas

- [ ] Abrir a aba **Relatório** com o DevTools aberto e garantir ausência de `ReferenceError`.
- [ ] Executar ao menos um ciclo completo: criar lançamento, atualizar valores e renderizar relatório.
- [ ] Confirmar que o log de erro não mostra mensagem de dependência ausente no `safeBuildReport`.

## 3) Evitar cópia parcial de `app_calculos_civeis.js`

- [ ] Ao portar trecho do arquivo `.js` para o script inline da página, portar também todos os helpers utilizados direta e indiretamente.
- [ ] Se a mudança trouxer novo helper, adicionar o nome em `BUILD_REPORT_SCOPE_DEPENDENCIES`.
- [ ] Sempre revisar encadeamentos de objeto (ex.: `CPPrintLayout.appendTable`) para evitar portar só a chamada e esquecer o provider.

## 4) Opcional — reduzir duplicação

- [ ] Avaliar extração de helper comum para regras compartilhadas entre render da tela e relatório (formatação, resumo, índices).
- [ ] Se extrair helper, manter API estável e uso explícito em ambos os fluxos.
- [ ] Registrar no PR quais pontos deixaram de ser duplicados.
