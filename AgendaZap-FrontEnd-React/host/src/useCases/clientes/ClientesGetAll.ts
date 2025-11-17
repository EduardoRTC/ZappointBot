import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class ClientesGetAll {
    async execute(idEmpresa: string) {
        try {
            const response = await api(endpoints.clientes.getAll(idEmpresa), "GET")
            if (!response.ok) {
                throw new Error(`Erro ao buscar clientes : ${response.statusText}`)
            }

            const data = await response.json()
            return data
        } catch (error) {
            throw error
        }
    }
}
