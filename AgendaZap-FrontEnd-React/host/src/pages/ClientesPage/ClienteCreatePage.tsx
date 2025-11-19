import { useParams } from "react-router-dom";
import ClienteForm from "../../components/Forms/ClienteForm/ClienteForm";
import { UseVerificaEmpresa } from "../../hooks/UseVerificaEmpresa";

export default function ClienteCreatePage() {
  const { idEmpresa } = useParams<{ idEmpresa: string }>();
  if (idEmpresa) {
    UseVerificaEmpresa(idEmpresa);
  }
  return (
    <ClienteForm />
  )
}
