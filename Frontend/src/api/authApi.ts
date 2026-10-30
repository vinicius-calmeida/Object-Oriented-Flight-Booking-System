/**
 * authApi.ts
 * ----------
 * Funções que chamam as rotas do AuthController do backend
 * (prefixo /auth - ver backend/src/controllers/AuthController.ts).
 */

import { apiClient } from "./apiClient";
import type { Usuario, TipoUsuario } from "@/types";

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  tipo?: TipoUsuario;
}

export interface DadosLogin {
  email: string;
  senha: string;
}

export const authApi = {
  /**
   * Cadastra um novo usuário. Usa "semAutenticacao: true" porque,
   * neste momento, o usuário ainda não está logado (não existe um
   * x-user-id para enviar).
   */
  cadastrar: (dados: DadosCadastro): Promise<Usuario> =>
    apiClient.post<Usuario>("/auth/cadastro", dados, { semAutenticacao: true }),

  /** Autentica um usuário pelo e-mail e senha. */
  login: (dados: DadosLogin): Promise<Usuario> =>
    apiClient.post<Usuario>("/auth/login", dados, { semAutenticacao: true }),

  /** Logout simbólico (ver comentário no AuthService do backend). */
  logout: (usuarioId: string): Promise<{ mensagem: string }> =>
    apiClient.post<{ mensagem: string }>("/auth/logout", { usuarioId }),
};
