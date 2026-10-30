/**
 * PaginaEmConstrucao.tsx
 * ----------------------
 * Componente placeholder TEMPORÁRIO, usado para as páginas que ainda
 * serão desenvolvidas em blocos futuros (Login, Cadastro, Voos,
 * MinhasReservas, UpgradeVIP, telas de Admin, etc.).
 *
 * Isso permite que o App.tsx e as rotas já fiquem 100% funcionais
 * AGORA (Bloco F4), mesmo antes de implementarmos o conteúdo real de
 * cada tela nos blocos seguintes (F5 a F10). Cada página real, quando
 * criada, vai SUBSTITUIR o uso deste componente na rota correspondente
 * em App.tsx.
 */

import { Container, Typography, Paper, Box } from "@mui/material";
import ConstructionIcon from "@mui/icons-material/Construction";

interface PaginaEmConstrucaoProps {
  titulo: string;
}

export function PaginaEmConstrucao({ titulo }: PaginaEmConstrucaoProps) {
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Box display="flex" justifyContent="center" mb={2}>
          <ConstructionIcon fontSize="large" color="warning" />
        </Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {titulo}
        </Typography>
        <Typography color="text.secondary">
          Esta tela será implementada em um próximo bloco do projeto.
        </Typography>
      </Paper>
    </Container>
  );
}
