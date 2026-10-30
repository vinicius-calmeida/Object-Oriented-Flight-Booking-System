/**
 * main.tsx
 * --------
 * Ponto de entrada da aplicação React. É o primeiro código executado
 * no navegador (chamado pelo <script type="module" src="/src/main.tsx">
 * no index.html).
 *
 * Aqui montamos os PROVIDERS GLOBAIS, na ordem que faz sentido:
 * 1. <BrowserRouter>   -> habilita roteamento (React Router) em toda a app.
 * 2. <ThemeProvider>   -> aplica o tema MUI (cores, tipografia) globalmente.
 * 3. <CssBaseline />   -> reset de CSS do MUI (normaliza estilos entre navegadores).
 * 4. <AuthProvider>    -> disponibiliza o estado de autenticação para toda a árvore.
 * 5. <App />           -> componente raiz com as rotas da aplicação (Bloco F4).
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./theme";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
