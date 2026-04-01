(function(){
  var root = window.CPSolicitacoes = window.CPSolicitacoes || {};
  if (root.stateModuleLoaded) return;

  var DEFAULT_HEADER = {
    nome: 'Leonardo G. Cristiano',
    tel: '(14) 99606-7654',
    email: 'suporte@calculopro.com.br'
  };
  var DEFAULT_FOOTER = {
    l1: 'R. Mário Gonzaga Junqueira, 25-80',
    l2: 'Jardim Viaduto, Bauru - SP, 17055-210',
    site: 'www.calculopro.com.br',
    emp: 'CalculoPro Ltda. 51.540.075/0001-04'
  };

  var COLUMNS = ['Entrega em','Contato: Primeiro nome','Numero do Processo','Reclamante','Reclamada','Serviços','Total (Total)'];
  var ALIASES = {
    'Entrega em':['Entrega em','Data','Data Entrega','Entrega','Criado em'],
    'Contato: Primeiro nome':['Contato: Primeiro nome','Cliente','Contato','Nome'],
    'Numero do Processo':['Numero do Processo','Número do Processo','Processo','Nº do Processo','N° do Processo','Numero Processo'],
    'Reclamante':['Reclamante'],
    'Reclamada':['Reclamada','Negócios','Negocios','Etapa'],
    'Serviços':['Serviços','Servico','Serviço','Produtos'],
    'Total (Total)':['Total (Total)','Total','Valor','Valor/Moeda']
  };

  function createStore(){
    return {
      allRows: [],
      currentRows: [],
      currentClient: '(Todos)',
      selectedReclamadas: new Set(),
      competenciaAtual: '—',
      selectedRowIds: new Set(),
      sortMode: 'date_desc',
      header: Object.assign({}, DEFAULT_HEADER),
      footer: Object.assign({}, DEFAULT_FOOTER),
      logoDataUrl: ''
    };
  }

  function resetDataState(store){
    store.allRows = [];
    store.currentRows = [];
    store.currentClient = '(Todos)';
    store.selectedReclamadas.clear();
    store.selectedRowIds.clear();
    store.competenciaAtual = '—';
  }

  root.DEFAULT_HEADER = DEFAULT_HEADER;
  root.DEFAULT_FOOTER = DEFAULT_FOOTER;
  root.COLUMNS = COLUMNS;
  root.ALIASES = ALIASES;
  root.store = createStore();
  root.createStore = createStore;
  root.resetDataState = resetDataState;
  root.stateModuleLoaded = true;
})();
