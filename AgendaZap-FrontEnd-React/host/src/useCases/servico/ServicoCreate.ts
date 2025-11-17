import { ServicosPresenter } from "../../presenters/ServicosPresenter";
import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class ServicoCreate {
  async execute(idEmpresa : string, request: ServicosPresenter) {
    try {
        const response = await api(endpoints.servico.create(idEmpresa), 'POST', request)
        if(!response.ok) {
            throw new Error(response.statusText)
        }
        const data = response.json()
        return data
    } catch(err) {
        throw err
    }
  }
}
