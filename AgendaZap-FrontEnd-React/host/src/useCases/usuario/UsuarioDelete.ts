import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class UsuarioDelete {
    async execute(idEmpresa: string, id: number) {
        try {
            const response = await api(endpoints.usuario.delete(idEmpresa, id), "DELETE")
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
