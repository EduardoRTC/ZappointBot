import calendario from "../../assets/Timeline-rafiki (2) 1.png";
import { useParams } from "react-router-dom";
import { UseVerificaEmpresa } from "../../hooks/UseVerificaEmpresa";
import { LoginLivro } from "../../components/Login/LoginLivro/LoginLivro";
import { ErrorBoundary } from "react-error-boundary";
import { TErrorFallBack } from "../../types/TErrorFallBack";
import { LoginFormUsuario } from "../../components/Login/LoginForm/LoginForm";
import "./LoginPage.css"
import { useMediaQuery } from "react-responsive";

const ErrorFallback: React.FC<TErrorFallBack> = ({ error, resetErrorBoundary }) => {
    return (
        <div style={{ color: "red", fontSize: "0.875rem" }}>
            Algo deu errado:{error.message}
            <button onClick={resetErrorBoundary}>Tente novamente</button>
        </div>
    )
}

export default function LoginPage() {
    const { idEmpresa } = useParams<{ idEmpresa: string }>();
    const isMobile = useMediaQuery({ query: '(min-width: 475px)' });
    // if (idEmpresa) {
    //     UseVerificaEmpresa(idEmpresa);
    // }

    if (isMobile) {
        return (
            <div className="fundo">
                <LoginLivro imagem={calendario} legenda="Duas pessoas cartunescas ajustando um calendário" >
                    <ErrorBoundary FallbackComponent={ErrorFallback}>
                        <LoginFormUsuario idEmpresa={idEmpresa} />
                    </ErrorBoundary>
                </LoginLivro>
                <div dangerouslySetInnerHTML={{ __html: "<!-- https://storyset.com/event>Event illustrations by Storyset -->" }} />
            </div >
        )
    }
    return (
        <div className="fundo">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
                <LoginFormUsuario idEmpresa={idEmpresa} />
            </ErrorBoundary>
            <div dangerouslySetInnerHTML={{ __html: "<!-- https://storyset.com/event>Event illustrations by Storyset -->" }} />
        </div >
    )

}
