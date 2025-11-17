import { z } from "zod";

export const ServicoSchema = z.object({
  id: z.number().optional(),
  descricao: z
    .string()
    .min(3, "Descrição deve ter pelo menos 3 caracteres")
    .max(255, "Descrição deve ter no máximo 255 caracteres"),
  valor: z
    .number()
    .min(0, "Valor não pode ser negativo"),
  status: z.boolean(),
  tempoDuracao: z
    .string()
    .refine(
      (val) => /^([0-9]{1,2})(:[0-5][0-9])?$/.test(val),
      "Formato deve ser HH ou HH:MM"
    )
    .transform((val) => {
      // Aceita "2" → "02:00:00" ou "2:30" → "02:30:00"
      const [h, m] = val.split(":");
      const hora = h.padStart(2, "0");
      const minuto = m ? m.padStart(2, "0") : "00";
      return `${hora}:${minuto}:00`;
    }),
});

export type ServicoSchemaType = z.infer<typeof ServicoSchema>;
