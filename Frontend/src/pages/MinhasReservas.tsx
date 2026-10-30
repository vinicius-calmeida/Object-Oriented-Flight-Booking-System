/**
 * MinhasReservas.tsx
 * ------------------
 * Tela protegida (exige login - ver RotaProtegida.tsx em App.tsx) que
 * lista todas as reservas do usuário autenticado e permite:
 * - Confirmar o pagamento simbólico de uma reserva PENDENTE_PAGAMENTO
 *   (via ModalConfirmarPagamento.tsx).
 * - Cancelar uma reserva (PENDENTE_PAGAMENTO ou CONFIRMADA).
 *
 * Após qualquer ação (confirmar pagamento ou cancelar), a lista é
 * recarregada do backend para refletir o novo status imediatamente.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import FlightIcon from "@mui/icons-material/AirplanemodeInactive";
import { reservaApi } from "@/api";
import type { Reserva } from "@/types";
import { CardReserva } from "@/components/reservas/CardReserva";
import { ModalConfirmarPagamento } from "@/components/reservas/ModalConfirmarPagamento";

export function MinhasReservas() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState<string | null>(null);

  // Estado do modal de confirmação de pagamento.
  const [reservaSelecionada, setReservaSelecionada] = useState<Reserva | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  // Mensagem de feedback rápido após cancelar uma reserva (sem modal).
  const [avisoCancelamento, setAvisoCancelamento] = useState<string | null>(null);

  const carregarReservas = useCallback(async () => {
    setCarregando(true);
    setErroLista(null);
    try {
      const resultado = await reservaApi.listarMinhas();
      // Ordena as mais recentes primeiro, para facilitar encontrar a
      // reserva que o usuário acabou de criar.
      const ordenadas = [...resultado].sort(
        (a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
      );
      setReservas(ordenadas);
    } catch (erro) {
      setErroLista((erro as Error).message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarReservas();
  }, [carregarReservas]);

  function handleAbrirModalPagamento(reserva: Reserva) {
    setReservaSelecionada(reserva);
    setErroModal(null);
    setModalAberto(true);
  }

  function handleFecharModal() {
    if (confirmando) return; // evita fechar o modal no meio de uma confirmação em andamento
    setModalAberto(false);
    setReservaSelecionada(null);
  }

  async function handleConfirmarPagamento() {
    if (!reservaSelecionada) return;
    setConfirmando(true);
    setErroModal(null);

    try {
      await reservaApi.confirmarPagamento(reservaSelecionada.id);
      setModalAberto(false);
      setReservaSelecionada(null);
      await carregarReservas();
    } catch (erro) {
      setErroModal((erro as Error).message);
    } finally {
      setConfirmando(false);
    }
  }

  async function handleCancelar(reserva: Reserva) {
    setAvisoCancelamento(null);
    try {
      await reservaApi.cancelar(reserva.id);
      await carregarReservas();
    } catch (erro) {
      setAvisoCancelamento((erro as Error).message);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Minhas Reservas
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Acompanhe suas passagens, confirme pagamentos pendentes ou cancele reservas.
      </Typography>

      {avisoCancelamento && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAvisoCancelamento(null)}>
          {avisoCancelamento}
        </Alert>
      )}

      {erroLista && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {erroLista}
        </Alert>
      )}

      {carregando ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : reservas.length === 0 ? (
        <Box display="flex" flexDirection="column" alignItems="center" py={8} color="text.secondary">
          <FlightIcon sx={{ fontSize: 56, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6">Você ainda não tem reservas</Typography>
          <Typography variant="body2">Busque um voo e faça sua primeira reserva.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {reservas.map((reserva) => (
            <Grid item xs={12} sm={6} md={4} key={reserva.id}>
              <CardReserva
                reserva={reserva}
                onConfirmarPagamento={handleAbrirModalPagamento}
                onCancelar={handleCancelar}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <ModalConfirmarPagamento
        reserva={reservaSelecionada}
        aberto={modalAberto}
        confirmando={confirmando}
        erro={erroModal}
        onConfirmar={handleConfirmarPagamento}
        onFechar={handleFecharModal}
      />
    </Container>
  );
}
