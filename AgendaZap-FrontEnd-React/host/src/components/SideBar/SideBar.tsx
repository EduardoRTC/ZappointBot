import { Link, useParams } from "react-router-dom"
import './SideBar.css'
import { FaChartLine, FaRegCalendarCheck, FaWrench } from "react-icons/fa";
import { IoIosChatboxes } from "react-icons/io";
import { CiUser } from "react-icons/ci";
import { FaClipboardUser, FaGear } from "react-icons/fa6";

export const SideBar = () => {
    const { idEmpresa } = useParams<{ idEmpresa: string }>();


    return (    
        <div className="container side-bar">
            <ul className="side-bar__menu">
                <li><Link className="side-bar__item" to={`${idEmpresa}/home`}><FaRegCalendarCheck size={26} /><p className="side-bar__texto">Agenda</p></Link></li>
                <li><Link className="side-bar__item" to={`${idEmpresa}/chat`}><IoIosChatboxes size={26} /><p className="side-bar__texto">Chat</p></Link></li>
                <li><Link className="side-bar__item" to={`${idEmpresa}/funcionarios`}><FaClipboardUser size={26} /><p className="side-bar__texto">Funcionários</p></Link></li>
                <li><Link className="side-bar__item" to={`${idEmpresa}/clientes`}><CiUser size={26} /><p className="side-bar__texto">Clientes</p></Link></li>
                <li><Link className="side-bar__item" to={`${idEmpresa}/servico`}><FaWrench size={26} /><p className="side-bar__texto">Serviços</p></Link></li>
                <li><Link className="side-bar__item" to={`${idEmpresa}/relatorios`}><FaChartLine size={26} /><p className="side-bar__texto">Relatórios</p></Link></li>
                <li><Link className="side-bar__item" to={`${idEmpresa}/configuraçoes`}><FaGear size={26}/><p className="side-bar__texto">Configurações</p></Link></li>
            </ul>
        </div>
    )
}
