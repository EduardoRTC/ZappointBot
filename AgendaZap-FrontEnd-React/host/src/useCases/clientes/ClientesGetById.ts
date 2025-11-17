import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class ClientesGetById {
  async execute(idEmpresa:string, id:number) {
    try {
        const response = await api(endpoints.clientes.getById(idEmpresa,id), 'GET')
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
