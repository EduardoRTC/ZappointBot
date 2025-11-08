function startText() {
  return 'Seja bem-vindo(a), você já é cliente?\n1 - Sim\n2 - Não';
}

function menuText() {
  return 'O que gostaria de fazer hoje?\n1 - Agendar horário\n2 - Cancelar agendamento\n3 - Conferir meus agendamentos\n0 - Voltar';
}

function serviceText() {
  return 'Qual serviço gostaria de agendar?\n1 - Cabelo\n2 - Barba\n3 - Cabelo e Barba\n0 - Voltar';
}

function askCPFExistingText() {
  return 'Certo, me informe seu CPF.\n0 - Voltar';
}

function askCPFNewText() {
  return 'Então vamos realizar o seu cadastro!\nSerá bem rápido.\nPrimeiro me passe o seu CPF.\n0 - Voltar';
}

function askNameText() {
  return 'Certo!! Agora preciso do seu primeiro e último nome.\n0 - Voltar';
}

module.exports = {
  startText,
  menuText,
  serviceText,
  askCPFExistingText,
  askCPFNewText,
  askNameText
};
