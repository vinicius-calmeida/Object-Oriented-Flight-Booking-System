/**
 * PainelNotificacoes.tsx
 * ----------------------
 * Componente que exibe a lista de notificações de um usuário,
 * permitindo marcar cada uma como lida.
 *
 * Reaproveitável: usado tanto na página de notificações do próprio
 * usuário (Notificacoes.tsx, abaixo) quanto poderia, no futuro, ser
 * usado pelo Admin para inspecionar notificações de outros usuários.
 *
 * Notificações não lidas aparecem destacadas (fundo levemente
 * colorido + ponto indicador), seguindo um padrão visual comum em
 * caixas de notificação/e-mail.
 */

import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  Box,
  Tooltip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import DoneIcon from "@mui/icons-material/Done";
import type { Notificacao } from "@/types";
import { formatarDataHora } from "@/utils/formatadores";

interface PainelNotificacoesProps {
  notificacoes: Notificacao[];
  onMarcarComoLida: (notificacao: Notificacao) => void;
}

export function PainelNotificacoes({
  notificacoes,
  onMarcarComoLida,
}: PainelNotificacoesProps) {
  if (notificacoes.length === 0) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" py={6} color="text.secondary">
        <NotificationsNoneIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
        <Typography variant="body1">Nenhuma notificação por aqui.</Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {notificacoes.map((notificacao) => (
        <ListItem
          key={notificacao.id}
          divider
          sx={{
            backgroundColor: notificacao.lida ? "transparent" : "action.hover",
            borderRadius: 1,
            mb: 0.5,
          }}
          secondaryAction={
            !notificacao.lida && (
              <Tooltip title="Marcar como lida">
                <IconButton edge="end" onClick={() => onMarcarComoLida(notificacao)}>
                  <DoneIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )
          }
        >
          <ListItemIcon>
            <NotificationsIcon color={notificacao.lida ? "disabled" : "primary"} />
          </ListItemIcon>
          <ListItemText
            primary={notificacao.mensagem}
            secondary={formatarDataHora(notificacao.data)}
            primaryTypographyProps={{
              fontWeight: notificacao.lida ? 400 : 600,
            }}
          />
        </ListItem>
      ))}
    </List>
  );
}
