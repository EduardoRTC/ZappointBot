import { z } from "zod";

export const ClienteSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(2, "Nome é obrigatório").max(200, "Máximo de 100 caracteres"),
  telefone: z.string().min(8, "Telefone é obrigatório"),
  cpf: z.string().min(11, "CPF inválido"),
  observacao: z.string().optional(),
  dataNascimento: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  statusCliente: z.boolean(),
});


export type ClienteSchemaType = z.infer<typeof ClienteSchema>;
