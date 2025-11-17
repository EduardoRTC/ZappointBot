import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class ServicoGetAll {
    async execute(idEmpresa: string) {
        try {
            const response = await api(endpoints.servico.getAll(idEmpresa), 'GET')
            if(!response.ok) {
                throw new Error(response.statusText)
            }
            const data = response.json()
            return data
        }catch(err) {
            return err
        }
    }
}
