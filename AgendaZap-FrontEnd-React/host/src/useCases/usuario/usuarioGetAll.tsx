import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class UsuarioGetAll {
    async execute(idEmpresa: string) {
        try {
            const response = await api(endpoints.usuario.getAll(idEmpresa), "GET");

            if (!response.ok) {
                throw new Error(`Erro ao buscar usuários: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Erro em UsuarioGetAll:", error);
            throw error;
        }
    }
}
