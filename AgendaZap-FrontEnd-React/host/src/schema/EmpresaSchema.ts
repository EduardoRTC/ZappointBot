import { z } from "zod";

export const EmpresaSchema = z.object({
    id: z.number().optional(),
    nomeFantasia: z
        .string()
        .min(2, "Nome fantasia é obrigatório")
        .max(200, "Máximo de 200 caracteres"),

    razaoSocial: z
        .string()
        .min(2, "Razão social é obrigatória")
        .max(200, "Máximo de 200 caracteres"),

    cnpj: z
        .string()
        .min(14, "CNPJ inválido")
        .max(18, "CNPJ inválido"), // permite máscara (00.000.000/0000-00)

    tipoEmpresa: z
        .number({
            required_error: "Tipo de empresa é obrigatório",
            invalid_type_error: "Tipo de empresa deve ser um número",
        }),

    email: z
        .string()
        .email("E-mail inválido")
        .optional()
        .or(z.literal("")), // aceita campo vazio

    telefone: z
        .string()
        .min(8, "Telefone é obrigatório")
        .max(20, "Telefone inválido"),

    cep: z
        .string()
        .min(8, "CEP é obrigatório")
        .max(9, "CEP inválido"),

    logradouro: z
        .string()
        .min(2, "Logradouro é obrigatório")
        .max(255, "Máximo de 255 caracteres"),

    numero: z
        .string()
        .min(1, "Número é obrigatório")
        .max(20, "Máximo de 20 caracteres"),

    complemento: z
        .string()
        .max(255, "Máximo de 255 caracteres")
        .optional()
        .or(z.literal("")),

    sigla: z
        .string()
        .min(2, "Sigla é obrigatória")
        .max(5, "Máximo de 5 caracteres"),

    nomeMunicipio: z
        .string()
        .min(2, "Município é obrigatório")
        .max(100, "Máximo de 100 caracteres"),
});

export type EmpresaSchemaType = z.infer<typeof EmpresaSchema>;
