/**
 * GerenciarDescontos.tsx
 * ----------------------
 * Tela exclusiva de ADMIN para criar e remover (desativar) descontos
 * aplicáveis a voos NACIONAIS ou INTERNACIONAIS.
 *
 * Cada desconto pertence a um PÚBLICO (ver enum PublicoDesconto):
 * - GERAL: aplicado automaticamente para QUALQUER usuário (cor verde
 *   na interface, representando uma promoção aberta).
 * - VIP: aplicado automaticamente apenas para usuários com benefícios
 *   VIP (cor dourada, reforçando que é um benefício exclusivo de
 *   assinatura - a mesma cor usada no chip "VIP" da navbar).
 *
 * Regra de negócio (ver DescontoService.ts no backend): o usuário
 * recebe automaticamente o MELHOR desconto elegível para o seu
 * perfil e o tipo de voo comprado, sem precisar de nenhuma ação
 * manual. Esta tela é apenas onde o ADMIN cadastra esses descontos.
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
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { descontoApi } from "@/api";
import type { Desconto } from "@/types";
import { TipoVoo, PublicoDesconto } from "@/types";
import { textoTipoVoo } from "@/utils/formatadores";

const FORMULARIO_VAZIO = {
  nome: "",
  percentual: "",
  tipoVooAplicavel: TipoVoo.NACIONAL,
  publico: PublicoDesconto.GERAL,
};

/** Cor do MUI associada a cada público de desconto (reaproveitada no formulário e na tabela). */
function corPublicoDesconto(publico: PublicoDesconto): "secondary" | "success" {
  return publico === PublicoDesconto.VIP ? "secondary" : "success";
}

export function GerenciarDescontos() {
  const [descontos, setDescontos] = useState<Desconto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState<string | null>(null);

  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [idRemovendo, setIdRemovendo] = useState<string | null>(null);

  const carregarDescontos = useCallback(async () => {
    setCarregando(true);
    setErroLista(null);
    try {
      const resultado = await descontoApi.listarTodos();
      setDescontos(resultado);
    } catch (erro) {
      setErroLista((erro as Error).message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDescontos();
  }, [carregarDescontos]);

  async function handleCriarDesconto(evento: FormEvent) {
    evento.preventDefault();
    setErroFormulario(null);

    const percentualNumero = Number(formulario.percentual);
    if (percentualNumero <= 0 || percentualNumero > 100) {
      setErroFormulario("O percentual deve estar entre 1 e 100.");
      return;
    }

    setSalvando(true);
    try {
      await descontoApi.criar({
        nome: formulario.nome,
        percentual: percentualNumero,
        tipoVooAplicavel: formulario.tipoVooAplicavel,
        publico: formulario.publico,
      });
      setFormulario(FORMULARIO_VAZIO);
      await carregarDescontos();
    } catch (erro) {
      setErroFormulario((erro as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(desconto: Desconto) {
    setIdRemovendo(desconto.id);
    try {
      await descontoApi.remover(desconto.id);
      await carregarDescontos();
    } catch (erro) {
      setErroLista((erro as Error).message);
    } finally {
      setIdRemovendo(null);
    }
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Gerenciar Descontos
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Descontos <strong>Promoção</strong> (verde) valem para qualquer usuário. Descontos{" "}
        <strong>VIP</strong> (dourado) são exclusivos para contas com benefícios VIP. O usuário
        recebe automaticamente o melhor desconto elegível, sem precisar de cupom.
      </Typography>

      {/* ============ FORMULÁRIO DE CRIAÇÃO ============ */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Criar novo desconto
        </Typography>

        {erroFormulario && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erroFormulario}
          </Alert>
        )}

        <Box component="form" onSubmit={handleCriarDesconto}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Nome do desconto"
                fullWidth
                required
                placeholder="Ex: Promoção de Verão VIP"
                value={formulario.nome}
                onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label="Percentual (%)"
                type="number"
                fullWidth
                required
                inputProps={{ min: 1, max: 100 }}
                value={formulario.percentual}
                onChange={(e) => setFormulario({ ...formulario, percentual: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                label="Aplicável a"
                select
                fullWidth
                required
                value={formulario.tipoVooAplicavel}
                onChange={(e) =>
                  setFormulario({ ...formulario, tipoVooAplicavel: e.target.value as TipoVoo })
                }
              >
                <MenuItem value={TipoVoo.NACIONAL}>Voos Nacionais</MenuItem>
                <MenuItem value={TipoVoo.INTERNACIONAL}>Voos Internacionais</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Público do desconto
              </Typography>
              <ToggleButtonGroup
                value={formulario.publico}
                exclusive
                onChange={(_evento, novoValor: PublicoDesconto | null) => {
                  if (novoValor) setFormulario({ ...formulario, publico: novoValor });
                }}
                fullWidth
              >
                <ToggleButton
                  value={PublicoDesconto.GERAL}
                  sx={{
                    gap: 0.75,
                    "&.Mui-selected": {
                      backgroundColor: "success.light",
                      color: "success.dark",
                      "&:hover": { backgroundColor: "success.light" },
                    },
                  }}
                >
                  <LocalOfferIcon fontSize="small" />
                  Promoção (todos os usuários)
                </ToggleButton>
                <ToggleButton
                  value={PublicoDesconto.VIP}
                  sx={{
                    gap: 0.75,
                    "&.Mui-selected": {
                      backgroundColor: "secondary.light",
                      color: "secondary.dark",
                      "&:hover": { backgroundColor: "secondary.light" },
                    },
                  }}
                >
                  <WorkspacePremiumIcon fontSize="small" />
                  Exclusivo VIP
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>

          <Button
            type="submit"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ mt: 2 }}
            disabled={salvando}
          >
            {salvando ? <CircularProgress size={22} color="inherit" /> : "Criar Desconto"}
          </Button>
        </Box>
      </Paper>

      {/* ============ TABELA DE DESCONTOS ============ */}
      <Typography variant="h6" fontWeight={700} mb={2}>
        Descontos cadastrados
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
        ) : descontos.length === 0 ? (
          <Box py={6} textAlign="center" color="text.secondary">
            Nenhum desconto cadastrado ainda.
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Percentual</TableCell>
                <TableCell>Aplicável a</TableCell>
                <TableCell>Público</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {descontos.map((desconto) => (
                <TableRow key={desconto.id}>
                  <TableCell>{desconto.nome}</TableCell>
                  <TableCell>{desconto.percentual}%</TableCell>
                  <TableCell>{textoTipoVoo(desconto.tipoVooAplicavel)}</TableCell>
                  <TableCell>
                    <Chip
                      icon={
                        desconto.publico === PublicoDesconto.VIP ? (
                          <WorkspacePremiumIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <LocalOfferIcon sx={{ fontSize: 16 }} />
                        )
                      }
                      label={desconto.publico === PublicoDesconto.VIP ? "VIP" : "Promoção"}
                      color={corPublicoDesconto(desconto.publico)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={desconto.ativo ? "Ativo" : "Inativo"}
                      color={desconto.ativo ? "primary" : "default"}
                      size="small"
                      variant={desconto.ativo ? "filled" : "outlined"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {desconto.ativo && (
                      <Tooltip title="Desativar desconto">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={idRemovendo === desconto.id}
                            onClick={() => handleRemover(desconto)}
                          >
                            {idRemovendo === desconto.id ? (
                              <CircularProgress size={18} />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Container>
  );
}
