import { Cargo } from "../enum/Cargo";

export interface ProfissionalSaudePresenter {
    tipoConselho: string;
    registroConselho: string;
    especialidade: string;
}

export class FuncionariosPresenter {
    id?: number;
    idEmpresa: string = '';
    idCargo: Cargo = Cargo.USER;
    nomeUsuario: string = '';
    nomeInteiro: string = '';
    cpf: string = '';
    senha: string = '';
    email?: string;
    statusUsuario: boolean = true;

    // 🔹 Campos de profissional de saúde
    profissionalSaude?: ProfissionalSaudePresenter;
}
