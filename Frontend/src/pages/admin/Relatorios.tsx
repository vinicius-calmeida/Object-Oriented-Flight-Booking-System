/**
 * Relatorios.tsx
 * --------------
 * Tela exclusiva de ADMIN com um dashboard de métricas agregadas do
 * sistema, combinando dados já disponíveis via API (sem necessidade
 * de nenhum endpoint novo): usuários, voos e reservas.
 *
 * Métricas exibidas:
 * - Totais: usuários (por tipo), voos (por status), reservas (por status)
 * - Receita total confirmada (soma de valorFinal das reservas CONFIRMADA)
 * - Voos mais reservados (ranking simples)
 *
 * Toda a agregação é feita no FRONTEND, a partir dos dados brutos
 * retornados pela API (reservaApi.listarTodas(), usuarioApi.listarTodos(),
 * vooApi.listar()). Em um sistema de maior escala, isso normalmente
 * seria calculado no backend (e exposto como endpoints de relatório
 * dedicados), mas para o volume de dados deste projeto acadêmico,
 * agregar no cliente é simples e suficiente.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Divider,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import FlightIcon from "@mui/icons-material/Flight";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { usuarioApi, vooApi, reservaApi } from "@/api";
import type { Usuario, Voo, Reserva } from "@/types";
import { TipoUsuario, StatusReserva } from "@/types";
import { formatarMoeda } from "@/utils/formatadores";

interface CartaoMetricaProps {
  icone: React.ReactNode;
  titulo: string;
  valor: string | number;
  cor: string;
}

function CartaoMetrica({ icone, titulo, valor, cor }: CartaoMetricaProps) {
  return (
    <Paper sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: cor,
          color: "white",
        }}
      >
        {icone}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {titulo}
        </Typography>
        <Typography variant="h5" fontWeight={700}>
          {valor}
        </Typography>
      </Box>
    </Paper>
  );
}

export function Relatorios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [voos, setVoos] = useState<Voo[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [usuariosResultado, voosResultado, reservasResultado] = await Promise.all([
        usuarioApi.listarTodos(),
        vooApi.listar(),
        reservaApi.listarTodas(),
      ]);
      setUsuarios(usuariosResultado);
      setVoos(voosResultado);
      setReservas(reservasResultado);
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  if (carregando) {
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress />
      </Box>
    );
  }

  if (erro) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Alert severity="error">{erro}</Alert>
      </Container>
    );
  }

  // ============ AGREGAÇÕES ============
  const totalUsuariosVip = usuarios.filter((u) => u.tipo === TipoUsuario.VIP).length;
  const totalUsuariosAdmin = usuarios.filter((u) => u.tipo === TipoUsuario.ADMIN).length;
  const totalUsuariosPadrao = usuarios.filter((u) => u.tipo === TipoUsuario.PADRAO).length;

  const reservasConfirmadas = reservas.filter((r) => r.status === StatusReserva.CONFIRMADA);
  const receitaTotal = reservasConfirmadas.reduce((soma, r) => soma + r.valorFinal, 0);

  const totalReservasPendentes = reservas.filter(
    (r) => r.status === StatusReserva.PENDENTE_PAGAMENTO
  ).length;
  const totalReservasCanceladas = reservas.filter(
    (r) => r.status === StatusReserva.CANCELADA
  ).length;
  const totalReservasReembolsadas = reservas.filter(
    (r) => r.status === StatusReserva.REEMBOLSADA
  ).length;

  // Ranking simples: voos com mais reservas (qualquer status), do maior para o menor.
  const contagemPorVoo = new Map<string, { voo: Voo; total: number }>();
  for (const reserva of reservas) {
    const atual = contagemPorVoo.get(reserva.voo.id);
    if (atual) {
      atual.total += 1;
    } else {
      contagemPorVoo.set(reserva.voo.id, { voo: reserva.voo, total: 1 });
    }
  }
  const rankingVoos = [...contagemPorVoo.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Relatórios
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Visão geral consolidada do sistema.
      </Typography>

      {/* ============ CARTÕES DE MÉTRICAS PRINCIPAIS ============ */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <CartaoMetrica
            icone={<PeopleIcon />}
            titulo="Total de Usuários"
            valor={usuarios.length}
            cor="#0B5FA5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CartaoMetrica
            icone={<FlightIcon />}
            titulo="Total de Voos"
            valor={voos.length}
            cor="#0B5FA5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CartaoMetrica
            icone={<ConfirmationNumberIcon />}
            titulo="Reservas Confirmadas"
            valor={reservasConfirmadas.length}
            cor="#2E7D32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CartaoMetrica
            icone={<AttachMoneyIcon />}
            titulo="Receita Confirmada"
            valor={formatarMoeda(receitaTotal)}
            cor="#D4A017"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* ============ USUÁRIOS POR TIPO ============ */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Usuários por tipo
            </Typography>
            <LinhaEstatistica label="Padrão" valor={totalUsuariosPadrao} />
            <LinhaEstatistica label="VIP" valor={totalUsuariosVip} />
            <LinhaEstatistica label="Administrador" valor={totalUsuariosAdmin} />
          </Paper>
        </Grid>

        {/* ============ RESERVAS POR STATUS ============ */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Reservas por status
            </Typography>
            <LinhaEstatistica label="Pendentes de pagamento" valor={totalReservasPendentes} />
            <LinhaEstatistica label="Confirmadas" valor={reservasConfirmadas.length} />
            <LinhaEstatistica label="Canceladas" valor={totalReservasCanceladas} />
            <LinhaEstatistica label="Reembolsadas" valor={totalReservasReembolsadas} />
          </Paper>
        </Grid>

        {/* ============ RANKING DE VOOS ============ */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Voos mais reservados
            </Typography>
            {rankingVoos.length === 0 ? (
              <Typography color="text.secondary">Ainda não há reservas registradas.</Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rota</TableCell>
                    <TableCell align="right">Total de reservas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rankingVoos.map(({ voo, total }) => (
                    <TableRow key={voo.id}>
                      <TableCell>
                        {voo.origem} → {voo.destino}
                      </TableCell>
                      <TableCell align="right">{total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

interface LinhaEstatisticaProps {
  label: string;
  valor: number;
}

function LinhaEstatistica({ label, valor }: LinhaEstatisticaProps) {
  return (
    <>
      <Box display="flex" justifyContent="space-between" py={0.75}>
        <Typography color="text.secondary">{label}</Typography>
        <Typography fontWeight={700}>{valor}</Typography>
      </Box>
      <Divider />
    </>
  );
}
