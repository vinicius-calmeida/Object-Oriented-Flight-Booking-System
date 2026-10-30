/**
 * vooApi.ts
 * ---------
 * Funções que chamam as rotas do VooController do backend
 * (prefixo /voos - ver backend/src/controllers/VooController.ts).
 */

import { apiClient } from "./apiClient";
import type { Voo, TipoVoo } from "@/types";

export interface DadosCadastroVoo {
  origem: string;
  destino: string;
  dataHora: string; // formato ISO (ex: new Date().toISOString())
  precoBase: number;
  tipoVoo: TipoVoo;
  quantidadeAssentos: number;
}

export interface DadosAlteracaoVoo {
  origem?: string;
  destino?: string;
  dataHora?: string;
  precoBase?: number;
}

export const vooApi = {
  /**
   * Lista todos os voos, ou filtra por origem/destino se informados.
   * Rota pública por padrão (não envia x-user-id).
   *
   * Se "incluirRealizados" for true, a chamada passa a enviar o header
   * x-user-id (necessário porque o backend só atende esse parâmetro
   * para usuários ADMIN) - usado pela tela de gerenciamento de voos,
   * que precisa ver o histórico completo, incluindo voos já realizados.
   */
  listar: (filtros?: {
    origem?: string;
    destino?: string;
    incluirRealizados?: boolean;
  }): Promise<Voo[]> => {
    const parametros = new URLSearchParams();
    if (filtros?.origem) parametros.set("origem", filtros.origem);
    if (filtros?.destino) parametros.set("destino", filtros.destino);
    if (filtros?.incluirRealizados) parametros.set("incluirRealizados", "true");

    const query = parametros.toString();
    return apiClient.get<Voo[]>(`/voos${query ? `?${query}` : ""}`, {
      semAutenticacao: !filtros?.incluirRealizados,
    });
  },

  /** Busca um voo específico pelo id. Rota pública. */
  buscarPorId: (id: string): Promise<Voo> =>
    apiClient.get<Voo>(`/voos/${id}`, { semAutenticacao: true }),

  /** Cadastra um novo voo. Apenas ADMIN (validado no backend). */
  cadastrar: (dados: DadosCadastroVoo): Promise<Voo> =>
    apiClient.post<Voo>("/voos", dados),

  /** Altera dados de um voo existente. Apenas ADMIN. */
  alterar: (id: string, dados: DadosAlteracaoVoo): Promise<Voo> =>
    apiClient.put<Voo>(`/voos/${id}`, dados),

  /** Marca o voo como ATRASADA. Apenas ADMIN. */
  marcarAtrasado: (id: string): Promise<Voo> =>
    apiClient.patch<Voo>(`/voos/${id}/atrasar`),

  /** Marca o voo como CANCELADA (reembolsa automaticamente todas as reservas). Apenas ADMIN. */
  marcarCancelado: (id: string): Promise<Voo> =>
    apiClient.patch<Voo>(`/voos/${id}/cancelar`),

  /** Remove um voo do sistema. Apenas ADMIN. */
  remover: (id: string): Promise<void> => apiClient.delete<void>(`/voos/${id}`),
};
