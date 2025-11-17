import { ServicosPresenter } from "../../presenters/ServicosPresenter";
import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class ServicoGetById {
    async execute(idEmpresa: string, id: number): Promise<ServicosPresenter> {
        const response = await api(endpoints.servico.getById(idEmpresa, id), "GET");
        if (!response.ok) {
            throw new Error("Erro ao buscar serviço");
        }
        return await response.json();
    }
}
