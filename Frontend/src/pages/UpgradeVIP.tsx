/**
 * UpgradeVIP.tsx
 * --------------
 * Tela protegida (exige login) de upgrade de conta para VIP.
 *
 * FLUXO (conforme especificação do projeto):
 * 1. usuário clica em "Tornar-se VIP" (link no Header, ver Header.tsx)
 * 2. sistema exibe o valor do upgrade (usuarioApi.consultarValorUpgradeVip())
 * 3. usuário clica em "Confirmar Pagamento"
 * 4. sistema converte a conta para VIP (usuarioApi.confirmarUpgradeVip())
 * 5. sistema envia notificação (feito no backend, UpgradeVIPService)
 *
 * Após a confirmação, atualizamos o usuário no AuthContext
 * (atualizarUsuario()) para que toda a interface (Header, botões de
 * assento VIP, etc.) reflita o novo tipo de conta IMEDIATAMENTE, sem
 * precisar de um novo login.
 *
 * Se o usuário que acessar esta tela já for VIP ou ADMIN, mostramos
 * uma mensagem informativa em vez do botão de upgrade (não faz
 * sentido pagar de novo por algo que já se tem).
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { usuarioApi } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { possuiBeneficiosVIP } from "@/utils/permissoes";
import { formatarMoeda } from "@/utils/formatadores";

const BENEFICIOS_VIP = [
  "Desconto automático em voos nacionais e internacionais",
  "Notificação antecipada de novos voos disponíveis",
  "Acesso a assentos exclusivos da classe VIP",
  "Manutenção de todos os benefícios de usuário padrão",
];

export function UpgradeVIP() {
  const { usuario, atualizarUsuario } = useAuth();
  const navigate = useNavigate();

  const [valor, setValor] = useState<number | null>(null);
  const [carregandoValor, setCarregandoValor] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const jaPossuiBeneficiosVip = possuiBeneficiosVIP(usuario);

  useEffect(() => {
    async function buscarValor() {
      try {
        const resultado = await usuarioApi.consultarValorUpgradeVip();
        setValor(resultado.valor);
      } catch (erroCapturado) {
        setErro((erroCapturado as Error).message);
      } finally {
        setCarregandoValor(false);
      }
    }
    buscarValor();
  }, []);

  async function handleConfirmarUpgrade() {
    setErro(null);
    setConfirmando(true);
    try {
      const usuarioAtualizado = await usuarioApi.confirmarUpgradeVip();
      atualizarUsuario(usuarioAtualizado);
      setSucesso(true);
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Box display="flex" justifyContent="center" mb={2}>
          <WorkspacePremiumIcon sx={{ fontSize: 56 }} color="secondary" />
        </Box>

        <Typography variant="h4" fontWeight={700} gutterBottom>
          Torne-se VIP
        </Typography>

        {sucesso ? (
          <TelaSucesso onIrParaVoos={() => navigate("/voos")} />
        ) : jaPossuiBeneficiosVip ? (
          <Alert severity="info" sx={{ mt: 2, textAlign: "left" }}>
            Sua conta já possui os benefícios de VIP. Aproveite os assentos
            exclusivos e os descontos automáticos em suas próximas compras!
          </Alert>
        ) : (
          <>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Desbloqueie benefícios exclusivos com um único upgrade.
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <List sx={{ textAlign: "left", mb: 2 }}>
              {BENEFICIOS_VIP.map((beneficio) => (
                <ListItem key={beneficio} disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={beneficio} />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ mb: 3 }} />

            {erro && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {erro}
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary">
              Valor do upgrade (pagamento simbólico)
            </Typography>

            {carregandoValor ? (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Typography variant="h3" color="secondary.main" fontWeight={700} mb={3}>
                {valor !== null ? formatarMoeda(valor) : "—"}
              </Typography>
            )}

            <Button
              variant="contained"
              color="secondary"
              size="large"
              fullWidth
              disabled={confirmando || carregandoValor}
              onClick={handleConfirmarUpgrade}
            >
              {confirmando ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Confirmar Pagamento"
              )}
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
}

interface TelaSucessoProps {
  onIrParaVoos: () => void;
}

function TelaSucesso({ onIrParaVoos }: TelaSucessoProps) {
  return (
    <Box>
      <Alert severity="success" sx={{ mb: 3, textAlign: "left" }}>
        Parabéns! Seu upgrade para VIP foi confirmado com sucesso. Você já
        pode aproveitar todos os benefícios exclusivos.
      </Alert>
      <Button variant="contained" color="secondary" size="large" fullWidth onClick={onIrParaVoos}>
        Explorar voos com benefícios VIP
      </Button>
    </Box>
  );
}
