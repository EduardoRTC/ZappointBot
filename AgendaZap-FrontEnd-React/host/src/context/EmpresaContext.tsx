import { createContext, useContext, useState } from "react";
import api from "../services/api";

type TEmpresaContext = {
    empresaExiste: boolean | null;
    verificaEmpresa: (idEmpresa: string) => void;
}


export const EmpresaContext = createContext<TEmpresaContext | undefined>(undefined);


export const EmpresaProvider = ({ children }: { children: React.ReactNode }) => {
    const [empresaExiste, setEmpresaExiste] = useState<boolean | null>(null)

    const verificaEmpresa = async (idEmpresa: string) => {
        try {
            const reposta = await api(`empresa/${idEmpresa}`, "GET")
            if (reposta.status == 404) {
                setEmpresaExiste(false)
            }
            if(!reposta.ok) {
                setEmpresaExiste(false)
            }
            else {
                setEmpresaExiste(true)
            }
        }
        catch(err){
            console.log(err);
        }
    }

    const valor = {
        empresaExiste,
        verificaEmpresa
    }

    return (
        <EmpresaContext.Provider value={valor}>
            {children}
        </EmpresaContext.Provider>
    )
}
export const useEmpresa = () => {
    const context = useContext(EmpresaContext);
    if (!context) {
        throw new Error("useEmpresa deve ser usado dentro de um EmpresaProvider");
    }
    return context;
};