import { Link, useNavigate } from 'react-router-dom';
import { useErrorBoundary } from 'react-error-boundary';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Logo } from '../../Logo/Logo';
import api from '../../../services/api';

import {
    LoginUsuarioSchema,
    LoginUsuarioSchemaType,
} from "../../../schema/LoginUsuarioSchema";

import "./LoginForm.css";
import { TextField } from '@mui/material';

export const LoginFormUsuario = ({ idEmpresa }: { idEmpresa: string | undefined }) => {

    const navigate = useNavigate();
    const { showBoundary } = useErrorBoundary();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<LoginUsuarioSchemaType>({
        resolver: zodResolver(LoginUsuarioSchema),
        defaultValues: {
            nomeUsuario: "",
            senha: "",
        },
    });

    const onSubmit = async (data: LoginUsuarioSchemaType) => {
        try {
            const response = await api(`${idEmpresa}/autentificacao`, "POST", data);

            if (response.status === 200) {
                const body = await response.json();

                // 🔥 Salvar token no localStorage
                localStorage.setItem("accessToken", body.accessToken);


                return navigate(`/${idEmpresa}/home`);
            }

            if (response.status === 401 || response.status === 404) {
                setError("nomeUsuario", { message: "Nome de usuário ou senha incorreta" });
                setError("senha", { message: " " });
            }

            if (response.status === 400) {
                setError("nomeUsuario", { message: "Usuário foi desativado" });
                setError("senha", { message: " " });
            }
        }
        catch (error) {
            showBoundary(error);
        }
    };

    return (
        <form className="login__form" onSubmit={handleSubmit(onSubmit)}>
            <Logo />

            <div className="login__form__logar">

                <TextField
                    label='Login'
                    {...register("nomeUsuario")}
                    error={!!errors.nomeUsuario}
                    helperText={errors.nomeUsuario?.message}
                    fullWidth
                    size="small"
                />

                <TextField
                    label='Senha'
                    type="password"
                    {...register("senha")}
                    error={!!errors.senha}
                    helperText={errors.senha?.message}
                    fullWidth
                    size="small"
                />

                <Link
                    className="login__form__esqueci-senha"
                    to={`/${idEmpresa}/esqueciSenhaConfirma`}
                >
                    Esqueci minha senha
                </Link>

                <button className="login__form__botao" type="submit">
                    Entrar
                </button>

            </div>
        </form>
    );
};
