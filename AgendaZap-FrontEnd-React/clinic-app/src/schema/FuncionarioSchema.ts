import { z } from "zod";
import { Cargo } from "../enum/Cargo";

export const FuncionarioSchema = z.object({
    id: z.number().optional(),
    idEmpresa: z.string(),
    idCargo: z.nativeEnum(Cargo),
    nomeUsuario: z.string()
        .min(2, "Nome de usuário é obrigatório")
        .max(50, "Máximo de 50 caracteres"),
    nomeInteiro: z.string()
        .min(3, "Nome completo é obrigatório")
        .max(255, "Máximo de 255 caracteres"),
    cpf: z.string().min(11, "CPF inválido"),
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    email: z.string()
        .email("E-mail inválido")
        .optional(),
    statusUsuario: z.boolean(),
});

export type FuncionarioSchemaType = z.infer<typeof FuncionarioSchema>;
