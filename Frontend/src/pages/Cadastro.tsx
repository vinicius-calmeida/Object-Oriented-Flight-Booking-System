/**
 * Cadastro.tsx
 * ------------
 * Tela de cadastro de um novo usuário.
 *
 * Por padrão, todo cadastro feito por esta tela cria um usuário do
 * tipo PADRAO (conforme a regra de negócio: o caminho normal de
 * "se tornar VIP" é a tela de Upgrade, não o cadastro inicial).
 *
 * Para fins ACADÊMICOS/DEMONSTRAÇÃO, esta tela também permite marcar
 * a opção "Cadastrar como Administrador", já que o projeto não possui
 * um fluxo separado de criação de ADM (em um sistema real, isso seria
 * feito por um processo interno restrito, nunca pela tela pública de
 * cadastro). Essa opção fica visualmente discreta, justamente para
 * deixar claro que não é o fluxo "normal" esperado de um usuário comum.
 */

import { useState, type FormEvent } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
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
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import { useAuth } from "@/hooks/useAuth";
import { TipoUsuario } from "@/types";

export function Cadastro() {
  const { cadastrar } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [cadastrarComoAdmin, setCadastrarComoAdmin] = useState(false);

  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem. Verifique e tente novamente.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setEnviando(true);

    try {
      await cadastrar({
        nome,
        email,
        senha,
        tipo: cadastrarComoAdmin ? TipoUsuario.ADMIN : TipoUsuario.PADRAO,
      });
      navigate("/", { replace: true });
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 6, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <FlightTakeoffIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h5" fontWeight={700}>
            Criar conta
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Cadastre-se para buscar e comprar passagens
          </Typography>
        </Box>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Nome completo"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            required
            fullWidth
            autoFocus
            autoComplete="name"
          />

          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            required
            fullWidth
            autoComplete="email"
          />

          <TextField
            label="Senha"
            type="password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            helperText="Mínimo de 6 caracteres"
          />

          <TextField
            label="Confirmar senha"
            type="password"
            value={confirmarSenha}
            onChange={(evento) => setConfirmarSenha(evento.target.value)}
            required
            fullWidth
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={enviando}
            sx={{ mt: 1 }}
          >
            {enviando ? <CircularProgress size={24} color="inherit" /> : "Criar conta"}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Opção exclusivamente para fins acadêmicos/demonstração do projeto. */}
        <FormControlLabel
          control={
            <Checkbox
              checked={cadastrarComoAdmin}
              onChange={(evento) => setCadastrarComoAdmin(evento.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="caption" color="text.secondary">
              Cadastrar como Administrador (apenas para fins de demonstração acadêmica)
            </Typography>
          }
        />

        <Typography variant="body2" align="center" mt={2}>
          Já tem uma conta?{" "}
          <Link component={RouterLink} to="/login" fontWeight={600}>
            Entrar
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}
