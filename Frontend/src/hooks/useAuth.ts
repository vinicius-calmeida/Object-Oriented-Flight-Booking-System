/**
 * useAuth.ts
 * ----------
 * Hook customizado para consumir o AuthContext de forma segura.
 *
 * Por que um hook separado em vez de usar useContext(AuthContext)
 * diretamente em cada componente?
 * 1. Encapsula a verificação de "o contexto existe?" (um componente
 *    só pode usar este hook se estiver dentro de <AuthProvider>) -
 *    centralizamos esse erro aqui, com uma mensagem clara, em vez de
 *    deixar cada componente lidar com "undefined" silenciosamente.
 * 2. Fica mais simples de usar: "const { usuario, login } = useAuth();"
 *    em vez de "const contexto = useContext(AuthContext);" em todo
 *    componente.
 */

import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import type { AuthContextType } from "@/contexts/AuthContext";

export function useAuth(): AuthContextType {
  const contexto = useContext(AuthContext);

  if (contexto === undefined) {
    throw new Error(
      "useAuth() deve ser usado dentro de um <AuthProvider>. Verifique se o componente está envolvido pelo Provider em main.tsx ou App.tsx."
    );
  }

  return contexto;
}
