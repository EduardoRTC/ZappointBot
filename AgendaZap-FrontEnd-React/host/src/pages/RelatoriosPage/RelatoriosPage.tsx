import Relatorios from "../../components/Relatorios/Relatorios";
import { UseVerificaEmpresa } from "../../hooks/UseVerificaEmpresa";

export default function RelatoriosPage() {
  const { idEmpresa } = useParams<{ idEmpresa: string }>();
  if (idEmpresa) {
    UseVerificaEmpresa(idEmpresa);
  }
  return (
    <Relatorios />
  )
}
