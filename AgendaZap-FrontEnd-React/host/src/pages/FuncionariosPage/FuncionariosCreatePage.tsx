import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FuncionarioForm from "../../components/Forms/UsuarioForm/FuncionarioForm";
import EmpresaGetById from "../../useCases/empresas/EmpresaGetById";
import { tipoEmpresa } from "../../enum/TipoEmpresa";
import { paths } from "../../paths";

export default function FuncionariosCreatePage() {
    const { idEmpresa } = useParams<{ idEmpresa: string }>();
    const [empresaTipo, setEmpresaTipo] = useState<tipoEmpresa | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmpresaTipo = async () => {
            if (!idEmpresa) return;
            try {
                const empresaService = new EmpresaGetById();
                const data = await empresaService.execute(idEmpresa);
                setEmpresaTipo(data.tipoEmpresa ?? tipoEmpresa.GENERICO);
            } catch (err) {
                console.error("Erro ao carregar empresa:", err);
                setEmpresaTipo(tipoEmpresa.GENERICO);
            }
        };
        fetchEmpresaTipo();
    }, [idEmpresa]);

    if (empresaTipo === null) {
        return <p>Carregando dados da empresa...</p>;
    }

    return <FuncionarioForm />;
}
