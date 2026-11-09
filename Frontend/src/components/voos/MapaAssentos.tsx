/**
 * MapaAssentos.tsx
 * ----------------
 * Exibe a grade visual de assentos permitindo selecionar até 4 assentos
 * de uma vez (para CPFs diferentes, ex: compra para a família).
 *
 * REGRA DE NEGÓCIO REPLICADA DO BACKEND (ver ReservaService.ts):
 * - Usuários PADRAO só podem selecionar assentos ECONOMICO.
 * - Máximo de 4 assentos por compra (MAX_ASSENTOS_POR_COMPRA).
 *
 * O componente não faz chamada de API: notifica o pai (DetalhesVoo.tsx)
 * com a lista de assentos selecionados via callback onSelecionarAssentos.
 */

import { Box, Typography, Tooltip, Paper, Chip } from "@mui/material";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import type { Assento } from "@/types";
import { ClasseAssento } from "@/types";

export const MAX_ASSENTOS_POR_COMPRA = 4;

interface MapaAssentosProps {
  assentos: Assento[];
  assentosSelecionadosIds: string[];
  usuarioPossuiBeneficiosVIP: boolean;
  onSelecionarAssentos: (assentos: Assento[]) => void;
}

export function MapaAssentos({
  assentos,
  assentosSelecionadosIds,
  usuarioPossuiBeneficiosVIP,
  onSelecionarAssentos,
}: MapaAssentosProps) {
  const assentosVip = assentos.filter((a) => a.classe === ClasseAssento.VIP);
  const assentosEconomico = assentos.filter((a) => a.classe === ClasseAssento.ECONOMICO);

  function handleToggle(assento: Assento) {
    const jaSelecionado = assentosSelecionadosIds.includes(assento.id);

    if (jaSelecionado) {
      // Desseleciona
      const novos = assentos.filter(
        (a) => assentosSelecionadosIds.includes(a.id) && a.id !== assento.id
      );
      onSelecionarAssentos(novos);
    } else {
      if (assentosSelecionadosIds.length >= MAX_ASSENTOS_POR_COMPRA) return;
      const atuais = assentos.filter((a) => assentosSelecionadosIds.includes(a.id));
      onSelecionarAssentos([...atuais, assento]);
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} flexWrap="wrap" gap={1}>
        <LegendaAssentos />
        <Chip
          label={`${assentosSelecionadosIds.length} / ${MAX_ASSENTOS_POR_COMPRA} assento(s) selecionado(s)`}
          color={assentosSelecionadosIds.length > 0 ? "primary" : "default"}
          size="small"
          variant="outlined"
        />
      </Box>

      {assentosVip.length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle2" fontWeight={700} mb={1} display="flex" alignItems="center" gap={0.5}>
            <WorkspacePremiumIcon fontSize="small" color="secondary" />
            Classe VIP
          </Typography>
          <GradeDeAssentos
            assentos={assentosVip}
            assentosSelecionadosIds={assentosSelecionadosIds}
            bloqueados={!usuarioPossuiBeneficiosVIP}
            limiteAtingido={assentosSelecionadosIds.length >= MAX_ASSENTOS_POR_COMPRA}
            onToggle={handleToggle}
          />
        </Box>
      )}

      {assentosEconomico.length > 0 && (
        <Box>
          <Typography variant="subtitle2" fontWeight={700} mb={1}>
            Classe Econômica
          </Typography>
          <GradeDeAssentos
            assentos={assentosEconomico}
            assentosSelecionadosIds={assentosSelecionadosIds}
            bloqueados={false}
            limiteAtingido={assentosSelecionadosIds.length >= MAX_ASSENTOS_POR_COMPRA}
            onToggle={handleToggle}
          />
        </Box>
      )}
    </Box>
  );
}

function LegendaAssentos() {
  const itens = [
    { cor: "action.disabled", texto: "Ocupado" },
    { cor: "primary.main", texto: "Disponível" },
    { cor: "secondary.main", texto: "Selecionado" },
  ];
  return (
    <Box display="flex" gap={3} flexWrap="wrap">
      {itens.map((item) => (
        <Box key={item.texto} display="flex" alignItems="center" gap={0.5}>
          <EventSeatIcon sx={{ color: item.cor, fontSize: 20 }} />
          <Typography variant="caption" color="text.secondary">
            {item.texto}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

interface GradeDeAssentosProps {
  assentos: Assento[];
  assentosSelecionadosIds: string[];
  bloqueados: boolean;
  limiteAtingido: boolean;
  onToggle: (assento: Assento) => void;
}

function GradeDeAssentos({
  assentos,
  assentosSelecionadosIds,
  bloqueados,
  limiteAtingido,
  onToggle,
}: GradeDeAssentosProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box display="flex" flexWrap="wrap" gap={1.5}>
        {assentos.map((assento) => {
          const selecionado = assentosSelecionadosIds.includes(assento.id);
          const indisponivel = !assento.disponivel;
          const bloqueadoPorTipo = bloqueados && assento.disponivel;
          // Não clicável se: ocupado, bloqueado por tipo, ou limite atingido e não estava selecionado
          const clicavel =
            assento.disponivel && !bloqueadoPorTipo && (selecionado || !limiteAtingido);

          let corIcone: string;
          if (indisponivel || bloqueadoPorTipo) corIcone = "action.disabled";
          else if (selecionado) corIcone = "secondary.main";
          else corIcone = "primary.main";

          let tituloTooltip: string;
          if (indisponivel) tituloTooltip = `Assento ${assento.numero} — já ocupado`;
          else if (bloqueadoPorTipo) tituloTooltip = `Assento ${assento.numero} — exclusivo para usuários VIP`;
          else if (limiteAtingido && !selecionado) tituloTooltip = `Limite de ${MAX_ASSENTOS_POR_COMPRA} assentos atingido`;
          else if (selecionado) tituloTooltip = `Assento ${assento.numero} — clique para desselecionar`;
          else tituloTooltip = `Assento ${assento.numero} — clique para selecionar`;

          return (
            <Tooltip key={assento.id} title={tituloTooltip}>
              <Box
                onClick={() => clicavel && onToggle(assento)}
                display="flex"
                flexDirection="column"
                alignItems="center"
                sx={{
                  cursor: clicavel ? "pointer" : "not-allowed",
                  opacity: indisponivel || bloqueadoPorTipo || (limiteAtingido && !selecionado) ? 0.4 : 1,
                  p: 0.5,
                  borderRadius: 1,
                  border: selecionado ? "2px solid" : "2px solid transparent",
                  borderColor: selecionado ? "secondary.main" : "transparent",
                  transition: "all 0.15s",
                  "&:hover": clicavel ? { backgroundColor: "action.hover" } : undefined,
                }}
              >
                <EventSeatIcon sx={{ color: corIcone, fontSize: 32 }} />
                <Typography variant="caption" fontWeight={selecionado ? 700 : 400}>
                  {assento.numero}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Paper>
  );
}
