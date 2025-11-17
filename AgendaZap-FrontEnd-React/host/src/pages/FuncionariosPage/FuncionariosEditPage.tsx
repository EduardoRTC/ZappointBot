import { useParams } from "react-router-dom";
import FuncionarioForm from "../../components/Forms/UsuarioForm/FuncionarioForm";
import UsuarioGetById from "../../useCases/usuario/UsuarioGetById";
import FuncionariosPresenter from "../../presenters/FuncionariosPresenter";
import { useEffect, useState } from "react";

export default function FuncionariosEditPage() {
    const { idEmpresa, id } = useParams<{ idEmpresa: string; id: string }>();
    const [funcionario, setFuncionario] = useState<FuncionariosPresenter | null>(null);
    const usuarioGetById = new UsuarioGetById();

    useEffect(() => {
        const fetchFuncionario = async () => {
            try {
                if (!idEmpresa || !id) return;
                const data = await usuarioGetById.execute(idEmpresa, Number(id));
                setFuncionario(data);
            } catch (error) {
                console.error("Erro ao buscar funcionário:", error);
            }
        };

        fetchFuncionario();
    }, [idEmpresa, id]);
    return (
        <FuncionarioForm funcionario={funcionario!} />
    )
}
