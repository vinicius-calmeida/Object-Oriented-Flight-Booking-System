/**
 * GerenciarVoos.tsx
 * -----------------
 * Tela exclusiva de ADMIN (rota protegida com apenasAdmin, ver App.tsx)
 * para cadastrar novos voos e gerenciar o status de voos existentes
 * (marcar como atrasado/cancelado).
 *
 * Funcionalidades:
 * - Formulário de cadastro de voo (origem, destino, data/hora, preço,
 *   tipo, quantidade de assentos) - chama vooApi.cadastrar().
 * - Tabela com todos os voos cadastrados, com ações "Atrasar" e
 *   "Cancelar" para cada um (chamam vooApi.marcarAtrasado() /
 *   marcarCancelado()).
 *
 * Conforme a regra de negócio do backend (VooService): ao cancelar um
 * voo, TODAS as reservas daquele voo são automaticamente reembolsadas
 * e os passageiros são notificados - isso acontece no backend, e aqui
 * apenas disparamos a ação e atualizamos a lista.
 */

import { useState, useEffect, useCallback, type FormEvent } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  MenuItem,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CancelIcon from "@mui/icons-material/Cancel";
import { vooApi } from "@/api";
import type { Voo } from "@/types";
import { TipoVoo } from "@/types";
import {
  formatarMoeda,
  formatarDataHora,
  infoStatusVoo,
} from "@/utils/formatadores";

/** Estado inicial (vazio) do formulário de cadastro de voo. */
const FORMULARIO_VAZIO = {
  origem: "",
  destino: "",
  dataHora: "",
  precoBase: "",
  tipoVoo: TipoVoo.NACIONAL,
  quantidadeAssentos: "20",
};

/**
 * Formata a data/hora atual no formato exigido pelo atributo "min" de
 * um input HTML "datetime-local" (yyyy-MM-ddTHH:mm), usado para
 * impedir a seleção de datas passadas diretamente no seletor do
 * navegador.
 */
function obterDataHoraMinima(): string {
  const agora = new Date();
  // Ajusta para o fuso horário local antes de gerar a string ISO,
  // já que toISOString() por padrão converte para UTC.
  const offsetMs = agora.getTimezoneOffset() * 60 * 1000;
  const dataLocal = new Date(agora.getTime() - offsetMs);
  return dataLocal.toISOString().slice(0, 16);
}

export function GerenciarVoos() {
  const [voos, setVoos] = useState<Voo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState<string | null>(null);

  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [cadastrando, setCadastrando] = useState(false);

  // Estado do diálogo de confirmação para ações destrutivas (atrasar/cancelar).
  const [vooSelecionado, setVooSelecionado] = useState<Voo | null>(null);
  const [acaoSelecionada, setAcaoSelecionada] = useState<"atrasar" | "cancelar" | null>(null);
  const [processandoAcao, setProcessandoAcao] = useState(false);

  const carregarVoos = useCallback(async () => {
    setCarregando(true);
    setErroLista(null);
    try {
      // incluirRealizados: true porque esta é a tela administrativa -
      // o ADM precisa ver o histórico completo de voos, incluindo os
      // que já ocorreram, não apenas os futuros (diferente da busca
      // pública em Voos.tsx, que não usa esse parâmetro).
      const resultado = await vooApi.listar({ incluirRealizados: true });
      setVoos(resultado);
    } catch (erro) {
      setErroLista((erro as Error).message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarVoos();
  }, [carregarVoos]);

  async function handleCadastrarVoo(evento: FormEvent) {
    evento.preventDefault();
    setErroFormulario(null);

    const precoBaseNumero = Number(formulario.precoBase);
    const quantidadeAssentosNumero = Number(formulario.quantidadeAssentos);

    if (precoBaseNumero <= 0) {
      setErroFormulario("O preço base deve ser maior que zero.");
      return;
    }
    if (quantidadeAssentosNumero <= 0) {
      setErroFormulario("A quantidade de assentos deve ser maior que zero.");
      return;
    }

    // Validação espelhada da regra do backend (VooService.cadastrarVoo):
    // não é permitido cadastrar um voo com data/horário já passados.
    // Validar aqui também dá feedback imediato ao ADM, sem precisar de
    // uma viagem extra ao servidor para descobrir o erro - a validação
    // "de verdade" continua sendo feita no backend.
    if (new Date(formulario.dataHora).getTime() <= Date.now()) {
      setErroFormulario(
        "A data e horário do voo devem ser no futuro. Não é possível cadastrar voos com data/horário já passados."
      );
      return;
    }

    setCadastrando(true);
    try {
      await vooApi.cadastrar({
        origem: formulario.origem,
        destino: formulario.destino,
        dataHora: new Date(formulario.dataHora).toISOString(),
        precoBase: precoBaseNumero,
        tipoVoo: formulario.tipoVoo,
        quantidadeAssentos: quantidadeAssentosNumero,
      });
      setFormulario(FORMULARIO_VAZIO);
      await carregarVoos();
    } catch (erro) {
      setErroFormulario((erro as Error).message);
    } finally {
      setCadastrando(false);
    }
  }

  function abrirConfirmacao(voo: Voo, acao: "atrasar" | "cancelar") {
    setVooSelecionado(voo);
    setAcaoSelecionada(acao);
  }

  function fecharConfirmacao() {
    if (processandoAcao) return;
    setVooSelecionado(null);
    setAcaoSelecionada(null);
  }

  async function confirmarAcao() {
    if (!vooSelecionado || !acaoSelecionada) return;
    setProcessandoAcao(true);
    try {
      if (acaoSelecionada === "atrasar") {
        await vooApi.marcarAtrasado(vooSelecionado.id);
      } else {
        await vooApi.marcarCancelado(vooSelecionado.id);
      }
      await carregarVoos();
      setVooSelecionado(null);
      setAcaoSelecionada(null);
    } catch (erro) {
      setErroLista((erro as Error).message);
    } finally {
      setProcessandoAcao(false);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Gerenciar Voos
      </Typography>

      {/* ============ FORMULÁRIO DE CADASTRO ============ */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Cadastrar novo voo
        </Typography>

        {erroFormulario && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erroFormulario}
          </Alert>
        )}

        <Box component="form" onSubmit={handleCadastrarVoo}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Origem"
                fullWidth
                required
                value={formulario.origem}
                onChange={(e) => setFormulario({ ...formulario, origem: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Destino"
                fullWidth
                required
                value={formulario.destino}
                onChange={(e) => setFormulario({ ...formulario, destino: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Data e horário de partida"
                type="datetime-local"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                // "min" impede a seleção de datas passadas diretamente
                // no seletor nativo do navegador (UX) - a validação que
                // de fato importa continua sendo feita no backend.
                inputProps={{ min: obterDataHoraMinima() }}
                value={formulario.dataHora}
                onChange={(e) => setFormulario({ ...formulario, dataHora: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Tipo de voo"
                select
                fullWidth
                required
                value={formulario.tipoVoo}
                onChange={(e) =>
                  setFormulario({ ...formulario, tipoVoo: e.target.value as TipoVoo })
                }
              >
                <MenuItem value={TipoVoo.NACIONAL}>Nacional</MenuItem>
                <MenuItem value={TipoVoo.INTERNACIONAL}>Internacional</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Preço base (R$)"
                type="number"
                fullWidth
                required
                inputProps={{ min: 0, step: "0.01" }}
                value={formulario.precoBase}
                onChange={(e) => setFormulario({ ...formulario, precoBase: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantidade de assentos"
                type="number"
                fullWidth
                required
                inputProps={{ min: 1 }}
                value={formulario.quantidadeAssentos}
                onChange={(e) =>
                  setFormulario({ ...formulario, quantidadeAssentos: e.target.value })
                }
                helperText="Os primeiros 8 assentos são gerados como classe VIP; o restante, econômico."
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ mt: 2 }}
            disabled={cadastrando}
          >
            {cadastrando ? <CircularProgress size={22} color="inherit" /> : "Cadastrar Voo"}
          </Button>
        </Box>
      </Paper>

      {/* ============ TABELA DE VOOS CADASTRADOS ============ */}
      <Typography variant="h6" fontWeight={700} mb={2}>
        Voos cadastrados
      </Typography>

      {erroLista && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {erroLista}
        </Alert>
      )}

      <Paper>
        {carregando ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : voos.length === 0 ? (
          <Box py={6} textAlign="center" color="text.secondary">
            Nenhum voo cadastrado ainda.
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rota</TableCell>
                <TableCell>Data/Hora</TableCell>
                <TableCell>Preço</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {voos.map((voo) => {
                const { texto, cor } = infoStatusVoo(voo.status);
                const statusFinal =
                  voo.status === "ATRASADA" ||
                  voo.status === "CANCELADA" ||
                  voo.status === "REALIZADO";

                return (
                  <TableRow key={voo.id}>
                    <TableCell>
                      {voo.origem} → {voo.destino}
                    </TableCell>
                    <TableCell>{formatarDataHora(voo.dataHora)}</TableCell>
                    <TableCell>{formatarMoeda(voo.precoBase)}</TableCell>
                    <TableCell>
                      <Chip label={texto} color={cor} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Marcar como atrasado">
                        <span>
                          <IconButton
                            size="small"
                            color="warning"
                            disabled={statusFinal}
                            onClick={() => abrirConfirmacao(voo, "atrasar")}
                          >
                            <ScheduleIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Cancelar voo">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={statusFinal}
                            onClick={() => abrirConfirmacao(voo, "cancelar")}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* ============ DIÁLOGO DE CONFIRMAÇÃO ============ */}
      <Dialog open={Boolean(vooSelecionado)} onClose={fecharConfirmacao}>
        <DialogTitle>
          {acaoSelecionada === "atrasar" ? "Marcar voo como atrasado?" : "Cancelar este voo?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {vooSelecionado && (
              <>
                Voo: <strong>{vooSelecionado.origem} → {vooSelecionado.destino}</strong>
                <br />
                {acaoSelecionada === "atrasar"
                  ? "Todos os passageiros com reservas neste voo receberão uma notificação de atraso."
                  : "Todos os passageiros serão notificados e todas as reservas confirmadas serão automaticamente reembolsadas."}
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharConfirmacao} disabled={processandoAcao} color="inherit">
            Voltar
          </Button>
          <Button
            onClick={confirmarAcao}
            disabled={processandoAcao}
            variant="contained"
            color={acaoSelecionada === "atrasar" ? "warning" : "error"}
          >
            {processandoAcao ? <CircularProgress size={22} color="inherit" /> : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
