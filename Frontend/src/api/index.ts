/**
 * index.ts (barrel file)
 * -----------------------
 * Reexporta todos os módulos de api/* a partir de um único ponto,
 * permitindo importar como:
 *
 *   import { authApi, vooApi, reservaApi, usuarioApi } from "@/api";
 */

export * from "./apiClient";
export * from "./authApi";
export * from "./vooApi";
export * from "./reservaApi";
export * from "./usuarioApi";
export * from "./descontoApi";
