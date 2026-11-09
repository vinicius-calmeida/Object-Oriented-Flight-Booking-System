/**
 * reservaApi.ts
 * -------------
 * Funções que chamam as rotas do ReservaController do backend
 * (prefixo /reservas - ver backend/src/controllers/ReservaController.ts).
 */

import { apiClient } from "./apiClient";
import type { Reserva } from "@/types";

export interface DadosCriacaoReserva {
  vooId: string;
  assentoId: string;
}

export interface PassageiroDaCompra {
  assentoId: string;
  cpf: string;
}

export interface DadosCriacaoReservaMultipla {
  vooId: string;
  passageiros: PassageiroDaCompra[];
}

export const reservaApi = {
  /** Cria uma nova reserva (status inicial: PENDENTE_PAGAMENTO). */
  criar: (dados: DadosCriacaoReserva): Promise<Reserva> =>
    apiClient.post<Reserva>("/reservas", dados),

  /** Cria múltiplas reservas de uma vez (até 4 passageiros, cada um com seu CPF). */
  criarMultiplas: (dados: DadosCriacaoReservaMultipla): Promise<Reserva[]> =>
    apiClient.post<Reserva[]>("/reservas/multiplas", dados),

  /** Lista as reservas do usuário autenticado ("Minhas Reservas"). */
  listarMinhas: (): Promise<Reserva[]> =>
    apiClient.get<Reserva[]>("/reservas/minhas"),

  /** Lista todas as reservas do sistema. Apenas ADMIN (usado em relatórios). */
  listarTodas: (): Promise<Reserva[]> => apiClient.get<Reserva[]>("/reservas"),

  /** Busca uma reserva específica pelo id. */
  buscarPorId: (id: string): Promise<Reserva> =>
    apiClient.get<Reserva>(`/reservas/${id}`),

  /** Confirma o pagamento simbólico da reserva (PENDENTE_PAGAMENTO -> CONFIRMADA). */
  confirmarPagamento: (id: string): Promise<Reserva> =>
    apiClient.post<Reserva>(`/reservas/${id}/confirmar-pagamento`),

  /** Cancela uma reserva, liberando o assento correspondente. */
  cancelar: (id: string): Promise<Reserva> =>
    apiClient.patch<Reserva>(`/reservas/${id}/cancelar`),
};
