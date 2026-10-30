/**
 * descontoApi.ts
 * --------------
 * Funções que chamam as rotas do DescontoController do backend
 * (prefixo /descontos - ver backend/src/controllers/DescontoController.ts).
 *
 * NOTA: este arquivo de API não fazia parte do Bloco F2 original, pois
 * o DescontoController só foi criado agora, no Bloco F10, junto com a
 * tela administrativa de gerenciamento de descontos.
 */

import { apiClient } from "./apiClient";
import type { Desconto, TipoVoo, PublicoDesconto } from "@/types";

export interface DadosCriacaoDesconto {
  nome: string;
  percentual: number;
  tipoVooAplicavel: TipoVoo;
  /** Público a que o desconto se aplica: GERAL (todos) ou VIP (exclusivo). Padrão no backend: GERAL. */
  publico?: PublicoDesconto;
}

export const descontoApi = {
  /** Lista todos os descontos (ativos e inativos). Apenas ADMIN. */
  listarTodos: (): Promise<Desconto[]> => apiClient.get<Desconto[]>("/descontos"),

  /** Lista apenas os descontos ativos. Rota pública. */
  listarAtivos: (): Promise<Desconto[]> =>
    apiClient.get<Desconto[]>("/descontos/ativos", { semAutenticacao: true }),

  /** Cria um novo desconto. Apenas ADMIN. */
  criar: (dados: DadosCriacaoDesconto): Promise<Desconto> =>
    apiClient.post<Desconto>("/descontos", dados),

  /** Desativa (remove logicamente) um desconto. Apenas ADMIN. */
  remover: (id: string): Promise<Desconto> =>
    apiClient.patch<Desconto>(`/descontos/${id}/remover`),
};
