/**
 * CardVoo.tsx
 * -----------
 * Card de exibição de um único voo, usado na tela de listagem/busca
 * (Voos.tsx). Mostra origem/destino, data/horário, preço (com
 * desconto aplicável já calculado e exibido de forma clara, se
 * houver), status e a quantidade de assentos disponíveis, com um
 * botão para ver detalhes e selecionar assento.
 */

import { Link as RouterLink } from "react-router-dom";
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
import EventIcon from "@mui/icons-material/Event";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import type { Voo, Desconto } from "@/types";
import { ClasseAssento, StatusVoo } from "@/types";
import { formatarDataHora, infoStatusVoo, textoTipoVoo } from "@/utils/formatadores";
import { calcularMelhorDesconto } from "@/utils/descontos";
import { PrecoComDesconto } from "@/components/descontos/PrecoComDesconto";

interface CardVooProps {
  voo: Voo;
  /** Descontos ativos no sistema, usados para calcular e exibir o melhor desconto aplicável a este voo. */
  descontosAtivos: Desconto[];
  /** Se o usuário logado possui benefícios VIP (false/undefined se não estiver logado ou for PADRAO). */
  usuarioPossuiBeneficiosVIP: boolean;
}

export function CardVoo({ voo, descontosAtivos, usuarioPossuiBeneficiosVIP }: CardVooProps) {
  const { texto: textoStatus, cor: corStatus } = infoStatusVoo(voo.status);

  const melhorDesconto = calcularMelhorDesconto(
    descontosAtivos,
    voo.tipoVoo,
    usuarioPossuiBeneficiosVIP
  );

  const assentosEconomicosDisponiveis = voo.assentos.filter(
    (a) => a.disponivel && a.classe === ClasseAssento.ECONOMICO
  ).length;
  const assentosVipDisponiveis = voo.assentos.filter(
    (a) => a.disponivel && a.classe === ClasseAssento.VIP
  ).length;

  const vooIndisponivel =
    voo.status === StatusVoo.ESGOTADA ||
    voo.status === StatusVoo.ATRASADA ||
    voo.status === StatusVoo.CANCELADA ||
    voo.status === StatusVoo.REALIZADO;

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <FlightTakeoffIcon color="primary" fontSize="small" />
            <Typography variant="h6" fontWeight={700}>
              {voo.origem}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              →
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {voo.destino}
            </Typography>
            <FlightLandIcon color="primary" fontSize="small" />
          </Box>
          <Chip label={textoStatus} color={corStatus} size="small" />
        </Box>

        <Box display="flex" alignItems="center" gap={1} mb={1} color="text.secondary">
          <EventIcon fontSize="small" />
          <Typography variant="body2">{formatarDataHora(voo.dataHora)}</Typography>
          <Chip
            label={textoTipoVoo(voo.tipoVoo)}
            size="small"
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Box>

        <Box display="flex" alignItems="center" gap={1} color="text.secondary">
          <EventSeatIcon fontSize="small" />
          <Typography variant="body2">
            {assentosEconomicosDisponiveis} assento(s) econômico(s) · {assentosVipDisponiveis} assento(s) VIP disponível(eis)
          </Typography>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box display="flex" justifyContent="space-between" alignItems="flex-end">
          <Typography variant="caption" color="text.secondary">
            a partir de
          </Typography>
          <PrecoComDesconto
            precoBase={voo.precoBase}
            desconto={melhorDesconto}
            alinhamento="right"
          />
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          component={RouterLink}
          to={`/voos/${voo.id}`}
          variant="contained"
          fullWidth
          disabled={vooIndisponivel}
        >
          {vooIndisponivel ? "Indisponível" : "Selecionar voo"}
        </Button>
      </CardActions>
    </Card>
  );
}
