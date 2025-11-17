import { ServicosPresenter } from "../../presenters/ServicosPresenter";
import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class ServicoUpdate {
    async execute(idEmpresa: string, id: number, request: ServicosPresenter) {
        try {
            const response = await api(
                endpoints.servico.update(idEmpresa, id),
                "PUT",
                request
            );

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            const data = await response.json();
            return data;
        } catch (err) {
            throw err;
        }
    }
}
