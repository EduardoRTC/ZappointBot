import { isToday } from "date-fns"
import "./CalendarioCelula.css"
import { useCalendario } from "../../../context/CalendarioContext"

//falar pro Gustavo prototipar quando for o dia
export const CalendarioCelula = ({ dia }: { dia: Date }) => {
    const { dataSelecionada } = useCalendario()
    return (
        <div className={
            `calendario-celula
             ${isToday(dia) ? "hoje" : ""}
            ${dia.getMonth() === dataSelecionada.getMonth() ? "" : "calendario-celula--fora-mes"} `}>
            <div className={`calendario-celula__dia ${dia.getMonth() === dataSelecionada.getMonth() ? "" : "calendario-celula__dia--fora-mes"}`}>
                {dia.getDate()}
            </div>
            <span className="calendario-celula__atendimentos"></span>
        </div>
    )
}
