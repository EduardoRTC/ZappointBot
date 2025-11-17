import { EmpresaPresenter } from "../../presenters/EmpresaPresenter";
import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class EmpresaUpdate {
    async execute(idEmpresa: string, request: EmpresaPresenter) {
        try {
            const response = await api(endpoints.empresa.update(idEmpresa), "PUT", request)
            if (!response.ok) {
                throw response.statusText
            }
            const data = response.json()
            return data
        } catch (err) {
            throw err
        }
    }
}
