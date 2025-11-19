import ClienteForm from "../../components/Forms/ClienteForm/ClienteForm";
import { UseVerificaEmpresa } from "../../hooks/UseVerificaEmpresa";

export default function ClienteCreatePage() {
  if (idEmpresa) {
      UseVerificaEmpresa(idEmpresa);
    }
  return (
    <ClienteForm/>
  )
}
