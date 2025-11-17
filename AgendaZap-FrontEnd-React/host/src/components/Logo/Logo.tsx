import roboZapeando from "../../assets/ZapeandoBranco.png"
import "./Logo.css"

export const Logo = () => {
    return (
        <div className="logo">
            <img alt="Robô com antenas sorrindo" className="logo__imagem" src={roboZapeando} />
            <h1 className="logo__titulo">AgendaZap</h1>
        </div>
    )
}
