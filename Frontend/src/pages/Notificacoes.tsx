/**
 * Notificacoes.tsx
 * ----------------
 * Tela protegida (exige login) que lista todas as notificações do
 * usuário autenticado, usando o componente PainelNotificacoes.tsx.
 *
 * É a tela vinculada ao ícone de sino na navbar (ver Header.tsx, que
 * já mostra um badge com a contagem de não lidas via polling).
 */

import { useState, useEffect, useCallback } from "react";
import { Container, Typography, Paper, Box, CircularProgress, Alert } from "@mui/material";
import { usuarioApi } from "@/api";
import type { Notificacao } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { PainelNotificacoes } from "@/components/notificacoes/PainelNotificacoes";

export function Notificacoes() {
  const { usuario } = useAuth();

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarNotificacoes = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await usuarioApi.listarNotificacoes(usuario.id);
      // Mais recentes primeiro.
      const ordenadas = [...resultado].sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      );
      setNotificacoes(ordenadas);
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregarNotificacoes();
  }, [carregarNotificacoes]);

  async function handleMarcarComoLida(notificacao: Notificacao) {
    try {
      await usuarioApi.marcarNotificacaoComoLida(notificacao.id);
      // Atualização otimista local, evitando uma nova chamada de
      // listagem completa só para refletir essa pequena mudança.
      setNotificacoes((atual) =>
        atual.map((n) => (n.id === notificacao.id ? { ...n, lida: true } : n))
      );
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Notificações
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Acompanhe atualizações sobre seus voos, reservas e promoções.
      </Typography>

      {erro && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {erro}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        {carregando ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <PainelNotificacoes
            notificacoes={notificacoes}
            onMarcarComoLida={handleMarcarComoLida}
          />
        )}
      </Paper>
    </Container>
  );
}
