import { addDays, endOfMonth, startOfMonth, subDays } from "date-fns"
import { CalendarioCelula } from "../CalendarioCelula/CalendarioCelula"
import "./CalendarioMes.css"
import { useCalendario } from "../../../context/CalendarioContext"

export const CalendarioMes = () => {
  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
  const { dataSelecionada } = useCalendario()

  const inicioMes = startOfMonth(dataSelecionada)
  const fimMes = endOfMonth(dataSelecionada)

  const diaInicioSemana = inicioMes.getDay();
  const totalDiasMes = fimMes.getDate();
  const dias = []


  for (let i = diaInicioSemana - 1; i >= 0; i--) {
    dias.push(subDays(inicioMes, i + 1))
  }

  for (let i = 1; i <= totalDiasMes; i++) {
    dias.push(
      new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), i)
    )
  }

  while (dias.length % 7 !== 0) {
    dias.push(addDays(dias[dias.length - 1], 1))
  }

  return (
    <div className="calendario-mes">
      <div className="calendario-mes-dias-semana">
        {diasSemana.map((dia, i) => (
          <div className="calendario-mes-dia-semana" key={i}>
            {dia}
          </div>
        ))}
      </div>
      <div className="calendario-mes__corpo">
        {dias.map((dia, index) => (
          <CalendarioCelula key={index} dia={dia} />
        ))}
      </div>
    </div>
  )
}
