/**
 * apiClient.ts
 * ------------
 * Wrapper central de todas as chamadas HTTP do frontend para a API
 * do backend. Centraliza 3 responsabilidades:
 *
 * 1. URL BASE: usamos "/api" como prefixo (ver vite.config.ts, que
 *    faz proxy de "/api/*" para "http://localhost:3000/*"). Isso
 *    evita problemas de CORS durante o desenvolvimento e mantém o
 *    código limpo de URLs absolutas espalhadas pela aplicação.
 *
 * 2. AUTENTICAÇÃO: conforme documentado no backend (ver
 *    autenticacaoMiddleware.ts), toda rota protegida exige o header
 *    "x-user-id". Este client lê o id do usuário logado a partir do
 *    localStorage (persistido pelo AuthContext, Bloco F3) e injeta
 *    automaticamente esse header em toda requisição - assim, nenhum
 *    componente de tela precisa se preocupar com isso manualmente.
 *
 * 3. TRATAMENTO DE ERRO PADRONIZADO: todos os Controllers do backend
 *    respondem erros no formato "{ erro: 'mensagem' }". Esta função
 *    centraliza a leitura desse formato e lança uma exceção JS comum
 *    (Error) com a mensagem certa, para que o restante do código
 *    trate erros de forma uniforme com try/catch.
 */

import type { ErroApi } from "@/types";

const URL_BASE = "/api";

/** Chave usada no localStorage para guardar o id do usuário autenticado. */
export const CHAVE_USUARIO_ID = "sistema-passagens:usuarioId";

/** Lê o id do usuário logado, salvo no localStorage pelo AuthContext. */
function obterUsuarioIdLogado(): string | null {
  return localStorage.getItem(CHAVE_USUARIO_ID);
}

/** Opções aceitas pela função de requisição, além das opções nativas do fetch. */
interface OpcoesRequisicao extends RequestInit {
  /** Se true, NÃO envia o header x-user-id mesmo que exista um usuário logado (usado em login/cadastro). */
  semAutenticacao?: boolean;
}

/**
 * Função central que executa toda chamada HTTP da aplicação.
 * Genérica em T: o tipo de retorno esperado do corpo da resposta (já
 * convertido de JSON para objeto JavaScript/TypeScript).
 */
async function requisitar<T>(
  caminho: string,
  opcoes: OpcoesRequisicao = {}
): Promise<T> {
  const { semAutenticacao, headers, ...restoOpcoes } = opcoes;

  const headersFinais: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (!semAutenticacao) {
    const usuarioId = obterUsuarioIdLogado();
    if (usuarioId) {
      headersFinais["x-user-id"] = usuarioId;
    }
  }

  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    ...restoOpcoes,
    headers: headersFinais,
  });

  // Respostas 204 (No Content) não têm corpo - retornamos undefined
  // diretamente, sem tentar fazer parse de JSON (o que geraria erro).
  if (resposta.status === 204) {
    return undefined as T;
  }

  const corpo = await resposta.json();

  if (!resposta.ok) {
    const erro = corpo as ErroApi;
    throw new Error(erro.erro ?? "Ocorreu um erro inesperado ao comunicar com o servidor.");
  }

  return corpo as T;
}

/**
 * Objeto exportado com um método para cada verbo HTTP usado na
 * aplicação, simplificando as chamadas nos arquivos de api/*Api.ts.
 */
export const apiClient = {
  get: <T>(caminho: string, opcoes?: OpcoesRequisicao) =>
    requisitar<T>(caminho, { ...opcoes, method: "GET" }),

  post: <T>(caminho: string, corpo?: unknown, opcoes?: OpcoesRequisicao) =>
    requisitar<T>(caminho, {
      ...opcoes,
      method: "POST",
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    }),

  put: <T>(caminho: string, corpo?: unknown, opcoes?: OpcoesRequisicao) =>
    requisitar<T>(caminho, {
      ...opcoes,
      method: "PUT",
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    }),

  patch: <T>(caminho: string, corpo?: unknown, opcoes?: OpcoesRequisicao) =>
    requisitar<T>(caminho, {
      ...opcoes,
      method: "PATCH",
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    }),

  delete: <T>(caminho: string, opcoes?: OpcoesRequisicao) =>
    requisitar<T>(caminho, { ...opcoes, method: "DELETE" }),
};
