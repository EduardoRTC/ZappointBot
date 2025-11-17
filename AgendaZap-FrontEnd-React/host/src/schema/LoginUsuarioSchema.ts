import { z } from "zod";

export const LoginUsuarioSchema = z.object({
    nomeUsuario: z.string().min(1, "Informe o usuário"),
    senha: z.string().min(1, "Informe a senha"),
});

export type LoginUsuarioSchemaType = z.infer<typeof LoginUsuarioSchema>;
