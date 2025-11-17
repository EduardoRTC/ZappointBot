import ClientesPresenter from "../../presenters/ClientesPresenter";
import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class ClientesUpdate {
  async execute(idEmpresa: string, id: number, request: ClientesPresenter) {
    try {
      const response = await api(endpoints.clientes.update(idEmpresa,id), "PUT", request )
      if(!response.ok) {
        throw new Error(response.statusText)
      }
      const data = response.json()
      return data
    }catch(err) {
      throw err
    }
  }
}
