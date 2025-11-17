import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EmpresaForm from "../../components/Forms/empresaForm/EmpresaForm";
import EmpresaGetById from "../../useCases/empresas/EmpresaGetById";
import { EmpresaPresenter } from "../../presenters/EmpresaPresenter";

export default function ConfiguracaoPage() {
  const { idEmpresa } = useParams<{ idEmpresa: string }>();
  const [empresa, setEmpresa] = useState<EmpresaPresenter | null>(null);
  const empresaGetById = new EmpresaGetById();

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        if (!idEmpresa) return;
        const data = await empresaGetById.execute(idEmpresa);
        setEmpresa(data);
      } catch (error) {
        console.error("Erro ao buscar empresa:", error);
      }
    };

    fetchEmpresa();
  }, [idEmpresa]);

  return <EmpresaForm empresa={empresa!} />;
}
