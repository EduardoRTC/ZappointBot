import api from "../services/api";
import { endpoints } from "../useCases/endpoints/endpoints";

export default class UsuarioGetById {
    async execute(idEmpresa: string, id: number) {
        try {
            const response = await api(endpoints.usuario.getById(idEmpresa, id), "GET")
            if (!response.ok) {
                throw new Error(`Erro ao deletar usuários: ${response.statusText}`);
            }
            const data = await response.json()
            return data
        } catch (error) {
            console.log(error);
            throw error
        }
    }
}
