import ClientesPresenter from "../../presenters/ClientesPresenter";
import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class ClientesCreate {
    async execute(idEmpresa: string, request: ClientesPresenter) {
        try {
            const response = await api(endpoints.clientes.create(idEmpresa), "POST", request)
            if (!response.ok) {
                throw new Error(response.statusText)
            }
            const data = response.json()
            return data
        } catch (err) {
            throw (err)
        }
    }
}
