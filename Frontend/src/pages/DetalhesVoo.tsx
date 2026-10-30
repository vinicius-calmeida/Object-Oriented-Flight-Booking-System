/**
 * DetalhesVoo.tsx
 * ---------------
 * Tela de detalhes de um voo específico, onde o usuário seleciona um
 * assento e confirma a criação da reserva.
 *
 * FLUXO (alinhado com a especificação do projeto):
 * 1. usuário seleciona voo (já feito ao navegar para esta tela, vindo de Voos.tsx)
 * 2. usuário seleciona assento (MapaAssentos.tsx)
 * 3. sistema cria a reserva (reservaApi.criar()), com status PENDENTE_PAGAMENTO
 * 4. ao criar a reserva com sucesso, redirecionamos para "Minhas Reservas",
 *    onde o usuário poderá ver o botão "Confirmar Pagamento" (Bloco F8)
 *
 * Caso o usuário NÃO esteja logado e tente reservar, redirecionamos
 * para a tela de Login (a visualização do voo em si é pública, mas a
 * reserva exige autenticação, conforme o ReservaController do backend).
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
import { MapaAssentos } from "@/components/voos/MapaAssentos";
import { PrecoComDesconto } from "@/components/descontos/PrecoComDesconto";

export function DetalhesVoo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [voo, setVoo] = useState<Voo | null>(null);
  const [descontosAtivos, setDescontosAtivos] = useState<Desconto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  const [assentoSelecionado, setAssentoSelecionado] = useState<Assento | null>(null);
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

  /** Busca os descontos ativos (rota pública), usados para calcular e exibir o preço com desconto antes da compra. */
  const buscarDescontosAtivos = useCallback(async () => {
    try {
      const resultado = await descontoApi.listarAtivos();
      setDescontosAtivos(resultado);
    } catch {
      // Falha silenciosa: ver mesma justificativa em Voos.tsx.
      setDescontosAtivos([]);
    }
  }, []);

  useEffect(() => {
    buscarVoo();
    buscarDescontosAtivos();
  }, [buscarVoo, buscarDescontosAtivos]);

  async function handleConfirmarReserva() {
    if (!voo || !assentoSelecionado) return;

    if (!usuario) {
      // Reserva exige login - envia o usuário para o Login, e poderia
      // futuramente trazê-lo de volta para esta mesma tela (ver nota
      // sobre "origem" no Login.tsx, Bloco F5).
      navigate("/login");
      return;
    }

    setErroReserva(null);
    setCriandoReserva(true);

    try {
      await reservaApi.criar({ vooId: voo.id, assentoId: assentoSelecionado.id });
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

  // Espelha a regra de negócio do backend (Voo.estaIndisponivelParaCompra()):
  // voos ESGOTADA, ATRASADA, CANCELADA ou REALIZADO não podem receber
  // novas reservas. Aqui usamos isso para esconder a seleção de
  // assento e mostrar um aviso claro, em vez de deixar o usuário
  // escolher um assento e só descobrir o problema ao confirmar.
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

  // Verifica se existe um desconto VIP melhor do que o que o usuário
  // está recebendo agora, exclusivamente por ele não ter benefícios
  // VIP - usado só para exibir um incentivo preciso ao upgrade,
  // evitando mostrar a mensagem quando simplesmente não há nenhum
  // desconto VIP cadastrado para este tipo de voo.
  const melhorDescontoSeFosseVIP = calcularMelhorDesconto(descontosAtivos, voo.tipoVoo, true);
  const estaPerdendoDescontoVIP =
    !possuiBeneficiosVIP(usuario) &&
    melhorDescontoSeFosseVIP !== null &&
    melhorDescontoSeFosseVIP.id !== melhorDesconto?.id;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Paper sx={{ p: 4, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
            <FlightTakeoffIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>
              {voo.origem}
            </Typography>
            <Typography variant="h5" color="text.secondary">
              →
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {voo.destino}
            </Typography>
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
            Preço da passagem
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
              ? "Este voo já foi realizado e não está mais disponível para reserva. Você pode consultar voos antigos em \"Minhas Reservas\"."
              : voo.status === StatusVoo.ESGOTADA
                ? "Este voo está esgotado e não possui mais assentos disponíveis."
                : "Este voo não está mais disponível para reserva."}
          </Alert>
        ) : (
          <>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Selecione seu assento
            </Typography>

            <MapaAssentos
              assentos={voo.assentos}
              assentoSelecionadoId={assentoSelecionado?.id ?? null}
              usuarioPossuiBeneficiosVIP={possuiBeneficiosVIP(usuario)}
              onSelecionarAssento={setAssentoSelecionado}
            />

            {!possuiBeneficiosVIP(usuario) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Assentos VIP são exclusivos para contas VIP.{" "}
                {usuario ? (
                  <>Faça o upgrade na sua conta para liberar essa opção.</>
                ) : (
                  <>Faça login e torne-se VIP para liberar essa opção.</>
                )}
              </Alert>
            )}
          </>
        )}
      </Paper>

      {!vooIndisponivelParaReserva && assentoSelecionado && (
        <Paper sx={{ p: 3 }}>
          {erroReserva && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {erroReserva}
            </Alert>
          )}

          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Assento selecionado
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {assentoSelecionado.numero} ({textoClasseAssento(assentoSelecionado.classe)})
              </Typography>
            </Box>

            <Box textAlign="right">
              <Typography variant="body2" color="text.secondary">
                Valor da passagem
              </Typography>
              <PrecoComDesconto
                precoBase={voo.precoBase}
                desconto={melhorDesconto}
                tamanho="grande"
                alinhamento="right"
              />
            </Box>
          </Box>

          <Button
            variant="contained"
            size="large"
            fullWidth
            sx={{ mt: 3 }}
            disabled={criandoReserva}
            onClick={handleConfirmarReserva}
          >
            {criandoReserva ? (
              <CircularProgress size={24} color="inherit" />
            ) : usuario ? (
              "Reservar este assento"
            ) : (
              "Entrar para reservar"
            )}
          </Button>
        </Paper>
      )}
    </Container>
  );
}
