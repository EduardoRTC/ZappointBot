import React, { ReactNode } from "react"
import "./LoginLivro.css"

type TLoginLivro = {
    imagem: string,
    legenda: string,
    children: ReactNode
}

export const LoginLivro: React.FC<TLoginLivro> = ({ imagem, legenda, children }) => {
    return (
        <div className="login">
            <div className="login__container container">
                <div className="login__container__livro">
                    <div className="login__container__imagem">
                        <img
                            className="login__container__calendario-imagem"
                            alt={legenda}
                            src={imagem}
                        />
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}
