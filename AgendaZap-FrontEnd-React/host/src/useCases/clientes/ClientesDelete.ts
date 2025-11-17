import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class ClientesDelete {
    async execute(idEmpresa: string, id: number) {
        try {
            const response = await api(endpoints.clientes.delete(idEmpresa, id), 'DELETE')
            if (!response.ok) {
                throw new Error(response.statusText)
            }

            const data = await response.json()
            return data
        } catch (error) {
            throw error
        }
    }
}
