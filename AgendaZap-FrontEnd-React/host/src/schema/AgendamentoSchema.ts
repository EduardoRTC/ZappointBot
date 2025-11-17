import { z } from "zod";

export const AgendamentoSchema = z.object({
  dataHoraInicio: z.date().nonoptional("Selecione uma data"),
  observacao: z.string().optional(),
  idCliente: z.number().min(1,"Selecione pelo menos um cliente"),
  idUsuario: z.number().min(1,"Selecione pelo menos um funcionário"),
  idServico: z.array(z.number()).min(1, "Selecione pelo menos um serviço"),
});

export type AgendamentoSchemaType = z.infer<typeof AgendamentoSchema>;





