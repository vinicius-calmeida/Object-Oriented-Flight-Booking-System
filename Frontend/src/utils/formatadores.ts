/**
 * formatadores.ts
 * ---------------
 * Funções utilitárias de formatação, reaproveitadas em várias telas
 * (CardVoo, MapaAssentos, MinhasReservas, painéis administrativos
 * etc.), evitando duplicar lógica de formatação de data/moeda/status
 * em cada componente.
 */

import { StatusVoo, StatusReserva, ClasseAssento, TipoVoo } from "@/types";

/** Formata um valor numérico como moeda brasileira (R$ 1.234,56). */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Formata uma data ISO (string) como "dd/mm/aaaa às HH:mm". */
export function formatarDataHora(dataIso: string): string {
  const data = new Date(dataIso);
  const dataFormatada = data.toLocaleDateString("pt-BR");
  const horaFormatada = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dataFormatada} às ${horaFormatada}`;
}

/** Formata apenas a data (sem hora), no padrão "dd/mm/aaaa". */
export function formatarData(dataIso: string): string {
  return new Date(dataIso).toLocaleDateString("pt-BR");
}

/**
 * Retorna a cor do MUI (usada em <Chip color="...">) e o texto de
 * exibição correspondentes a um StatusVoo, mantendo a mesma semântica
 * de cores em toda a aplicação (ex: vermelho sempre significa algo
 * negativo, como atraso/cancelamento).
 */
export function infoStatusVoo(status: StatusVoo): {
  texto: string;
  cor: "default" | "primary" | "secondary" | "success" | "warning" | "error";
} {
  switch (status) {
    case StatusVoo.NOVA:
      return { texto: "Novo", cor: "secondary" };
    case StatusVoo.A_VENDA:
      return { texto: "Disponível", cor: "success" };
    case StatusVoo.ULTIMAS_PASSAGENS:
      return { texto: "Últimas passagens", cor: "warning" };
    case StatusVoo.REALIZADO:
      return { texto: "Realizado", cor: "default" };
    case StatusVoo.ESGOTADA:
      return { texto: "Esgotado", cor: "default" };
    case StatusVoo.ATRASADA:
      return { texto: "Atrasado", cor: "error" };
    case StatusVoo.CANCELADA:
      return { texto: "Cancelado", cor: "error" };
    default:
      return { texto: status, cor: "default" };
  }
}

/** Equivalente a infoStatusVoo(), mas para o status de uma Reserva. */
export function infoStatusReserva(status: StatusReserva): {
  texto: string;
  cor: "default" | "primary" | "secondary" | "success" | "warning" | "error";
} {
  switch (status) {
    case StatusReserva.PENDENTE_PAGAMENTO:
      return { texto: "Pendente de pagamento", cor: "warning" };
    case StatusReserva.CONFIRMADA:
      return { texto: "Confirmada", cor: "success" };
    case StatusReserva.CANCELADA:
      return { texto: "Cancelada", cor: "default" };
    case StatusReserva.REEMBOLSADA:
      return { texto: "Reembolsada", cor: "error" };
    default:
      return { texto: status, cor: "default" };
  }
}

/** Traduz o enum TipoVoo para um texto amigável. */
export function textoTipoVoo(tipo: TipoVoo): string {
  return tipo === TipoVoo.NACIONAL ? "Nacional" : "Internacional";
}

/** Traduz o enum ClasseAssento para um texto amigável. */
export function textoClasseAssento(classe: ClasseAssento): string {
  return classe === ClasseAssento.VIP ? "VIP" : "Econômico";
}
