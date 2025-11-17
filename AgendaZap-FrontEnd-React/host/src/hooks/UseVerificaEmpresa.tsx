import { useEffect } from "react"
import { useEmpresa } from "../context/EmpresaContext";
import { useNavigate } from "react-router-dom";

export const UseVerificaEmpresa = async (idEmpresa: string) => {
    const { empresaExiste, verificaEmpresa } = useEmpresa();
    const navigate = useNavigate()

    useEffect(() => {
        if (idEmpresa) {
            verificaEmpresa(idEmpresa);
        }
    }, [idEmpresa]);

    useEffect(() => {
        if (empresaExiste === false) {
            navigate("/notfound")
        }
    }, [empresaExiste, navigate])

};

