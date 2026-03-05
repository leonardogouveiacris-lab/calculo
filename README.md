# calculo

## Padrão de layout e design (CalculoPro)

Este repositório segue um padrão visual único para manter consistência entre módulos (ex.: Art. 916 e Solicitações).

### 1) Estrutura base de página
- `topbar` fixa com branding à esquerda e ações à direita.
- `hintbar` logo abaixo da topbar para observações curtas (ex.: impressão A4).
- `wrap` centralizado (`max-width: 1120px`) com espaçamento vertical padrão.
- `grid` central para cards/conteúdo (`minmax(0, 880px)`).

### 2) Tokens visuais
- Fundo: gradiente suave sobre `--bg`.
- Cartões: `--card`, borda `--border`, sombra `--shadow-soft`, raio `--radius`.
- Tipografia: `ui-sans-serif, system-ui`.
- Inputs e botões: raio `--radius-sm`, foco com `--focus`.
- Botão primário: `--accent` com contraste alto.

### 3) Cabeçalho / logo
- Usar a logo oficial:
  - `https://calculopro.com.br/wp-content/uploads/2024/11/logonegativa.png`
- Altura recomendada da logo no header: **30px**.

### 4) Títulos
- Título principal da tela (bloco de tabs/head): tamanho moderado, sem exagero visual.
- Títulos de cards: padrão compacto (aprox. 13.5px) para manter hierarquia limpa.

### 5) Relatórios (impressão)
- O relatório deve seguir o estilo institucional:
  - cabeçalho com logo + contato,
  - título central,
  - tabela principal,
  - rodapé institucional.
- `@media print` deve ocultar controles de tela (`.no-print`) e exibir apenas o relatório.
- Formato recomendado: A4.

### 6) Consistência entre módulos
- Novos sistemas devem reutilizar classes e comportamento visual do sistema principal.
- Evitar criar estilos isolados incompatíveis com o padrão.
- Sempre manter navegação de ida/volta entre módulos clara e simples.
