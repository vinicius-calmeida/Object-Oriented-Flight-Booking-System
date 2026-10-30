/**
 * Voos.tsx
 * --------
 * Tela principal de busca e listagem de voos. É a "home" da
 * aplicação - rota pública, acessível mesmo sem login (qualquer
 * visitante pode visualizar voos; o login só é exigido para de fato
 * reservar/comprar, ver DetalhesVoo.tsx no Bloco F7).
 *
 * Fluxo:
 * 1. Ao montar a tela, busca todos os voos (vooApi.listar()) e todos
 *    os descontos ativos (descontoApi.listarAtivos(), rota pública).
 * 2. O usuário pode filtrar por origem/destino (FiltroBusca.tsx), o
 *    que dispara uma nova busca de voos para o backend com query
 *    string (os descontos não precisam ser buscados de novo).
 * 3. Os resultados são exibidos em uma grade de CardVoo.tsx, cada um
 *    já calculando e exibindo o melhor desconto aplicável (se houver)
 *    para o tipo de voo e o usuário logado.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { vooApi, descontoApi } from "@/api";
import type { Voo, Desconto } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { possuiBeneficiosVIP } from "@/utils/permissoes";
import { FiltroBusca } from "@/components/voos/FiltroBusca";
import { CardVoo } from "@/components/voos/CardVoo";

export function Voos() {
  const { usuario } = useAuth();

  const [voos, setVoos] = useState<Voo[]>([]);
  const [descontosAtivos, setDescontosAtivos] = useState<Desconto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");

  /** Busca os voos no backend, opcionalmente filtrando por origem/destino. */
  const buscarVoos = useCallback(async (filtros?: { origem?: string; destino?: string }) => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await vooApi.listar(filtros);
      setVoos(resultado);
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    } finally {
      setCarregando(false);
    }
  }, []);

  /**
   * Busca os descontos ativos uma única vez (não depende de
   * origem/destino, então não precisa ser refeita a cada nova busca
   * de voos - apenas ao montar a tela).
   */
  const buscarDescontosAtivos = useCallback(async () => {
    try {
      const resultado = await descontoApi.listarAtivos();
      setDescontosAtivos(resultado);
    } catch {
      // Falha silenciosa: a exibição de desconto é um "extra" - se a
      // busca falhar, os cards continuam funcionando normalmente,
      // apenas sem mostrar nenhum desconto.
      setDescontosAtivos([]);
    }
  }, []);

  // Busca todos os voos e os descontos ativos ao montar a tela.
  useEffect(() => {
    buscarVoos();
    buscarDescontosAtivos();
  }, [buscarVoos, buscarDescontosAtivos]);

  function handleBuscar() {
    buscarVoos({
      origem: origem.trim() || undefined,
      destino: destino.trim() || undefined,
    });
  }

  function handleLimpar() {
    setOrigem("");
    setDestino("");
    buscarVoos();
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Encontre seu próximo voo
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Busque por origem e destino, ou veja todos os voos disponíveis.
      </Typography>

      <FiltroBusca
        origem={origem}
        destino={destino}
        onOrigemChange={setOrigem}
        onDestinoChange={setDestino}
        onBuscar={handleBuscar}
        onLimpar={handleLimpar}
      />

      {erro && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {erro}
        </Alert>
      )}

      {carregando ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : voos.length === 0 ? (
        <Box display="flex" flexDirection="column" alignItems="center" py={8} color="text.secondary">
          <SearchOffIcon sx={{ fontSize: 56, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6">Nenhum voo encontrado</Typography>
          <Typography variant="body2">Tente buscar por outra origem ou destino.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {voos.map((voo) => (
            <Grid item xs={12} sm={6} md={4} key={voo.id}>
              <CardVoo
                voo={voo}
                descontosAtivos={descontosAtivos}
                usuarioPossuiBeneficiosVIP={possuiBeneficiosVIP(usuario)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
