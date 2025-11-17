import AgendamentoPresenter from "../../presenters/AgendamentoPresenter";
import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class AgendamentoUpdate {
  async execute(idEmpresa: string, id: number,request: AgendamentoPresenter) {
    try {
        const response = await api(endpoints.agendamento.update(idEmpresa, id),"PUT", request)
        if(!response.ok) {
            throw response.statusText
        }
        const data = response.json()
        return data
    }catch(err) {
        throw err
    }
  }
}
