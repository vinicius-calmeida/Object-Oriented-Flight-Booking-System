/**
 * AuthContext.tsx
 * ---------------
 * Contexto React responsável por guardar o ESTADO GLOBAL de
 * autenticação da aplicação: quem é o usuário logado (ou null, se
 * ninguém estiver logado), e as funções para login/logout/cadastro.
 *
 * POR QUE UM CONTEXT (E NÃO PROPS OU UM STATE LOCAL)?
 * A informação "quem está logado" é necessária em praticamente toda
 * a árvore de componentes: o Header (mostrar nome/avatar), as rotas
 * protegidas (bloquear acesso por tipo de usuário), as telas de
 * compra (saber se é VIP para liberar assento VIP), etc. Em vez de
 * passar essa informação manualmente de componente em componente via
 * props ("prop drilling"), o Context API do React permite que
 * qualquer componente da árvore acesse o usuário logado diretamente
 * através do hook useAuth() (Bloco F3, próximo arquivo).
 *
 * PERSISTÊNCIA:
 * O id do usuário logado é salvo no localStorage (chave
 * CHAVE_USUARIO_ID, definida em apiClient.ts) para que o login não
 * se perca ao recarregar a página. Ao montar o AuthProvider, tentamos
 * restaurar a sessão buscando os dados completos do usuário pelo id
 * salvo.
 */

import { createContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { authApi, usuarioApi, CHAVE_USUARIO_ID } from "@/api";
import type { Usuario } from "@/types";
import type { DadosCadastro, DadosLogin } from "@/api/authApi";

/** Formato dos dados e funções expostos pelo contexto de autenticação. */
export interface AuthContextType {
  /** Usuário atualmente logado, ou null se ninguém estiver logado. */
  usuario: Usuario | null;

  /** Indica se a aplicação ainda está tentando restaurar a sessão salva (evita "flash" de tela de login indevida). */
  carregando: boolean;

  /** Realiza login com e-mail/senha. Lança erro em caso de credenciais inválidas. */
  login: (dados: DadosLogin) => Promise<Usuario>;

  /** Cadastra um novo usuário e já efetua o login automaticamente. */
  cadastrar: (dados: DadosCadastro) => Promise<Usuario>;

  /** Encerra a sessão do usuário atual. */
  logout: () => void;

  /**
   * Atualiza os dados do usuário logado no contexto (sem precisar de
   * um novo login). Usado, por exemplo, após o upgrade para VIP, para
   * que a interface reflita imediatamente o novo tipo de conta.
   */
  atualizarUsuario: (usuarioAtualizado: Usuario) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  /**
   * Ao montar o Provider (uma única vez, quando a aplicação carrega),
   * tenta restaurar a sessão a partir do id salvo no localStorage.
   */
  useEffect(() => {
    async function restaurarSessao() {
      const usuarioIdSalvo = localStorage.getItem(CHAVE_USUARIO_ID);

      if (!usuarioIdSalvo) {
        setCarregando(false);
        return;
      }

      try {
        const usuarioRestaurado = await usuarioApi.buscarPorId(usuarioIdSalvo);
        setUsuario(usuarioRestaurado);
      } catch {
        // Se o usuário salvo não existir mais (ex: banco foi limpo),
        // removemos a sessão inválida do localStorage silenciosamente.
        localStorage.removeItem(CHAVE_USUARIO_ID);
      } finally {
        setCarregando(false);
      }
    }

    restaurarSessao();
  }, []);

  const login = useCallback(async (dados: DadosLogin): Promise<Usuario> => {
    const usuarioAutenticado = await authApi.login(dados);
    localStorage.setItem(CHAVE_USUARIO_ID, usuarioAutenticado.id);
    setUsuario(usuarioAutenticado);
    return usuarioAutenticado;
  }, []);

  const cadastrar = useCallback(async (dados: DadosCadastro): Promise<Usuario> => {
    const novoUsuario = await authApi.cadastrar(dados);
    // Após o cadastro, já efetuamos o login automaticamente, evitando
    // que o usuário precise digitar as credenciais de novo.
    localStorage.setItem(CHAVE_USUARIO_ID, novoUsuario.id);
    setUsuario(novoUsuario);
    return novoUsuario;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(CHAVE_USUARIO_ID);
    setUsuario(null);
  }, []);

  const atualizarUsuario = useCallback((usuarioAtualizado: Usuario) => {
    setUsuario(usuarioAtualizado);
  }, []);

  return (
    <AuthContext.Provider
      value={{ usuario, carregando, login, cadastrar, logout, atualizarUsuario }}
    >
      {children}
    </AuthContext.Provider>
  );
}
