import { useParams } from "react-router-dom";
import ServicoForm from "../../components/Forms/ServicoForm/ServicoForm";
import { UseVerificaEmpresa } from "../../hooks/UseVerificaEmpresa";

export default function ServicosCreatePage() {
    const { idEmpresa } = useParams<{ idEmpresa: string }>();
      if (idEmpresa) {
        UseVerificaEmpresa(idEmpresa);
      }
    return (
        <ServicoForm />
    )
}
