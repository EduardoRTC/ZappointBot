import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import ServicoForm from "../../components/Forms/ServicoForm/ServicoForm";
import { ServicosPresenter } from "../../presenters/ServicosPresenter";
import ServicoGetById from "../../useCases/servico/ServicoGetById";

export default function ServicosEditPage() {
    const [servico, setServico] = useState<ServicosPresenter>();
    const { idEmpresa, id } = useParams<{ idEmpresa: string; id: string }>();

    useEffect(() => {
        const fetchServico = async () => {
            try {
                const getServicoById = new ServicoGetById();
                const response = await getServicoById.execute(idEmpresa as string, Number(id));
                setServico(response);
            } catch (err: any) {
                toast.error(err?.message || "Erro ao carregar serviço");
            }
        };

        fetchServico();
    }, [idEmpresa, id]);

    return <ServicoForm servico={servico} />;
}
