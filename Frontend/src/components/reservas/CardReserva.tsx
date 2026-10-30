/**
 * CardReserva.tsx
 * ---------------
 * Card de exibição de uma reserva na tela "Minhas Reservas".
 *
 * Ações exibidas dependem do status da reserva (StatusReserva):
 * - PENDENTE_PAGAMENTO: mostra botão "Confirmar Pagamento" e "Cancelar".
 * - CONFIRMADA: mostra apenas "Cancelar" (usuário pode desistir da viagem).
 * - CANCELADA / REEMBOLSADA: não mostra nenhuma ação (estado final).
 *
 * Este componente é "burro" de propósito: não chama a API diretamente,
 * apenas notifica o componente pai (MinhasReservas.tsx) através de
 * callbacks, que é quem efetivamente orquestra as chamadas e atualiza
 * a lista.
 */

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import FlightLandIcon from "@mui/icons-material/FlightLand";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import PaymentIcon from "@mui/icons-material/Payment";
import CancelIcon from "@mui/icons-material/Cancel";
import type { Reserva } from "@/types";
import { StatusReserva } from "@/types";
import {
  formatarMoeda,
  formatarDataHora,
  infoStatusReserva,
  textoClasseAssento,
} from "@/utils/formatadores";

interface CardReservaProps {
  reserva: Reserva;
  onConfirmarPagamento: (reserva: Reserva) => void;
  onCancelar: (reserva: Reserva) => void;
}

export function CardReserva({ reserva, onConfirmarPagamento, onCancelar }: CardReservaProps) {
  const { texto: textoStatus, cor: corStatus } = infoStatusReserva(reserva.status);

  const podeConfirmarPagamento = reserva.status === StatusReserva.PENDENTE_PAGAMENTO;
  const podeCancelar =
    reserva.status === StatusReserva.PENDENTE_PAGAMENTO ||
    reserva.status === StatusReserva.CONFIRMADA;

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <FlightTakeoffIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={700}>
              {reserva.voo.origem}
            </Typography>
            <Typography color="text.secondary">→</Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              {reserva.voo.destino}
            </Typography>
            <FlightLandIcon color="primary" fontSize="small" />
          </Box>
          <Chip label={textoStatus} color={corStatus} size="small" />
        </Box>

        <Typography variant="body2" color="text.secondary" mb={1}>
          {formatarDataHora(reserva.voo.dataHora)}
        </Typography>

        <Box display="flex" alignItems="center" gap={0.5} color="text.secondary" mb={1.5}>
          <EventSeatIcon fontSize="small" />
          <Typography variant="body2">
            Assento {reserva.assento.numero} ({textoClasseAssento(reserva.assento.classe)})
          </Typography>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        <Box display="flex" justifyContent="space-between" alignItems="baseline">
          <Typography variant="caption" color="text.secondary">
            Valor pago
          </Typography>
          <Typography variant="h6" color="primary.main" fontWeight={700}>
            {formatarMoeda(reserva.valorFinal)}
          </Typography>
        </Box>
      </CardContent>

      {(podeConfirmarPagamento || podeCancelar) && (
        <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
          {podeConfirmarPagamento && (
            <Button
              variant="contained"
              size="small"
              startIcon={<PaymentIcon />}
              onClick={() => onConfirmarPagamento(reserva)}
              fullWidth
            >
              Confirmar Pagamento
            </Button>
          )}
          {podeCancelar && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<CancelIcon />}
              onClick={() => onCancelar(reserva)}
              fullWidth={!podeConfirmarPagamento}
            >
              Cancelar
            </Button>
          )}
        </CardActions>
      )}
    </Card>
  );
}
