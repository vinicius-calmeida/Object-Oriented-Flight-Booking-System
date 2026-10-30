/**
 * descontos.ts
 * ------------
 * Lógica de cálculo do melhor desconto aplicável a um voo, espelhada
 * de DescontoService.buscarMelhorDesconto() no backend.
 *
 * POR QUE ISSO EXISTE NO FRONTEND?
 * A regra "qual desconto vale" é decidida de verdade no backend, no
 * momento em que a reserva é criada (ReservaService.calcularValorFinal).
 * Mas para o usuário poder VER o preço com desconto ANTES de comprar
 * (no card de listagem, nos detalhes do voo), o frontend precisa
 * calcular a mesma coisa antecipadamente, usando os descontos ativos
 * (GET /descontos/ativos, rota pública) e o tipo de usuário logado.
 *
 * Isso é uma duplicação intencional e documentada da regra de
 * negócio: o cálculo "de verdade" (que define o valor cobrado) sempre
 * acontece no backend; este aqui é só para fins de exibição/preview,
 * e os dois devem permanecer sincronizados caso a regra mude.
 *
 * REGRA (idêntica ao backend):
 * - Um desconto GERAL é elegível para qualquer usuário.
 * - Um desconto VIP é elegível apenas para quem possui benefícios VIP.
 * - Entre todos os descontos ativos elegíveis para o tipo do voo,
 *   vale o de MAIOR PERCENTUAL (não acumula).
 */

import type { Desconto, TipoVoo } from "@/types";
import { PublicoDesconto } from "@/types";

/**
 * Verifica se um desconto é elegível para um usuário com (ou sem)
 * benefícios VIP. Espelha Desconto.aplicavelPara() do backend.
 */
function descontoElegivelPara(
  desconto: Desconto,
  usuarioPossuiBeneficiosVIP: boolean
): boolean {
  if (desconto.publico === PublicoDesconto.GERAL) return true;
  return usuarioPossuiBeneficiosVIP;
}

/**
 * Encontra o melhor desconto ativo, elegível para o usuário e
 * aplicável ao tipo de voo informado, entre uma lista de descontos
 * (normalmente vinda de descontoApi.listarAtivos()).
 *
 * Retorna null se nenhum desconto for elegível/aplicável.
 */
export function calcularMelhorDesconto(
  descontosAtivos: Desconto[],
  tipoVoo: TipoVoo,
  usuarioPossuiBeneficiosVIP: boolean
): Desconto | null {
  const elegiveis = descontosAtivos.filter(
    (desconto) =>
      desconto.ativo &&
      desconto.tipoVooAplicavel === tipoVoo &&
      descontoElegivelPara(desconto, usuarioPossuiBeneficiosVIP)
  );

  if (elegiveis.length === 0) return null;

  return elegiveis.reduce((melhor, atual) =>
    atual.percentual > melhor.percentual ? atual : melhor
  );
}

/** Calcula o preço final aplicando um desconto (ou retorna o preço base, se não houver desconto). */
export function calcularPrecoComDesconto(
  precoBase: number,
  desconto: Desconto | null
): number {
  if (!desconto) return precoBase;
  return precoBase - precoBase * (desconto.percentual / 100);
}
