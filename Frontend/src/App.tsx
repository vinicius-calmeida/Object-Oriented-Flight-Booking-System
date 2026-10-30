/**
 * App.tsx
 * -------
 * Componente raiz da aplicação. Define TODAS as rotas (React Router)
 * e renderiza o Header em todas as telas.
 *
 * ORGANIZAÇÃO DAS ROTAS:
 * - Rotas públicas: qualquer pessoa pode acessar (Login, Cadastro, Voos).
 * - Rotas protegidas (dentro de <RotaProtegida />): exigem login.
 * - Rotas de ADMIN (dentro de <RotaProtegida apenasAdmin />): exigem
 *   login E que o usuário seja administrador.
 *
 * STATUS: TODAS as páginas da aplicação já são reais (Blocos F5 a
 * F10). O componente <PaginaEmConstrucao /> permanece em uso apenas
 * como tela de fallback para rotas não encontradas (404).
 */

import { Routes, Route } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { RotaProtegida } from "@/components/layout/RotaProtegida";
import { PaginaEmConstrucao } from "@/pages/PaginaEmConstrucao";
import { Login } from "@/pages/Login";
import { Cadastro } from "@/pages/Cadastro";
import { Voos } from "@/pages/Voos";
import { DetalhesVoo } from "@/pages/DetalhesVoo";
import { MinhasReservas } from "@/pages/MinhasReservas";
import { UpgradeVIP } from "@/pages/UpgradeVIP";
import { Notificacoes } from "@/pages/Notificacoes";
import { GerenciarVoos } from "@/pages/admin/GerenciarVoos";
import { GerenciarDescontos } from "@/pages/admin/GerenciarDescontos";
import { GerenciarUsuarios } from "@/pages/admin/GerenciarUsuarios";
import { Relatorios } from "@/pages/admin/Relatorios";

function App() {
  return (
    <>
      <Header />

      <Routes>
        {/* ============ ROTAS PÚBLICAS ============ */}
        <Route path="/" element={<Voos />} />
        <Route path="/voos" element={<Voos />} />
        <Route path="/voos/:id" element={<DetalhesVoo />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* ============ ROTAS PROTEGIDAS (exigem login) ============ */}
        <Route element={<RotaProtegida />}>
          <Route path="/minhas-reservas" element={<MinhasReservas />} />
          <Route path="/upgrade-vip" element={<UpgradeVIP />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
        </Route>

        {/* ============ ROTAS EXCLUSIVAS DE ADMIN ============ */}
        <Route element={<RotaProtegida apenasAdmin />}>
          <Route path="/admin/voos" element={<GerenciarVoos />} />
          <Route path="/admin/descontos" element={<GerenciarDescontos />} />
          <Route path="/admin/usuarios" element={<GerenciarUsuarios />} />
          <Route path="/admin/relatorios" element={<Relatorios />} />
        </Route>

        {/* ============ ROTA 404 ============ */}
        <Route path="*" element={<PaginaEmConstrucao titulo="Página não encontrada" />} />
      </Routes>
    </>
  );
}

export default App;
