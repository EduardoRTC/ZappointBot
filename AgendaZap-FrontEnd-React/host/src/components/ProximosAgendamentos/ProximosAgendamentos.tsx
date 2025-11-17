import "./ProximosAgendamentos.css"

export const ProximosAgendamentos = () => {
    return (
        <div className="container proximos-agendamentos">
            <h3 className="proximos-agendamentos__titulo">
                Próximos <br /> Agendamentos
            </h3>
            <div className="proximos-agendamentos__atendimentos">
                <div className="proximos-agendamentos__atendimento">
                    <div className="proximos-agendamentos__horario">
                        08:00
                    </div>
                    <div className="proximos-agendamentos__cliente">
                        Gustavo H. Deuner
                    </div>
                </div>
                <div className="proximos-agendamentos__atendimento">
                    <div className="proximos-agendamentos__horario">
                        09:00
                    </div>
                    <div className="proximos-agendamentos__cliente">
                        Everson Soucek
                    </div>
                </div>
                <div className="proximos-agendamentos__atendimento">
                    <div className="proximos-agendamentos__horario">
                        10:00
                    </div>
                    <div className="proximos-agendamentos__cliente">
                        Eduardo Rocha
                    </div>
                </div>
            </div>
        </div>
    )
}
