import type { FuncionariosPresenter } from "../Presenters/FuncionariosPresenter";
import api from "../services/api";
import { endpoints } from "../useCases/endpoints/endpoints";

export default class UsuarioCreate {
    async execute(idEmpresa: string, request: FuncionariosPresenter) {
        try {
            const response = await api(endpoints.usuario.create(idEmpresa), "POST", request)
            if (!response.ok) {
                throw new Error(`Erro ao criar usuários: ${response.statusText}`);
            }
            const data = await response.json()
            return data
        } catch (error) {
            console.log(error);
            throw error
        }
    }
}
