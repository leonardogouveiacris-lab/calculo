#!/usr/bin/env bash
set -euo pipefail

html_file="app_calculos_civeis.html"
module_file="js/modules/civeis-app.js"
legacy_file="js/modules/app_calculos_civeis.js"

if [[ ! -f "$html_file" ]]; then
  echo "ERRO: arquivo não encontrado: $html_file" >&2
  exit 1
fi

if [[ ! -f "$module_file" ]]; then
  echo "ERRO: módulo cível não encontrado: $module_file" >&2
  exit 1
fi

if [[ -f "$legacy_file" ]]; then
  echo "ERRO: implementação legada concorrente detectada: $legacy_file" >&2
  exit 1
fi

if grep -Eq '<script[^>]*defer[^>]*src="js/modules/civeis-app\.js"' "$html_file"; then
  :
else
  echo "ERRO: app_calculos_civeis.html deve carregar js/modules/civeis-app.js com defer." >&2
  exit 1
fi

if perl -0ne 'exit((/<script>\s*\(function\(\)\{/s) ? 0 : 1)' "$html_file"; then
  echo "ERRO: bloco JS inline extenso do módulo cível ainda está presente em $html_file." >&2
  exit 1
fi

node scripts/ci/check-no-redeclare.js "$module_file"

echo "OK: validação cível (módulo externo único, sem legado e sem inline extenso)."
