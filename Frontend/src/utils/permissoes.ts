/**
 * permissoes.ts
 * -------------
 * No backend, a lógica de "isso é VIP?", "isso é Admin?" é resolvida
 * por POLIMORFISMO: cada subclasse de Usuario (UsuarioPadrao,
 * UsuarioVIP, Admin) implementa seus próprios métodos
 * possuiBeneficiosVIP() e isAdmin().
 *
 * Aqui no frontend, como recebemos os dados já serializados em JSON
 * (uma única interface "Usuario" com campo "tipo" discriminador, ver
 * src/types/entidades.ts), replicamos a MESMA REGRA DE NEGÓCIO através
 * de funções auxiliares simples, e não de métodos de classe.
 *
 * Isso é puramente uma decisão de implementação prática - a regra de
 * negócio em si ("Admin possui tudo que VIP possui") é idêntica à do
 * backend, apenas expressa de forma funcional em vez de orientada a
 * objetos, já que não há necessidade de reconstruir toda a hierarquia
 * de classes apenas para exibir/esconder botões na interface.
 */

import { TipoUsuario } from "@/types";
import type { Usuario } from "@/types";

/** Equivalente a Usuario.possuiBeneficiosVIP() do backend. */
export function possuiBeneficiosVIP(usuario: Usuario | null): boolean {
  if (!usuario) return false;
  return usuario.tipo === TipoUsuario.VIP || usuario.tipo === TipoUsuario.ADMIN;
}

/** Equivalente a Usuario.isAdmin() do backend. */
export function isAdmin(usuario: Usuario | null): boolean {
  if (!usuario) return false;
  return usuario.tipo === TipoUsuario.ADMIN;
}

/** Equivalente a "usuario instanceof UsuarioPadrao" no backend. */
export function ehUsuarioPadrao(usuario: Usuario | null): boolean {
  if (!usuario) return false;
  return usuario.tipo === TipoUsuario.PADRAO;
}

/**
 * Equivalente a Usuario.getPermissoes() do backend. Retorna uma lista
 * de identificadores de permissão, usada principalmente para fins de
 * exibição/depuração na interface (ex: tela de perfil do usuário).
 */
export function getPermissoes(usuario: Usuario | null): string[] {
  if (!usuario) return [];

  const permissoesBase = [
    "LOGIN",
    "VISUALIZAR_VOOS",
    "COMPRAR_PASSAGEM_ECONOMICA",
    "VISUALIZAR_RESERVAS",
    "CANCELAR_RESERVA",
  ];

  if (usuario.tipo === TipoUsuario.PADRAO) {
    return [...permissoesBase, "SOLICITAR_UPGRADE_VIP"];
  }

  const permissoesVip = [
    ...permissoesBase,
    "COMPRAR_PASSAGEM_VIP",
    "RECEBER_DESCONTO_AUTOMATICO",
    "RECEBER_NOTIFICACAO_ANTECIPADA",
  ];

  if (usuario.tipo === TipoUsuario.VIP) {
    return permissoesVip;
  }

  // ADMIN: tudo do VIP + permissões exclusivas de gerenciamento.
  return [
    ...permissoesVip,
    "CADASTRAR_VOO",
    "ALTERAR_VOO",
    "ALTERAR_STATUS_VOO",
    "GERENCIAR_USUARIOS",
    "CRIAR_DESCONTO",
    "REMOVER_DESCONTO",
    "CONSULTAR_RELATORIOS",
  ];
}
