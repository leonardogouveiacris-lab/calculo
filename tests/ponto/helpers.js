const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadPontoModules(){
  const context = { window: {} };
  context.global = context.window;
  vm.createContext(context);
  const files = [
    path.resolve(__dirname, '../../js/modules/ponto-calc-utils.js'),
    path.resolve(__dirname, '../../js/modules/ponto-calc-engine.js')
  ];
  for (const file of files){
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  }
  return {
    utils: context.window.CPPontoCalcUtils,
    engine: context.window.CPPontoCalcEngine
  };
}

module.exports = { loadPontoModules };
