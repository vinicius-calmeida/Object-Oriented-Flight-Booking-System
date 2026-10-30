/**
 * usuarioApi.ts
 * -------------
 * Funções que chamam as rotas do UsuarioController do backend
 * (prefixo /usuarios - ver backend/src/controllers/UsuarioController.ts).
 */

import { apiClient } from "./apiClient";
import type { Usuario, Notificacao } from "@/types";

export const usuarioApi = {
  /** Lista todos os usuários cadastrados. Apenas ADMIN. */
  listarTodos: (): Promise<Usuario[]> => apiClient.get<Usuario[]>("/usuarios"),

  /** Busca um usuário específico pelo id. */
  buscarPorId: (id: string): Promise<Usuario> =>
    apiClient.get<Usuario>(`/usuarios/${id}`),

  /** Remove um usuário do sistema. Apenas ADMIN. */
  remover: (id: string): Promise<void> =>
    apiClient.delete<void>(`/usuarios/${id}`),

  /** Consulta o valor simbólico cobrado pelo upgrade para VIP. Rota pública. */
  consultarValorUpgradeVip: (): Promise<{ valor: number }> =>
    apiClient.get<{ valor: number }>("/usuarios/upgrade-vip/valor", {
      semAutenticacao: true,
    }),

  /** Confirma o upgrade do usuário autenticado para VIP. */
  confirmarUpgradeVip: (): Promise<Usuario> =>
    apiClient.post<Usuario>("/usuarios/upgrade-vip"),

  /** Lista as notificações de um usuário específico. */
  listarNotificacoes: (usuarioId: string): Promise<Notificacao[]> =>
    apiClient.get<Notificacao[]>(`/usuarios/${usuarioId}/notificacoes`),

  /** Marca uma notificação específica como lida. */
  marcarNotificacaoComoLida: (notificacaoId: string): Promise<Notificacao> =>
    apiClient.patch<Notificacao>(`/usuarios/notificacoes/${notificacaoId}/lida`),
};
