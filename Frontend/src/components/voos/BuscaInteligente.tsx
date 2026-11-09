/**
 * BuscaInteligente.tsx
 * --------------------
 * Componente de busca de voos em linguagem natural. O usuário escreve
 * uma frase livre (ex: "voo barato para o Rio na sexta") e o sistema
 * usa o Gemini para extrair filtros estruturados e buscar os voos.
 *
 * Fluxo:
 * 1. Usuário digita o texto e clica em "Buscar com IA".
 * 2. O componente chama vooApi.buscarInteligente(texto).
 * 3. O backend interpreta o texto com o Gemini e retorna { filtros, voos }.
 * 4. Os filtros interpretados são exibidos para o usuário conferir
 *    ("Entendi: de X para Y, em Z..."). Isso é transparência: o usuário
 *    pode corrigir se o modelo errou.
 * 5. Os voos são repassados para o componente pai via onResultado para
 *    que ele os exiba com o CardVoo já existente.
 *
 * Degradação elegante: se a IA falhar, o erro é exibido aqui e a
 * busca comum (FiltroBusca) continua disponível normalmente.
 *
 * Props:
 * - onResultado: chamado ao receber os voos, para o pai (Voos.tsx)
 *   atualizar sua lista. Recebe null para sinalizar "limpar resultado".
 * - desativado: bloqueia o campo quando o pai já está carregando algo.
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
import { vooApi } from "@/api";
import type { Voo, FiltrosBusca } from "@/types";
import { ClasseAssento } from "@/types";

interface BuscaInteligenteProps {
  /** Chamado quando a busca retorna voos (ou null para limpar). */
  onResultado: (voos: Voo[] | null) => void;
  /** Bloqueia o campo enquanto o pai está ocupado. */
  desativado?: boolean;
}

export function BuscaInteligente({ onResultado, desativado = false }: BuscaInteligenteProps) {
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [filtrosInterpretados, setFiltrosInterpretados] = useState<FiltrosBusca | null>(null);
  const [ativo, setAtivo] = useState(false); // true após a primeira busca bem-sucedida

  async function handleSubmit(evento: FormEvent) {
    evento.preventDefault();
    if (!texto.trim()) return;

    setCarregando(true);
    setErro(null);
    setFiltrosInterpretados(null);

    try {
      const { filtros, voos } = await vooApi.buscarInteligente(texto.trim());
      setFiltrosInterpretados(filtros);
      setAtivo(true);
      onResultado(voos);
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
      onResultado(null); // sinaliza para o pai não alterar a listagem atual
    } finally {
      setCarregando(false);
    }
  }

  function handleLimpar() {
    setTexto("");
    setErro(null);
    setFiltrosInterpretados(null);
    setAtivo(false);
    onResultado(null);
  }

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
            startIcon={carregando ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
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

      {/* Erro */}
      {erro && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {erro}
        </Alert>
      )}

      {/* Filtros interpretados — transparência para o usuário */}
      <Collapse in={filtrosInterpretados !== null && !erro}>
        {filtrosInterpretados && (
          <Box
            mt={2}
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
              <Chip
                label={`De: ${filtrosInterpretados.origem}`}
                size="small"
                variant="outlined"
              />
            )}
            {filtrosInterpretados.destino && (
              <Chip
                label={`Para: ${filtrosInterpretados.destino}`}
                size="small"
                variant="outlined"
              />
            )}
            {filtrosInterpretados.data && (
              <Chip
                label={`Data: ${new Date(filtrosInterpretados.data + "T12:00:00").toLocaleDateString("pt-BR")}`}
                size="small"
                variant="outlined"
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

            {/* Caso o modelo não tenha extraído nenhum filtro */}
            {!filtrosInterpretados.origem &&
              !filtrosInterpretados.destino &&
              !filtrosInterpretados.data &&
              !filtrosInterpretados.classeAssento &&
              !filtrosInterpretados.precoMaximo && (
                <Typography variant="caption" color="text.secondary">
                  Nenhum filtro específico identificado — mostrando todos os voos disponíveis.
                </Typography>
              )}
          </Box>
        )}
      </Collapse>
    </Paper>
  );
}
