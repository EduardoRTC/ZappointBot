import { MdMedicalServices } from "react-icons/md";
import "./Cabecalho.css";

type TCabecalho = {
    nome: string;
};

export default function Cabecalho({ nome }: TCabecalho) {
    return (
        <header className="cabecalho">
            <div className="cabecalho__logo">
                <MdMedicalServices size={50} style={{ marginRight: 8, marginBottom: 8, marginLeft:8 }} />
                Sistema de Agendamento para clinicas
            </div>
            <div style={{ marginLeft: "auto", color: "#fff", fontWeight: "bold" }}>
                {nome}
            </div>
        </header>
    );
}
