/**
 * FiltroBusca.tsx
 * ---------------
 * Formulário de busca de voos por origem/destino, usado no topo da
 * tela de listagem (Voos.tsx).
 *
 * Componente "controlado" de fora: ele não guarda o próprio estado de
 * filtro nem chama a API diretamente - apenas recebe os valores atuais
 * e funções de callback via props, e o componente pai (Voos.tsx) é
 * responsável por de fato disparar a busca. Isso mantém este
 * componente simples e reutilizável.
 */

import type { FormEvent } from "react";
import { Paper, Box, TextField, Button, InputAdornment } from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import FlightLandIcon from "@mui/icons-material/FlightLand";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

interface FiltroBuscaProps {
  origem: string;
  destino: string;
  onOrigemChange: (valor: string) => void;
  onDestinoChange: (valor: string) => void;
  onBuscar: () => void;
  onLimpar: () => void;
}

export function FiltroBusca({
  origem,
  destino,
  onOrigemChange,
  onDestinoChange,
  onBuscar,
  onLimpar,
}: FiltroBuscaProps) {
  function handleSubmit(evento: FormEvent) {
    evento.preventDefault();
    onBuscar();
  }

  const possuiFiltroAtivo = origem.trim() !== "" || destino.trim() !== "";

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        display="flex"
        gap={2}
        flexWrap="wrap"
        alignItems="center"
      >
        <TextField
          label="Origem"
          value={origem}
          onChange={(evento) => onOrigemChange(evento.target.value)}
          placeholder="Ex: São Paulo"
          sx={{ flex: "1 1 220px" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FlightTakeoffIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Destino"
          value={destino}
          onChange={(evento) => onDestinoChange(evento.target.value)}
          placeholder="Ex: Rio de Janeiro"
          sx={{ flex: "1 1 220px" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FlightLandIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Button type="submit" variant="contained" startIcon={<SearchIcon />} sx={{ height: 56 }}>
          Buscar
        </Button>

        {possuiFiltroAtivo && (
          <Button
            type="button"
            variant="text"
            color="inherit"
            startIcon={<ClearIcon />}
            onClick={onLimpar}
            sx={{ height: 56 }}
          >
            Limpar
          </Button>
        )}
      </Box>
    </Paper>
  );
}
