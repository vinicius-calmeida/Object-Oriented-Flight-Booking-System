/**
 * vite.config.ts
 * --------------
 * Configuração do Vite, o bundler/dev-server usado neste projeto.
 *
 * Pontos importantes:
 * - plugin react(): habilita JSX/TSX, Fast Refresh (hot reload de componentes).
 * - resolve.alias "@": permite importar como "@/types/Usuario" em vez de
 *   caminhos relativos longos como "../../../types/Usuario".
 * - server.proxy "/api": redireciona chamadas feitas para "/api/..." no
 *   frontend diretamente para o backend (http://localhost:3000), evitando
 *   problemas de CORS durante o desenvolvimento e centralizando a URL
 *   base da API em um único lugar (ver src/api/apiClient.ts).
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        // Remove o prefixo "/api" antes de encaminhar para o backend,
        // já que as rotas reais do backend não têm esse prefixo
        // (ex: frontend chama "/api/voos" -> backend recebe "/voos").
        rewrite: (caminho) => caminho.replace(/^\/api/, ""),
      },
    },
  },
});
