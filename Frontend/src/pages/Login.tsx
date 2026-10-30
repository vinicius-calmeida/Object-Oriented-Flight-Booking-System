/**
 * Login.tsx
 * ---------
 * Tela de autenticação do usuário (e-mail + senha).
 *
 * Fluxo:
 * 1. Usuário digita e-mail/senha e envia o formulário.
 * 2. Chamamos useAuth().login(), que internamente chama authApi.login()
 *    e, em caso de sucesso, salva o usuário no AuthContext e no
 *    localStorage (ver AuthContext.tsx).
 * 3. Em caso de sucesso, redirecionamos para a página de onde o
 *    usuário veio (se ele tentou acessar uma rota protegida sem
 *    estar logado) ou para a home, usando o estado de navegação do
 *    React Router.
 * 4. Em caso de erro (credenciais inválidas), exibimos a mensagem
 *    retornada pela API em um <Alert>.
 */

import { useState, type FormEvent } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import { useAuth } from "@/hooks/useAuth";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const localizacao = useLocation();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Se o usuário foi redirecionado para o login a partir de uma rota
  // protegida (ver RotaProtegida.tsx), guardamos a origem para
  // redirecioná-lo de volta após o login bem-sucedido. Caso contrário,
  // vai para a home.
  const origem = (localizacao.state as { origem?: string } | null)?.origem ?? "/";

  async function handleSubmit(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      await login({ email, senha });
      navigate(origem, { replace: true });
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <FlightTakeoffIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h5" fontWeight={700}>
            Entrar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Acesse sua conta para comprar passagens
          </Typography>
        </Box>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            required
            fullWidth
            autoFocus
            autoComplete="email"
          />

          <TextField
            label="Senha"
            type="password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            required
            fullWidth
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={enviando}
            sx={{ mt: 1 }}
          >
            {enviando ? <CircularProgress size={24} color="inherit" /> : "Entrar"}
          </Button>
        </Box>

        <Typography variant="body2" align="center" mt={3}>
          Não tem uma conta?{" "}
          <Link component={RouterLink} to="/cadastro" fontWeight={600}>
            Cadastre-se
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}
