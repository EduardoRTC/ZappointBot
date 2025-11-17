import { StatusAgendamento } from "../enum/StatusAgendamento";
import AgendamentoServicoPresenter from "./AgendamentoServicoPresenter";
import ClientesPresenter from "./ClientesPresenter";
import FuncionariosPresenter from "./FuncionariosPresenter";

export default class AgendamentoPresenter {
  idAgendamento?: number;
  statusAgendamento?: StatusAgendamento = StatusAgendamento.PENDENTE;
  dataHoraInicio: Date = new Date();
  dataHoraFim?: Date = new Date();
  observacao?: string;
  tempoDuracaoAgendamento?: string;
  valorTotal?: number = 0;
  idCliente: number = 0;
  cliente?: ClientesPresenter;
  idUsuario: number = 0;
  usuario?: FuncionariosPresenter;
  idServico: number[] = [];
  agendamentoServico?: AgendamentoServicoPresenter[] = [];
}
