/**
 * DetalhesVoo.tsx
 * ---------------
 * Tela de detalhes de um voo, onde o usuário seleciona até 4 assentos
 * e informa um CPF por passageiro, depois confirma a compra de uma vez.
 *
 * FLUXO:
 * 1. Usuário seleciona assentos no MapaAssentos (até 4, clique para toggle).
 * 2. Para cada assento selecionado, aparece um campo de CPF do passageiro.
 * 3. Ao confirmar, o sistema cria todas as reservas com POST /reservas/multiplas.
 * 4. Em caso de sucesso, redireciona para "Minhas Reservas".
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import FlightLandIcon from "@mui/icons-material/FlightLand";
import EventIcon from "@mui/icons-material/Event";
import { vooApi, reservaApi, descontoApi } from "@/api";
import type { Voo, Assento, Desconto } from "@/types";
import { StatusVoo } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { possuiBeneficiosVIP } from "@/utils/permissoes";
import {
  formatarDataHora,
  infoStatusVoo,
  textoTipoVoo,
  textoClasseAssento,
} from "@/utils/formatadores";
import { calcularMelhorDesconto } from "@/utils/descontos";
import { MapaAssentos, MAX_ASSENTOS_POR_COMPRA } from "@/components/voos/MapaAssentos";
import { PrecoComDesconto } from "@/components/descontos/PrecoComDesconto";

/** Formata CPF digitado: 000.000.000-00 */
function formatarCpf(valor: string): string {
  const digits = valor.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function DetalhesVoo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [voo, setVoo] = useState<Voo | null>(null);
  const [descontosAtivos, setDescontosAtivos] = useState<Desconto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  // Lista de assentos selecionados
  const [assentosSelecionados, setAssentosSelecionados] = useState<Assento[]>([]);
  // CPF por assento: chave = assentoId
  const [cpfsPorAssento, setCpfsPorAssento] = useState<Record<string, string>>({});

  const [erroReserva, setErroReserva] = useState<string | null>(null);
  const [criandoReserva, setCriandoReserva] = useState(false);

  const buscarVoo = useCallback(async () => {
    if (!id) return;
    setCarregando(true);
    setErroCarregamento(null);
    try {
      const vooEncontrado = await vooApi.buscarPorId(id);
      setVoo(vooEncontrado);
    } catch (erro) {
      setErroCarregamento((erro as Error).message);
    } finally {
      setCarregando(false);
    }
  }, [id]);

  const buscarDescontosAtivos = useCallback(async () => {
    try {
      const resultado = await descontoApi.listarAtivos();
      setDescontosAtivos(resultado);
    } catch {
      setDescontosAtivos([]);
    }
  }, []);

  useEffect(() => {
    buscarVoo();
    buscarDescontosAtivos();
  }, [buscarVoo, buscarDescontosAtivos]);

  function handleSelecionarAssentos(novos: Assento[]) {
    // Remove CPFs de assentos que foram desselecionados
    const idsNovos = new Set(novos.map((a) => a.id));
    setCpfsPorAssento((prev) => {
      const limpo: Record<string, string> = {};
      for (const id of idsNovos) {
        if (prev[id]) limpo[id] = prev[id];
      }
      return limpo;
    });
    setAssentosSelecionados(novos);
    setErroReserva(null);
  }

  function handleCpfChange(assentoId: string, valor: string) {
    setCpfsPorAssento((prev) => ({ ...prev, [assentoId]: formatarCpf(valor) }));
  }

  // Todos os CPFs preenchidos e com 11 dígitos
  const cpfsValidos =
    assentosSelecionados.length > 0 &&
    assentosSelecionados.every((a) => {
      const cpf = (cpfsPorAssento[a.id] ?? "").replace(/\D/g, "");
      return cpf.length === 11;
    });

  async function handleConfirmarReserva() {
    if (!voo || assentosSelecionados.length === 0) return;

    if (!usuario) {
      navigate("/login");
      return;
    }

    if (!cpfsValidos) {
      setErroReserva("Preencha o CPF (11 dígitos) de todos os passageiros antes de confirmar.");
      return;
    }

    setErroReserva(null);
    setCriandoReserva(true);

    try {
      await reservaApi.criarMultiplas({
        vooId: voo.id,
        passageiros: assentosSelecionados.map((a) => ({
          assentoId: a.id,
          cpf: cpfsPorAssento[a.id] ?? "",
        })),
      });
      navigate("/minhas-reservas");
    } catch (erro) {
      setErroReserva((erro as Error).message);
    } finally {
      setCriandoReserva(false);
    }
  }

  if (carregando) {
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress />
      </Box>
    );
  }

  if (erroCarregamento || !voo) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Alert severity="error">{erroCarregamento ?? "Voo não encontrado."}</Alert>
      </Container>
    );
  }

  const { texto: textoStatus, cor: corStatus } = infoStatusVoo(voo.status);

  const vooIndisponivelParaReserva =
    voo.status === StatusVoo.ESGOTADA ||
    voo.status === StatusVoo.ATRASADA ||
    voo.status === StatusVoo.CANCELADA ||
    voo.status === StatusVoo.REALIZADO;

  const melhorDesconto = calcularMelhorDesconto(
    descontosAtivos,
    voo.tipoVoo,
    possuiBeneficiosVIP(usuario)
  );

  const melhorDescontoSeFosseVIP = calcularMelhorDesconto(descontosAtivos, voo.tipoVoo, true);
  const estaPerdendoDescontoVIP =
    !possuiBeneficiosVIP(usuario) &&
    melhorDescontoSeFosseVIP !== null &&
    melhorDescontoSeFosseVIP.id !== melhorDesconto?.id;

  const totalPassageiros = assentosSelecionados.length;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      {/* Cabeçalho do voo */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
            <FlightTakeoffIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>{voo.origem}</Typography>
            <Typography variant="h5" color="text.secondary">→</Typography>
            <Typography variant="h5" fontWeight={700}>{voo.destino}</Typography>
            <FlightLandIcon color="primary" />
          </Box>
          <Chip label={textoStatus} color={corStatus} />
        </Box>

        <Box display="flex" gap={3} flexWrap="wrap" color="text.secondary" mb={2}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <EventIcon fontSize="small" />
            <Typography variant="body2">{formatarDataHora(voo.dataHora)}</Typography>
          </Box>
          <Chip label={textoTipoVoo(voo.tipoVoo)} size="small" variant="outlined" />
        </Box>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" mb={0.5}>
            Preço por passagem
          </Typography>
          <PrecoComDesconto precoBase={voo.precoBase} desconto={melhorDesconto} tamanho="grande" />
          {estaPerdendoDescontoVIP && (
            <Typography variant="caption" color="text.secondary">
              Usuários VIP têm {melhorDescontoSeFosseVIP?.percentual}% de desconto neste voo.
            </Typography>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {vooIndisponivelParaReserva ? (
          <Alert severity={voo.status === StatusVoo.REALIZADO ? "info" : "warning"}>
            {voo.status === StatusVoo.REALIZADO
              ? "Este voo já foi realizado e não está mais disponível para reserva."
              : voo.status === StatusVoo.ESGOTADA
                ? "Este voo está esgotado e não possui mais assentos disponíveis."
                : "Este voo não está mais disponível para reserva."}
          </Alert>
        ) : (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>
                Selecione os assentos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Até {MAX_ASSENTOS_POR_COMPRA} assentos por compra
              </Typography>
            </Box>

            <MapaAssentos
              assentos={voo.assentos}
              assentosSelecionadosIds={assentosSelecionados.map((a) => a.id)}
              usuarioPossuiBeneficiosVIP={possuiBeneficiosVIP(usuario)}
              onSelecionarAssentos={handleSelecionarAssentos}
            />

            {!possuiBeneficiosVIP(usuario) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Assentos VIP são exclusivos para contas VIP.{" "}
                {usuario ? "Faça o upgrade na sua conta para liberar essa opção."
                  : "Faça login e torne-se VIP para liberar essa opção."}
              </Alert>
            )}
          </>
        )}
      </Paper>

      {/* Painel de confirmação — aparece quando há ao menos 1 assento selecionado */}
      {!vooIndisponivelParaReserva && assentosSelecionados.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Dados dos passageiros
          </Typography>

          <Table size="small" sx={{ mb: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell>Assento</TableCell>
                <TableCell>Classe</TableCell>
                <TableCell>CPF do passageiro</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assentosSelecionados.map((assento) => (
                <TableRow key={assento.id}>
                  <TableCell>
                    <Typography fontWeight={700}>{assento.numero}</Typography>
                  </TableCell>
                  <TableCell>{textoClasseAssento(assento.classe)}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="000.000.000-00"
                      value={cpfsPorAssento[assento.id] ?? ""}
                      onChange={(e) => handleCpfChange(assento.id, e.target.value)}
                      inputProps={{ maxLength: 14 }}
                      sx={{ width: 160 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Divider sx={{ mb: 2 }} />

          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {totalPassageiros} passageiro(s)
              </Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="body2" color="text.secondary">
                Total estimado
              </Typography>
              <PrecoComDesconto
                precoBase={voo.precoBase * totalPassageiros}
                desconto={melhorDesconto ? { ...melhorDesconto } : null}
                tamanho="grande"
                alinhamento="right"
              />
            </Box>
          </Box>

          {erroReserva && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {erroReserva}
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={criandoReserva || !cpfsValidos}
            onClick={handleConfirmarReserva}
          >
            {criandoReserva ? (
              <CircularProgress size={24} color="inherit" />
            ) : usuario ? (
              `Reservar ${totalPassageiros} passagem(ns)`
            ) : (
              "Entrar para reservar"
            )}
          </Button>
          {!cpfsValidos && assentosSelecionados.length > 0 && (
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1}>
              Preencha o CPF de todos os passageiros para continuar.
            </Typography>
          )}
        </Paper>
      )}
    </Container>
  );
}
