import api from "../../services/api";
import { endpoints } from "../endpoints/endpoints";

export default class EmpresaGetById {
  async execute(id: string ) {
    try {
        const response = await api(endpoints.empresa.getById(id),"GET")
        if(!response.ok) {
            throw new Error(response.statusText)
        }
        const data = response.json()
        return data
    }catch(err) {
        throw err
    }
  }
}
