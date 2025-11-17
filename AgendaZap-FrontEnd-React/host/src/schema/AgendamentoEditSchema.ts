import { z } from "zod";
import { StatusAgendamento } from "../enum/StatusAgendamento";

export const AgendamentoEditSchema = z.object({
    dataHoraInicio: z.date(),
    dataHoraFim: z.date(),
    observacao: z.string().optional(),
    idServico: z
        .array(z.number().int("ID de serviço inválido."))
        .min(1, "Selecione pelo menos um serviço."),
    idCliente: z.number().int("Cliente inválido."),
    idUsuario: z.number().int("Usuário inválido."),
    valorTotal: z
        .number()
        .nonnegative("O valor total não pode ser negativo."),
    statusAgendamento: z.nativeEnum(StatusAgendamento),
});

export type AgendamentoEditSchemaType = z.infer<typeof AgendamentoEditSchema>;
