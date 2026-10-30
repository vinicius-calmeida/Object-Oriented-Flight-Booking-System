/**
 * entidades.ts
 * ------------
 * Interfaces TypeScript que espelham o FORMATO JSON retornado pela API
 * do backend para cada entidade (Usuario, Voo, Assento, Reserva,
 * Notificacao, Desconto).
 *
 * Diferença importante em relação ao backend:
 * No backend, "Usuario" é uma CLASSE ABSTRATA com métodos como
 * getPermissoes() e isAdmin(). Aqui no frontend, como estamos lidando
 * apenas com os DADOS recebidos via JSON (sem os métodos da classe
 * original), usamos uma única INTERFACE "Usuario" com o campo "tipo"
 * discriminador, e funções auxiliares (ver src/utils/permissoes.ts,
 * Bloco F4) para replicar a lógica de permissões no lado do cliente
 * quando necessário (ex: esconder um botão "Cadastrar Voo" se o
 * usuário não for ADMIN).
 *
 * Isso é uma escolha de design comum em aplicações fullstack: o
 * "polimorfismo de classes" existe no backend (Java/TS+TypeORM), mas
 * no frontend trabalhamos com dados serializados (JSON), então
 * usamos o campo discriminador "tipo" para decidir o comportamento
 * da interface (renderização condicional), em vez de orientação a
 * objetos com herança.
 */

import {
  TipoUsuario,
  TipoVoo,
  ClasseAssento,
  StatusReserva,
  StatusVoo,
  PublicoDesconto,
} from "./enums";

/** Espelha Usuario.ts (e subclasses) do backend. Sem o campo "senha" (nunca retornado pela API). */
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  dataCadastro: string; // datas chegam como string ISO via JSON
}

/** Espelha Assento.ts do backend. */
export interface Assento {
  id: string;
  numero: string;
  classe: ClasseAssento;
  disponivel: boolean;
}

/** Espelha Voo.ts do backend, incluindo a lista de assentos relacionados. */
export interface Voo {
  id: string;
  origem: string;
  destino: string;
  dataHora: string;
  precoBase: number;
  tipoVoo: TipoVoo;
  status: StatusVoo;
  dataCadastro: string;
  assentos: Assento[];
}

/** Espelha Reserva.ts do backend, com os relacionamentos já populados (eager loading no TypeORM). */
export interface Reserva {
  id: string;
  usuario: Usuario;
  voo: Voo;
  assento: Assento;
  valorFinal: number;
  status: StatusReserva;
  dataCriacao: string;
}

/** Espelha Notificacao.ts do backend. */
export interface Notificacao {
  id: string;
  mensagem: string;
  data: string;
  lida: boolean;
  usuario: Usuario;
}

/** Espelha Desconto.ts do backend. */
export interface Desconto {
  id: string;
  nome: string;
  percentual: number;
  tipoVooAplicavel: TipoVoo;
  publico: PublicoDesconto;
  ativo: boolean;
}

/**
 * Formato padronizado de erro retornado pela API em casos de falha
 * (ver Controllers do backend: todos respondem "{ erro: 'mensagem' }"
 * em cenários de erro 400/401/403/404).
 */
export interface ErroApi {
  erro: string;
}
