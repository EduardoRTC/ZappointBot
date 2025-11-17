import egLogo from "../../assets/EgLogo.png"
import "./Cabecalho.css"

export const Cabecalho = () => {
  return (
    <header className="cabecalho">
      <div className="cabecalho__logo">
        <img className="cabecalho__eg" src={egLogo} alt="Logo com a letra E e a letra G" />
        Sistemas de<br/> Agendamento
      </div>
    </header >
  )
}
