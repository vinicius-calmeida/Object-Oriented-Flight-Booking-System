/**
 * filtros.ts
 * ----------
 * Schema zod e tipo TypeScript que representam os filtros estruturados
 * extraídos pelo LLM a partir do texto livre do usuário.
 *
 * Por que validar com zod?
 * Modelos de linguagem podem devolver JSON inválido, campos com tipo
 * errado ou texto extra. A validação com schema transforma qualquer
 * resposta inesperada em um erro tratável, evitando que dados ruins
 * cheguem à camada de busca de voos.
 *
 * Os valores do enum classeAssento correspondem exatamente ao enum
 * ClasseAssento do projeto (ClasseAssento.ECONOMICO / ClasseAssento.VIP).
 */

import { z } from "zod";

export const FiltrosBuscaSchema = z.object({
  /** Cidade/aeroporto de origem. null quando o usuário não informar. */
  origem: z.string().min(1).nullable(),

  /** Cidade/aeroporto de destino. null quando o usuário não informar. */
  destino: z.string().min(1).nullable(),

  /**
   * Data da viagem no formato ISO (AAAA-MM-DD).
   * null quando o usuário não informar ou a data for ambígua.
   */
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD")
    .nullable(),

  /**
   * Classe do assento desejado.
   * Mapeado para os valores reais do enum ClasseAssento do projeto.
   * null quando o usuário não informar preferência.
   */
  classeAssento: z.enum(["ECONOMICO", "VIP"]).nullable(),

  /**
   * Preço máximo em reais.
   * null quando o usuário não informar limite de preço.
   */
  precoMaximo: z.number().positive().nullable(),
});

export type FiltrosBusca = z.infer<typeof FiltrosBuscaSchema>;
