import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class AgendamentoGetAll {
  async execute(idEmpresa: string, idUsuario?: string) {
    try {
      // monta a query string apenas se houver idUsuario
      const query = idUsuario ? `?IdUsuario=${idUsuario}` : "";
      const url = endpoints.agendamento.getAll(idEmpresa) + query;

      const response = await api(url, "GET");

      if (!response.ok) {
        throw new Error(`Erro ao buscar agendamentos: ${response.statusText}`);
      }

      const data = await response.json(); // await adicionado aqui
      return data;
    } catch (err) {
      console.error("Erro em AgendamentoGetAll:", err);
      throw err;
    }
  }
}
