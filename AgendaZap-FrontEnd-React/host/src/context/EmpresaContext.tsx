import { createContext, useContext, useState } from "react";
import api from "../services/api";

type TEmpresaContext = {
    empresaExiste: boolean | null;
    verificaEmpresa: (idEmpresa: string) => void;
}

export const EmpresaContext = createContext<TEmpresaContext | undefined>(undefined);

export const EmpresaProvider = ({ children }: { children: React.ReactNode }) => {
    const [empresaExiste, setEmpresaExiste] = useState<boolean | null>(null);

    const verificaEmpresa = async (idEmpresa: string) => {
        try {
            // ---------------------------
            // 1) PEGAR TOKEN DO LOCALSTORAGE
            // ---------------------------
            const token = localStorage.getItem("accessToken");
            if (!token) {
                console.log('não tem token');
                setEmpresaExiste(false);
            }

            // ---------------------------
            // 2) DECODE DO PAYLOAD DO JWT
            // // ---------------------------
            const base64Payload = token.split(".")[1];
            const jsonPayload = JSON.parse(atob(base64Payload));

            // Supondo que o campo no JWT seja "empresaId"
            const empresaIdToken = jsonPayload.empresaid;

            // ---------------------------
            // 3) COMPARAR COM O PARAMETRO
            // ---------------------------
            if (empresaIdToken !== idEmpresa) {
                console.log('entrou aqui');
                setEmpresaExiste(false);
                return
            }

            // ---------------------------
            // 4) CHAMAR API APÓS VALIDAÇÃO DO TOKEN
            // ---------------------------
            const reposta = await api(`empresa/${idEmpresa}`, "GET");

            if (reposta.status === 404 || !reposta.ok) {
                setEmpresaExiste(false);
            } else {
                setEmpresaExiste(true);
            }
        }
        catch (err) {
            console.log(err);
            setEmpresaExiste(false);
        }
    };

    const valor = {
        empresaExiste,
        verificaEmpresa
    };

    return (
        <EmpresaContext.Provider value={valor}>
            {children}
        </EmpresaContext.Provider>
    );
}

export const useEmpresa = () => {
    const context = useContext(EmpresaContext);
    if (!context) {
        throw new Error("useEmpresa deve ser usado dentro de um EmpresaProvider");
    }
    return context;
};
