import AgendamentoPresenter from "../../presenters/AgendamentoPresenter";
import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class AgendamentoCreate {
    async execute(idEmpresa: string, request: AgendamentoPresenter) {
        try {
            console.log(request);
            const response = await api(endpoints.agendamento.create(idEmpresa), 'POST', request)
            if (!response.ok) {
                const text = await response.text(); // opcional: pega a resposta do body
                throw new Error(text || response.statusText);
            }

            const data = response.json()
            return data
        } catch (err) {
            throw err
        }
    }
}
