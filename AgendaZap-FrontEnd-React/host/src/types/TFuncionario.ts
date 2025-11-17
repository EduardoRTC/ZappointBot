export type TFuncionario =  {
  id: number;
  idEmpresa: string;
  idCargo: number;
  nomeUsuario: string;
  nomeInteiro: string;
  cpf: string;
  senha: string;
  email?: string;
  statusUsuario: boolean;
}