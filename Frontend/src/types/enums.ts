/**
 * enums.ts
 * --------
 * Enums espelhados EXATAMENTE dos enums do backend
 * (backend/src/enums/*.ts), com os mesmos nomes e valores de string.
 *
 * Por que duplicar em vez de compartilhar um pacote único?
 * Frontend e backend são dois projetos Node/TypeScript independentes
 * (cada um com seu próprio package.json e processo de build). Para
 * manter o projeto simples e didático (sem configurar um monorepo
 * com workspaces compartilhados), replicamos aqui os mesmos valores.
 *
 * IMPORTANTE: se algum enum for alterado no backend, ele DEVE ser
 * atualizado aqui também, manualmente, para manter a compatibilidade.
 */

/** Perfil de acesso do usuário. */
export enum TipoUsuario {
  PADRAO = "PADRAO",
  VIP = "VIP",
  ADMIN = "ADMIN",
}

/** Classificação do voo quanto à rota. */
export enum TipoVoo {
  NACIONAL = "NACIONAL",
  INTERNACIONAL = "INTERNACIONAL",
}

/** Classe do assento dentro do voo. */
export enum ClasseAssento {
  ECONOMICO = "ECONOMICO",
  VIP = "VIP",
}

/** Ciclo de vida de uma reserva. */
export enum StatusReserva {
  PENDENTE_PAGAMENTO = "PENDENTE_PAGAMENTO",
  CONFIRMADA = "CONFIRMADA",
  CANCELADA = "CANCELADA",
  REEMBOLSADA = "REEMBOLSADA",
}

/** Ciclo de vida de um voo. */
export enum StatusVoo {
  NOVA = "NOVA",
  A_VENDA = "A_VENDA",
  ULTIMAS_PASSAGENS = "ULTIMAS_PASSAGENS",
  ESGOTADA = "ESGOTADA",
  REALIZADO = "REALIZADO",
  ATRASADA = "ATRASADA",
  CANCELADA = "CANCELADA",
}

/** Público a que um desconto se aplica: GERAL (todos) ou VIP (exclusivo). */
export enum PublicoDesconto {
  GERAL = "GERAL",
  VIP = "VIP",
}
