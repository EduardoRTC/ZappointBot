import { LoginLivro } from "../../components/Login/LoginLivro/LoginLivro"
import esqueciSenha from "../../assets/esqueci-senha.png"
import { Logo } from "../../components/Logo/Logo"
import "./EsqueciSenhaPage.css"
import { BotaoLink } from "../../components/BotaoLink/BotaoLink"
import { useParams } from "react-router-dom"
import { UseVerificaEmpresa } from "../../hooks/UseVerificaEmpresa"
import { PiArrowBendDownLeftThin } from "react-icons/pi";


const EsqueciSenhaPage = () => {
  const { idEmpresa } = useParams<{ idEmpresa: string }>();

  if (idEmpresa) {
    UseVerificaEmpresa(idEmpresa);
  }
  return (
    <div className="esqueci-senha">
      <LoginLivro imagem={esqueciSenha} legenda="Homem cartunesco digitando senha em um celular" >
        <div className="esqueci-senha__mensagem">
          <Logo />
          <div className="speech-bubble">
            Um e-mail foi enviado ao administrador informando sobre sua solicitação de redefinição de senha.
          </div>
          <div className="esqueci-senha__botao">
            <BotaoLink url={`/${idEmpresa}`}>Ok<PiArrowBendDownLeftThin size={30} /></BotaoLink>
          </div>
        </div>
      </LoginLivro>
    </div>
  )
}

export default EsqueciSenhaPage