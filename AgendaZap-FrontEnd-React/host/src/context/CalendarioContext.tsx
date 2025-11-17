import { createContext, useContext, useState } from "react";

type TCalendarioContext = {
    dataSelecionada: Date,
    setDataSelecionada:  React.Dispatch<React.SetStateAction<Date>>,
    modoVisualizacao: string,
    setModoVisualizacao: React.Dispatch<React.SetStateAction<string>>
}

export const CalendarioContext = createContext<TCalendarioContext | undefined>(undefined);

export const CalendarioProvider = ({ children }: { children: React.ReactNode }) => {
    const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date())
    const [modoVisualizacao, setModoVisualizacao] = useState<string>("mes")

    const valor = {
        dataSelecionada,
        setDataSelecionada,
        modoVisualizacao,
        setModoVisualizacao
    }
    return (
        <CalendarioContext.Provider value={valor}>{children}</CalendarioContext.Provider>
    )
}

export const useCalendario = () => {
    const context = useContext(CalendarioContext)
    if (!context) {
        throw new Error("useCalendario deve ser usado dentro de CalendarioProvider")
    }
    return context
}