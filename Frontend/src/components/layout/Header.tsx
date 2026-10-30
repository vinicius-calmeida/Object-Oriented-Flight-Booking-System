/**
 * Header.tsx
 * ----------
 * Barra de navegação superior, presente em todas as telas da
 * aplicação (ver App.tsx, que o renderiza fora do <Routes>).
 *
 * Comportamento adaptado por tipo de usuário (refletindo a mesma
 * regra de negócio do backend, através das funções de
 * src/utils/permissoes.ts):
 * - Visitante (não logado): mostra botões "Entrar" e "Cadastrar".
 * - Usuário PADRAO: mostra "Voos", "Minhas Reservas", "Tornar-se VIP".
 * - Usuário VIP: mostra "Voos", "Minhas Reservas" + um Chip dourado "VIP".
 * - ADMIN: mostra tudo do VIP + um menu "Administração".
 *
 * O ícone de notificações exibe um badge com a contagem de
 * notificações não lidas, atualizada periodicamente.
 */

import { useState, useEffect, useCallback } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import { useAuth } from "@/hooks/useAuth";
import { isAdmin, possuiBeneficiosVIP } from "@/utils/permissoes";
import { usuarioApi } from "@/api";

export function Header() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [menuUsuarioAncora, setMenuUsuarioAncora] = useState<HTMLElement | null>(null);
  const [menuAdminAncora, setMenuAdminAncora] = useState<HTMLElement | null>(null);

  const ehAdmin = isAdmin(usuario);
  const ehVip = possuiBeneficiosVIP(usuario) && !ehAdmin;

  /** Busca a contagem de notificações não lidas do usuário logado. */
  const atualizarContagemNotificacoes = useCallback(async () => {
    if (!usuario) {
      setTotalNaoLidas(0);
      return;
    }
    try {
      const notificacoes = await usuarioApi.listarNotificacoes(usuario.id);
      setTotalNaoLidas(notificacoes.filter((n) => !n.lida).length);
    } catch {
      // Falha silenciosa: o badge de notificação não é crítico a
      // ponto de exibir um erro para o usuário caso a busca falhe.
    }
  }, [usuario]);

  // Atualiza a contagem ao logar/deslogar, e a cada 15 segundos
  // enquanto o usuário estiver logado (substitui um sistema de
  // notificação em tempo real, como WebSockets, fora do escopo deste
  // projeto acadêmico).
  useEffect(() => {
    atualizarContagemNotificacoes();
    const intervalo = setInterval(atualizarContagemNotificacoes, 15000);
    return () => clearInterval(intervalo);
  }, [atualizarContagemNotificacoes]);

  function handleLogout() {
    setMenuUsuarioAncora(null);
    logout();
    navigate("/login");
  }

  return (
    <AppBar position="sticky" color="primary">
      <Toolbar sx={{ gap: 2 }}>
        {/* Logo / nome do sistema, sempre leva para a home de busca de voos */}
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            textDecoration: "none",
            color: "inherit",
            flexGrow: 1,
          }}
        >
          <FlightTakeoffIcon />
          <Typography variant="h6" component="span" fontWeight={700}>
            Passagens Aéreas
          </Typography>
        </Box>

        <Button color="inherit" component={RouterLink} to="/voos" startIcon={<ConfirmationNumberIcon />}>
          Voos
        </Button>

        {usuario && (
          <Button color="inherit" component={RouterLink} to="/minhas-reservas">
            Minhas Reservas
          </Button>
        )}

        {ehVip && (
          <Chip
            icon={<WorkspacePremiumIcon />}
            label="VIP"
            color="secondary"
            size="small"
            sx={{ fontWeight: 700 }}
          />
        )}

        {usuario && !possuiBeneficiosVIP(usuario) && (
          <Button
            color="inherit"
            component={RouterLink}
            to="/upgrade-vip"
            startIcon={<WorkspacePremiumIcon />}
            sx={{ border: "1px solid rgba(255,255,255,0.5)" }}
          >
            Tornar-se VIP
          </Button>
        )}

        {ehAdmin && (
          <>
            <Button
              color="inherit"
              startIcon={<AdminPanelSettingsIcon />}
              onClick={(evento) => setMenuAdminAncora(evento.currentTarget)}
            >
              Administração
            </Button>
            <Menu
              anchorEl={menuAdminAncora}
              open={Boolean(menuAdminAncora)}
              onClose={() => setMenuAdminAncora(null)}
            >
              <MenuItem
                component={RouterLink}
                to="/admin/voos"
                onClick={() => setMenuAdminAncora(null)}
              >
                Gerenciar Voos
              </MenuItem>
              <MenuItem
                component={RouterLink}
                to="/admin/descontos"
                onClick={() => setMenuAdminAncora(null)}
              >
                Gerenciar Descontos
              </MenuItem>
              <MenuItem
                component={RouterLink}
                to="/admin/usuarios"
                onClick={() => setMenuAdminAncora(null)}
              >
                Gerenciar Usuários
              </MenuItem>
              <MenuItem
                component={RouterLink}
                to="/admin/relatorios"
                onClick={() => setMenuAdminAncora(null)}
              >
                Relatórios
              </MenuItem>
            </Menu>
          </>
        )}

        {usuario && (
          <IconButton color="inherit" component={RouterLink} to="/notificacoes">
            <Badge badgeContent={totalNaoLidas} color="error" max={99}>
              <NotificationsIcon />
            </Badge>
          </IconButton>
        )}

        {usuario ? (
          <>
            <IconButton onClick={(evento) => setMenuUsuarioAncora(evento.currentTarget)}>
              <Avatar sx={{ bgcolor: "secondary.main", width: 36, height: 36 }}>
                {usuario.nome.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={menuUsuarioAncora}
              open={Boolean(menuUsuarioAncora)}
              onClose={() => setMenuUsuarioAncora(null)}
            >
              <Box px={2} py={1}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {usuario.nome}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {usuario.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Sair
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box display="flex" gap={1}>
            <Button color="inherit" component={RouterLink} to="/login">
              Entrar
            </Button>
            <Button
              variant="contained"
              color="secondary"
              component={RouterLink}
              to="/cadastro"
            >
              Cadastrar
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
