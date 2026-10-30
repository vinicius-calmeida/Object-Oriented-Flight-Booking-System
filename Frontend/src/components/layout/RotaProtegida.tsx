/**
 * RotaProtegida.tsx
 * -----------------
 * Componente "guarda" de rotas, usado para:
 * 1. Bloquear o acesso a rotas que exigem login (redireciona para /login).
 * 2. Bloquear o acesso a rotas exclusivas de ADMIN (redireciona para a home).
 *
 * Como usar (ver App.tsx):
 *
 *   <Route element={<RotaProtegida />}>
 *     <Route path="/minhas-reservas" element={<MinhasReservas />} />
 *   </Route>
 *
 *   <Route element={<RotaProtegida apenasAdmin />}>
 *     <Route path="/admin/voos" element={<GerenciarVoos />} />
 *   </Route>
 *
 * Este componente usa o padrão "Outlet" do React Router: ele não
 * recebe a rota filha como prop, e sim renderiza <Outlet /> no lugar
 * onde a rota filha (definida em App.tsx) deve aparecer, APÓS validar
 * as condições de acesso.
 */

import { Navigate, Outlet } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { isAdmin } from "@/utils/permissoes";

interface RotaProtegidaProps {
  /** Se true, exige que o usuário logado seja ADMIN, além de estar autenticado. */
  apenasAdmin?: boolean;
}

export function RotaProtegida({ apenasAdmin = false }: RotaProtegidaProps) {
  const { usuario, carregando } = useAuth();

  // Enquanto a sessão está sendo restaurada (ver AuthContext), exibe
  // um indicador de carregamento em vez de redirecionar precipitadamente
  // para /login (o que causaria um "flash" indevido de tela de login
  // mesmo para quem já está autenticado).
  if (carregando) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (apenasAdmin && !isAdmin(usuario)) {
    return <Navigate to="/" replace />;
  }

  // <Outlet /> renderiza a rota filha correspondente, definida em App.tsx.
  return <Outlet />;
}
