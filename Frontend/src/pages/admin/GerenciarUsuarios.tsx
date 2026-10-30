/**
 * GerenciarUsuarios.tsx
 * ---------------------
 * Tela exclusiva de ADMIN para listar todos os usuários cadastrados
 * no sistema e removê-los, se necessário.
 *
 * Usa usuarioApi.listarTodos() (GET /usuarios) e usuarioApi.remover()
 * (DELETE /usuarios/:id), ambos já existentes desde o Bloco F2/backend.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
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
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { usuarioApi } from "@/api";
import type { Usuario } from "@/types";
import { TipoUsuario } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { formatarData } from "@/utils/formatadores";

/** Retorna a cor do Chip MUI correspondente a cada tipo de usuário. */
function corTipoUsuario(tipo: TipoUsuario): "default" | "secondary" | "primary" {
  if (tipo === TipoUsuario.ADMIN) return "primary";
  if (tipo === TipoUsuario.VIP) return "secondary";
  return "default";
}

export function GerenciarUsuarios() {
  const { usuario: usuarioLogado } = useAuth();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [usuarioParaRemover, setUsuarioParaRemover] = useState<Usuario | null>(null);
  const [removendo, setRemovendo] = useState(false);

  const carregarUsuarios = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await usuarioApi.listarTodos();
      setUsuarios(resultado);
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  async function confirmarRemocao() {
    if (!usuarioParaRemover) return;
    setRemovendo(true);
    try {
      await usuarioApi.remover(usuarioParaRemover.id);
      setUsuarioParaRemover(null);
      await carregarUsuarios();
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    } finally {
      setRemovendo(false);
    }
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Gerenciar Usuários
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Visualize todos os usuários cadastrados no sistema.
      </Typography>

      {erro && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {erro}
        </Alert>
      )}

      <Paper>
        {carregando ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>E-mail</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Cadastrado em</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.map((usuarioListado) => {
                const ehVocemesmo = usuarioListado.id === usuarioLogado?.id;
                return (
                  <TableRow key={usuarioListado.id}>
                    <TableCell>
                      {usuarioListado.nome}
                      {ehVocemesmo && (
                        <Typography component="span" variant="caption" color="text.secondary">
                          {" "}
                          (você)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{usuarioListado.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={usuarioListado.tipo}
                        color={corTipoUsuario(usuarioListado.tipo)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatarData(usuarioListado.dataCadastro)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={ehVocemesmo ? "Você não pode remover sua própria conta" : "Remover usuário"}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={ehVocemesmo}
                            onClick={() => setUsuarioParaRemover(usuarioListado)}
                          >
                            <DeleteIcon fontSize="small" />
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

      <Dialog open={Boolean(usuarioParaRemover)} onClose={() => !removendo && setUsuarioParaRemover(null)}>
        <DialogTitle>Remover usuário?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja remover{" "}
            <strong>{usuarioParaRemover?.nome}</strong> ({usuarioParaRemover?.email})?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUsuarioParaRemover(null)} disabled={removendo} color="inherit">
            Cancelar
          </Button>
          <Button onClick={confirmarRemocao} disabled={removendo} variant="contained" color="error">
            {removendo ? <CircularProgress size={22} color="inherit" /> : "Remover"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
