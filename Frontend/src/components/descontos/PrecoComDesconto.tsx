/**
 * PrecoComDesconto.tsx
 * --------------------
 * Componente reutilizável que exibe o preço de uma passagem de forma
 * clara quando há desconto aplicável: preço ORIGINAL riscado, preço
 * FINAL em destaque, e um Chip indicando o percentual e o público do
 * desconto (cores diferentes para GERAL e VIP, conforme solicitado).
 *
 * Usado em CardVoo.tsx, DetalhesVoo.tsx e ModalConfirmarPagamento.tsx,
 * garantindo que o desconto apareça de forma CONSISTENTE e visível em
 * todos os pontos da jornada de compra - antes, o usuário só descobria
 * o valor com desconto na hora de pagar, sem entender o motivo.
 *
 * Cores (combinando com o tema do projeto, ver theme.ts):
 * - Desconto VIP: dourado (cor "secondary" do tema, já usada nos
 *   badges/elementos VIP em toda a aplicação).
 * - Desconto GERAL: verde (cor "success"), para diferenciar
 *   visualmente um benefício de assinatura de uma promoção aberta.
 */

import { Box, Typography, Chip } from "@mui/material";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import type { Desconto } from "@/types";
import { PublicoDesconto } from "@/types";
import { formatarMoeda } from "@/utils/formatadores";
import { calcularPrecoComDesconto } from "@/utils/descontos";

interface PrecoComDescontoProps {
  precoBase: number;
  desconto: Desconto | null;
  /** Tamanho do preço final exibido. "grande" para telas de destaque (detalhes, pagamento), "padrao" para cards de listagem. */
  tamanho?: "grande" | "padrao";
  /** Alinhamento do bloco de preço. */
  alinhamento?: "left" | "right";
}

export function PrecoComDesconto({
  precoBase,
  desconto,
  tamanho = "padrao",
  alinhamento = "left",
}: PrecoComDescontoProps) {
  const precoFinal = calcularPrecoComDesconto(precoBase, desconto);
  const corChip = desconto?.publico === PublicoDesconto.VIP ? "secondary" : "success";
  const iconeChip =
    desconto?.publico === PublicoDesconto.VIP ? (
      <WorkspacePremiumIcon sx={{ fontSize: 16 }} />
    ) : (
      <LocalOfferIcon sx={{ fontSize: 16 }} />
    );

  return (
    <Box display="flex" flexDirection="column" alignItems={alinhamento === "right" ? "flex-end" : "flex-start"}>
      {desconto && (
        <Box display="flex" alignItems="center" gap={0.75} mb={0.25}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textDecoration: "line-through" }}
          >
            {formatarMoeda(precoBase)}
          </Typography>
          <Chip
            icon={iconeChip}
            label={`-${desconto.percentual}% ${desconto.publico === PublicoDesconto.VIP ? "VIP" : "promoção"}`}
            color={corChip}
            size="small"
            sx={{ fontWeight: 700, height: 22 }}
          />
        </Box>
      )}

      <Typography
        variant={tamanho === "grande" ? "h5" : "h6"}
        color={desconto ? (desconto.publico === PublicoDesconto.VIP ? "secondary.dark" : "success.dark") : "primary.main"}
        fontWeight={700}
      >
        {formatarMoeda(precoFinal)}
      </Typography>
    </Box>
  );
}
