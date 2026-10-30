/**
 * index.ts (barrel file)
 * -----------------------
 * Reexporta tudo de enums.ts e entidades.ts a partir de um único
 * ponto de importação. Isso permite que o resto da aplicação escreva:
 *
 *   import { Usuario, TipoUsuario, Voo } from "@/types";
 *
 * em vez de precisar saber em qual arquivo específico cada tipo foi
 * declarado.
 */

export * from "./enums";
export * from "./entidades";
