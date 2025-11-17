import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class ServicoDelete {
    async execute(idEmpresa: string, id: number) {
        try {
            const response = await api(endpoints.servico.delete(idEmpresa, id), 'DELETE')
            if (!response.ok) {
                throw new Error(response.statusText)
            }
            const data = response.json()
            return data
        } catch (err) {
            throw err
        }
    }
}
