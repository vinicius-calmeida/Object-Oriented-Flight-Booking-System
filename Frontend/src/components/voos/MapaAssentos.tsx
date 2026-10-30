/**
 * MapaAssentos.tsx
 * ----------------
 * Exibe a lista de assentos de um voo em formato de grade visual,
 * permitindo que o usuário selecione um assento disponível.
 *
 * REGRA DE NEGÓCIO REPLICADA DO BACKEND (ver ReservaService.ts):
 * usuários PADRAO só podem selecionar assentos ECONOMICO. Assentos
 * VIP aparecem visualmente bloqueados (não clicáveis) para esse
 * perfil, com uma indicação de que é necessário upgrade. Isso é uma
 * validação de UX (evita uma tentativa que o backend rejeitaria de
 * qualquer forma) - a validação "de verdade" continua sendo feita no
 * backend (ReservaService), que é a fonte da verdade.
 *
 * O componente não faz a chamada de API diretamente: apenas notifica
 * o componente pai (DetalhesVoo.tsx) qual assento foi selecionado,
 * via callback "onSelecionarAssento".
 */

import { Box, Typography, Tooltip, Paper } from "@mui/material";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import type { Assento } from "@/types";
import { ClasseAssento } from "@/types";

interface MapaAssentosProps {
  assentos: Assento[];
  assentoSelecionadoId: string | null;
  usuarioPossuiBeneficiosVIP: boolean;
  onSelecionarAssento: (assento: Assento) => void;
}

export function MapaAssentos({
  assentos,
  assentoSelecionadoId,
  usuarioPossuiBeneficiosVIP,
  onSelecionarAssento,
}: MapaAssentosProps) {
  const assentosVip = assentos.filter((a) => a.classe === ClasseAssento.VIP);
  const assentosEconomico = assentos.filter((a) => a.classe === ClasseAssento.ECONOMICO);

  return (
    <Box>
      <LegendaAssentos />

      {assentosVip.length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle2" fontWeight={700} mb={1} display="flex" alignItems="center" gap={0.5}>
            <WorkspacePremiumIcon fontSize="small" color="secondary" />
            Classe VIP
          </Typography>
          <GradeDeAssentos
            assentos={assentosVip}
            assentoSelecionadoId={assentoSelecionadoId}
            bloqueados={!usuarioPossuiBeneficiosVIP}
            onSelecionarAssento={onSelecionarAssento}
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
            assentoSelecionadoId={assentoSelecionadoId}
            bloqueados={false}
            onSelecionarAssento={onSelecionarAssento}
          />
        </Box>
      )}
    </Box>
  );
}

/** Legenda explicando o significado visual de cada estado de assento. */
function LegendaAssentos() {
  const itens = [
    { cor: "action.disabled", texto: "Ocupado" },
    { cor: "primary.main", texto: "Disponível" },
    { cor: "secondary.main", texto: "Selecionado" },
  ];

  return (
    <Box display="flex" gap={3} mb={2} flexWrap="wrap">
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
  assentoSelecionadoId: string | null;
  bloqueados: boolean;
  onSelecionarAssento: (assento: Assento) => void;
}

function GradeDeAssentos({
  assentos,
  assentoSelecionadoId,
  bloqueados,
  onSelecionarAssento,
}: GradeDeAssentosProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box display="flex" flexWrap="wrap" gap={1.5}>
        {assentos.map((assento) => {
          const selecionado = assento.id === assentoSelecionadoId;
          const indisponivel = !assento.disponivel;
          const bloqueadoPorTipoDeUsuario = bloqueados && assento.disponivel;
          const clicavel = assento.disponivel && !bloqueadoPorTipoDeUsuario;

          let corIcone: string;
          if (indisponivel) corIcone = "action.disabled";
          else if (selecionado) corIcone = "secondary.main";
          else if (bloqueadoPorTipoDeUsuario) corIcone = "action.disabled";
          else corIcone = "primary.main";

          const tituloTooltip = indisponivel
            ? `Assento ${assento.numero} - já ocupado`
            : bloqueadoPorTipoDeUsuario
              ? `Assento ${assento.numero} - exclusivo para usuários VIP`
              : `Assento ${assento.numero} - disponível`;

          return (
            <Tooltip key={assento.id} title={tituloTooltip}>
              <Box
                onClick={() => clicavel && onSelecionarAssento(assento)}
                display="flex"
                flexDirection="column"
                alignItems="center"
                sx={{
                  cursor: clicavel ? "pointer" : "not-allowed",
                  opacity: indisponivel || bloqueadoPorTipoDeUsuario ? 0.5 : 1,
                  p: 0.5,
                  borderRadius: 1,
                  transition: "background-color 0.15s",
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
