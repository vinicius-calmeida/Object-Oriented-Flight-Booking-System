/**
 * BuscaInteligente.tsx
 * --------------------
 * Componente de busca de voos em linguagem natural com feedback
 * contextual — informa ao usuário quando os resultados são
 * aproximados (range de data) ou quando a data foi ignorada.
 *
 * Contextos possíveis vindos do backend:
 * - "exato"           → encontrou voos que satisfazem todos os filtros
 * - "data_aproximada" → nenhum voo na data exata, mostra os mais
 *                       próximos dentro de ±5 dias
 * - "sem_data"        → nenhum voo no range de ±5 dias, mostra os
 *                       próximos disponíveis ignorando a data
 * - "sem_resultados"  → nenhum voo encontrado
 */

import { useState, type FormEvent } from "react";
import {
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Collapse,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ClearIcon from "@mui/icons-material/Clear";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { vooApi } from "@/api";
import type { Voo, FiltrosBusca, ContextoBusca } from "@/types";
import { ClasseAssento } from "@/types";

interface BuscaInteligenteProps {
  onResultado: (voos: Voo[] | null) => void;
  desativado?: boolean;
}

/** Mensagem e severidade para cada contexto de busca. */
function mensagemContexto(
  contexto: ContextoBusca,
  filtros: FiltrosBusca
): { texto: string; severidade: "success" | "info" | "warning" } | null {
  const dataFormatada = filtros.data
    ? new Date(filtros.data + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  switch (contexto) {
    case "exato":
      return null; // sem mensagem extra — resultado perfeito

    case "data_aproximada":
      return {
        texto: `Não encontramos voos para ${dataFormatada ? `o dia ${dataFormatada}` : "a data solicitada"}, mas estas são as opções mais próximas (dentro de 5 dias).`,
        severidade: "info",
      };

    case "sem_data":
      return {
        texto: `Não temos voos próximos a ${dataFormatada ? dataFormatada : "essa data"}${filtros.destino ? ` para ${filtros.destino}` : ""}. Estas são as próximas opções disponíveis.`,
        severidade: "warning",
      };

    case "sem_resultados":
      return {
        texto: `Não encontramos nenhum voo${filtros.destino ? ` para ${filtros.destino}` : ""} disponível no momento. Tente outros filtros ou use a busca comum abaixo.`,
        severidade: "warning",
      };

    default:
      return null;
  }
}

export function BuscaInteligente({ onResultado, desativado = false }: BuscaInteligenteProps) {
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [filtrosInterpretados, setFiltrosInterpretados] = useState<FiltrosBusca | null>(null);
  const [contexto, setContexto] = useState<ContextoBusca | null>(null);
  const [ativo, setAtivo] = useState(false);

  async function handleSubmit(evento: FormEvent) {
    evento.preventDefault();
    if (!texto.trim()) return;

    setCarregando(true);
    setErro(null);
    setFiltrosInterpretados(null);
    setContexto(null);

    try {
      const { filtros, voos, contexto: ctx } = await vooApi.buscarInteligente(texto.trim());
      setFiltrosInterpretados(filtros);
      setContexto(ctx);
      setAtivo(true);
      onResultado(voos.length > 0 ? voos : null);
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
      onResultado(null);
    } finally {
      setCarregando(false);
    }
  }

  function handleLimpar() {
    setTexto("");
    setErro(null);
    setFiltrosInterpretados(null);
    setContexto(null);
    setAtivo(false);
    onResultado(null);
  }

  const msgContexto =
    contexto && filtrosInterpretados
      ? mensagemContexto(contexto, filtrosInterpretados)
      : null;

  return (
    <Paper
      sx={{
        p: 3,
        mb: 2,
        border: "1px solid",
        borderColor: "primary.light",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(25, 118, 210, 0.08)"
            : "rgba(25, 118, 210, 0.04)",
      }}
    >
      {/* Cabeçalho */}
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <AutoAwesomeIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={700} color="primary">
          Busca inteligente
        </Typography>
        <Chip label="IA" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
      </Box>

      {/* Campo de texto + botão */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        display="flex"
        gap={2}
        flexWrap="wrap"
        alignItems="flex-start"
      >
        <TextField
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder='Ex: "quero um voo barato para o Rio na sexta"'
          fullWidth
          multiline
          maxRows={3}
          disabled={carregando || desativado}
          inputProps={{ maxLength: 300 }}
          helperText={`${texto.length}/300 caracteres`}
          sx={{ flex: "1 1 300px" }}
        />

        <Box display="flex" gap={1} alignItems="center" pt={0.5}>
          <Button
            type="submit"
            variant="contained"
            startIcon={
              carregando
                ? <CircularProgress size={16} color="inherit" />
                : <AutoAwesomeIcon />
            }
            disabled={carregando || desativado || texto.trim().length < 3}
            sx={{ height: 56, whiteSpace: "nowrap" }}
          >
            {carregando ? "Interpretando..." : "Buscar com IA"}
          </Button>

          {ativo && (
            <Button
              type="button"
              variant="text"
              color="inherit"
              startIcon={<ClearIcon />}
              onClick={handleLimpar}
              sx={{ height: 56 }}
            >
              Limpar
            </Button>
          )}
        </Box>
      </Box>

      {/* Erro da API */}
      {erro && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {erro}
        </Alert>
      )}

      {/* Filtros interpretados + mensagem contextual */}
      <Collapse in={filtrosInterpretados !== null && !erro}>
        {filtrosInterpretados && (
          <Box mt={2} display="flex" flexDirection="column" gap={1.5}>

            {/* Chips com os filtros interpretados */}
            <Box
              p={1.5}
              bgcolor="action.hover"
              borderRadius={1}
              display="flex"
              flexWrap="wrap"
              gap={1}
              alignItems="center"
            >
              <Typography variant="caption" color="text.secondary" fontWeight={600} mr={0.5}>
                Entendi:
              </Typography>

              {filtrosInterpretados.origem && (
                <Chip label={`De: ${filtrosInterpretados.origem}`} size="small" variant="outlined" />
              )}
              {filtrosInterpretados.destino && (
                <Chip label={`Para: ${filtrosInterpretados.destino}`} size="small" variant="outlined" />
              )}
              {filtrosInterpretados.data && (
                <Chip
                  label={`Data: ${new Date(filtrosInterpretados.data + "T12:00:00").toLocaleDateString("pt-BR")}`}
                  size="small"
                  variant="outlined"
                  icon={contexto !== "exato" && contexto !== null ? <InfoOutlinedIcon /> : undefined}
                  color={contexto === "data_aproximada" ? "warning" : "default"}
                />
              )}
              {filtrosInterpretados.classeAssento && (
                <Chip
                  label={`Classe: ${filtrosInterpretados.classeAssento === ClasseAssento.VIP ? "VIP" : "Econômica"}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {filtrosInterpretados.precoMaximo && (
                <Chip
                  label={`Até R$ ${filtrosInterpretados.precoMaximo.toLocaleString("pt-BR")}`}
                  size="small"
                  variant="outlined"
                />
              )}

              {!filtrosInterpretados.origem &&
                !filtrosInterpretados.destino &&
                !filtrosInterpretados.data &&
                !filtrosInterpretados.classeAssento &&
                !filtrosInterpretados.precoMaximo && (
                  <Typography variant="caption" color="text.secondary">
                    Nenhum filtro específico — mostrando todos os voos disponíveis.
                  </Typography>
                )}
            </Box>

            {/* Mensagem contextual (só aparece quando não é resultado exato) */}
            {msgContexto && (
              <Alert severity={msgContexto.severidade} icon={<InfoOutlinedIcon />}>
                {msgContexto.texto}
              </Alert>
            )}
          </Box>
        )}
      </Collapse>
    </Paper>
  );
}
