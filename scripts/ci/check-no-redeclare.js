#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const targetFiles = process.argv.slice(2);
if (!targetFiles.length) {
  console.error('Uso: node scripts/ci/check-no-redeclare.js <arquivo.js> [outro-arquivo.js...]');
  process.exit(1);
}

function lineFromIndex(source, index){
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (source[i] === '\n') line += 1;
  }
  return line;
}

function checkFile(filePath){
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    return ['ERRO: arquivo não encontrado: ' + filePath];
  }
  const source = fs.readFileSync(abs, 'utf8');
  const functionRegex = /function\s+([A-Za-z_$][\w$]*)\s*\(/g;
  const declarations = new Map();
  const errors = [];

  let match = functionRegex.exec(source);
  while (match) {
    const name = match[1];
    const line = lineFromIndex(source, match.index);
    const lines = declarations.get(name) || [];
    lines.push(line);
    declarations.set(name, lines);
    match = functionRegex.exec(source);
  }

  declarations.forEach(function(lines, name){
    if (lines.length > 1) {
      errors.push(
        'ERRO: declaração duplicada de função "' + name + '" em ' + filePath + ' (linhas: ' + lines.join(', ') + ')'
      );
    }
  });

  return errors;
}

const allErrors = targetFiles
  .map(checkFile)
  .reduce((acc, current) => acc.concat(current), []);

if (allErrors.length) {
  allErrors.forEach((entry) => console.error(entry));
  process.exit(1);
}

console.log('OK: sem funções redeclaradas nos arquivos verificados.');
