/**
 * ModalConfirmarPagamento.tsx
 * ---------------------------
 * Modal de confirmação do pagamento SIMBÓLICO de uma reserva,
 * conforme o fluxo descrito na especificação do projeto:
 *
 *   "sistema exibe botão 'Confirmar Pagamento' -> usuário confirma ->
 *    reserva passa para CONFIRMADA -> sistema envia notificação"
 *
 * Este componente é deliberadamente simples (não há formulário de
 * cartão de crédito nem nenhuma integração financeira real - apenas
 * um resumo da compra e um botão de confirmação), já que o pagamento
 * é apenas simbólico (ver PagamentoService.ts no backend).
 *
 * EXIBIÇÃO DE DESCONTO: comparamos reserva.voo.precoBase (preço
 * original do voo) com reserva.valorFinal (valor já calculado pelo
 * backend no momento da criação da reserva, em ReservaService) para
 * detectar se houve desconto, e exibimos o preço riscado + percentual
 * de forma clara - assim o usuário entende exatamente por que está
 * pagando menos do que o preço anunciado, em vez de só ver um valor
 * final sem explicação.
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import type { Reserva } from "@/types";
import { formatarMoeda, textoClasseAssento } from "@/utils/formatadores";

interface ModalConfirmarPagamentoProps {
  reserva: Reserva | null;
  aberto: boolean;
  confirmando: boolean;
  erro: string | null;
  onConfirmar: () => void;
  onFechar: () => void;
}

export function ModalConfirmarPagamento({
  reserva,
  aberto,
  confirmando,
  erro,
  onConfirmar,
  onFechar,
}: ModalConfirmarPagamentoProps) {
  if (!reserva) return null;

  // Detecta se houve desconto comparando o preço original do voo com
  // o valor final já calculado pelo backend no momento da reserva.
  // Pequena margem (0.01) evita falso positivo por arredondamento de
  // ponto flutuante.
  const precoOriginal = reserva.voo.precoBase;
  const houveDesconto = precoOriginal - reserva.valorFinal > 0.01;
  const percentualDesconto = houveDesconto
    ? Math.round(((precoOriginal - reserva.valorFinal) / precoOriginal) * 100)
    : 0;

  return (
    <Dialog open={aberto} onClose={confirmando ? undefined : onFechar} maxWidth="xs" fullWidth>
      <DialogTitle display="flex" alignItems="center" gap={1}>
        <PaymentIcon color="primary" />
        Confirmar pagamento
      </DialogTitle>

      <DialogContent>
        {erro && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" mb={2}>
          Este é um pagamento simbólico, apenas para fins de demonstração
          acadêmica - nenhuma cobrança real será realizada.
        </Typography>

        <Box display="flex" flexDirection="column" gap={1}>
          <LinhaResumo
            label="Voo"
            valor={`${reserva.voo.origem} → ${reserva.voo.destino}`}
          />
          <LinhaResumo
            label="Assento"
            valor={`${reserva.assento.numero} (${textoClasseAssento(reserva.assento.classe)})`}
          />

          {houveDesconto && (
            <LinhaResumo label="Preço original" valor={formatarMoeda(precoOriginal)} riscado />
          )}

          <Divider sx={{ my: 1 }} />

          <LinhaResumo
            label="Valor total"
            valor={formatarMoeda(reserva.valorFinal)}
            destaque
          />

          {houveDesconto && (
            <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
              <LocalOfferIcon sx={{ fontSize: 16 }} color="success" />
              <Typography variant="caption" color="success.dark" fontWeight={700}>
                Você economizou {percentualDesconto}% neste voo
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onFechar} disabled={confirmando} color="inherit">
          Cancelar
        </Button>
        <Button onClick={onConfirmar} disabled={confirmando} variant="contained">
          {confirmando ? <CircularProgress size={22} color="inherit" /> : "Confirmar Pagamento"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface LinhaResumoProps {
  label: string;
  valor: string;
  destaque?: boolean;
  riscado?: boolean;
}

function LinhaResumo({ label, valor, destaque, riscado }: LinhaResumoProps) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant={destaque ? "h6" : "body2"}
        fontWeight={destaque ? 700 : 500}
        color={destaque ? "primary.main" : "text.secondary"}
        sx={riscado ? { textDecoration: "line-through" } : undefined}
      >
        {valor}
      </Typography>
    </Box>
  );
}
