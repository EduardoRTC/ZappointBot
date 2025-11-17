import AlteraUsuarioSenhaPresenter from "../../presenters/AlteraUsuarioSenhaPresenter";
import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class UsuarioUpdateSenhaPorNome {
  async execute(idEmpresa: string, request: AlteraUsuarioSenhaPresenter ) {
    try {
        const response = await api(endpoints.usuario.updateSenhaPorNome(idEmpresa), "PATCH", request)
        if(!response.ok) {
            throw new Error(`Erro ao atualizar senha: ${response.statusText}` )
        }
        const data = response.json()
        return data
    }catch(err) {
        throw err
    }
  }
}
