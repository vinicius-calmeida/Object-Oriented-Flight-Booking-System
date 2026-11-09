/**
 * VooController
 * -------------
 * Expõe rotas relacionadas ao gerenciamento e busca de voos.
 *
 * ROTAS:
 * GET    /voos                  -> lista/busca voos (filtros opcionais: origem, destino, incluirRealizados [ADMIN])
 * GET    /voos/:id               -> busca um voo específico
 * POST   /voos                   -> cadastra um novo voo (ADMIN)
 * PUT    /voos/:id                -> altera dados de um voo (ADMIN)
 * PATCH  /voos/:id/atrasar        -> marca o voo como ATRASADA (ADMIN)
 * PATCH  /voos/:id/cancelar       -> marca o voo como CANCELADA (ADMIN)
 * DELETE /voos/:id                -> remove um voo (ADMIN)
 *
 * Todas as rotas de escrita (POST/PUT/PATCH/DELETE) exigem autenticação
 * e validam internamente, via VooService, se o solicitante é ADMIN.
 */

import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { VooService } from "../services/VooService";
import { NotificacaoService } from "../services/NotificacaoService";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { exigirAutenticacao } from "./autenticacaoMiddleware";
import { TipoVoo } from "../enums/TipoVoo";
import { GeminiLlmClient } from "../llm/GeminiLlmClient";
import { BuscaInteligenteService, TextoInvalidoError, RespostaInvalidaError } from "../services/busca-inteligente/BuscaInteligenteService";

const router = Router();
const vooService = new VooService();
const notificacaoService = new NotificacaoService();
const usuarioRepository = new UsuarioRepository();

// Instancia o serviço de busca inteligente com o cliente Gemini real.
// Em testes, basta construir BuscaInteligenteService com um LlmFake.
const buscaInteligenteService = new BuscaInteligenteService(
  new GeminiLlmClient()
);

/**
 * Rate limiter para a rota de busca inteligente.
 * Cada chamada consome créditos da API do Gemini; limitar evita
 * gastos acidentais (ex: loop de requisições ou uso indevido).
 * 10 requisições por minuto por IP é suficiente para uso normal.
 */
const limiteBuscaInteligente = rateLimit({
  windowMs: 60 * 1000, // janela de 1 minuto
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas buscas em pouco tempo. Aguarde um momento e tente novamente." },
});

/**
 * POST /voos/busca-inteligente
 * Interpreta um texto livre do usuário (ex: "voo barato para o Rio na
 * sexta") usando o Gemini, extrai filtros estruturados e devolve os
 * voos correspondentes junto com os filtros interpretados.
 *
 * A rota exige autenticação (x-user-id) para evitar uso anônimo da
 * API do Gemini e tem rate limit de 10 req/min por IP.
 *
 * Resposta de sucesso (200):
 * {
 *   filtros: { origem, destino, data, classeAssento, precoMaximo },
 *   voos: [ ...Voo[] ]
 * }
 *
 * Tratamento de erros:
 * 400 -> texto ausente ou fora do tamanho permitido (TextoInvalidoError)
 * 422 -> Gemini não devolveu JSON válido/compatível (RespostaInvalidaError)
 * 503 -> falha inesperada na API do Gemini ou no banco
 */
router.post(
  "/busca-inteligente",
  exigirAutenticacao,
  limiteBuscaInteligente,
  async (req: Request, res: Response) => {
    try {
      const { texto } = req.body ?? {};

      if (typeof texto !== "string") {
        res.status(400).json({ erro: "Informe o campo 'texto' com a descrição da sua viagem." });
        return;
      }

      // Busca as cidades reais do banco para injetar no prompt — assim o
      // LLM escolhe dentre "Nova Iorque" em vez de retornar "EUA".
      const { origens, destinos } = await vooService.listarOrigensDestinos();
      const filtros = await buscaInteligenteService.interpretar(texto, new Date(), origens, destinos);
      const voos = await vooService.buscarComFiltros(filtros);

      res.status(200).json({ filtros, voos });
    } catch (erro) {
      if (erro instanceof TextoInvalidoError) {
        res.status(400).json({ erro: erro.message });
        return;
      }
      if (erro instanceof RespostaInvalidaError) {
        res.status(422).json({
          erro: "Não consegui interpretar o pedido. Tente reformular, por exemplo: 'voo para São Paulo amanhã'.",
        });
        return;
      }
      console.error("Falha na busca inteligente:", erro);
      res.status(503).json({
        erro: "Busca inteligente indisponível no momento. Use a busca comum.",
      });
    }
  }
);

/**
 * GET /voos
 * Lista todos os voos, ou filtra por origem/destino via query string.
 * Ex: GET /voos?origem=Sao+Paulo&destino=Rio
 * Esta rota é pública: qualquer pessoa (mesmo sem login) pode visualizar voos.
 *
 * Por padrão, voos cujo status já é REALIZADO (dataHora no passado)
 * NÃO aparecem no resultado - a busca pública só deve mostrar voos
 * futuros, disponíveis para compra.
 *
 * Query string opcional "incluirRealizados=true": inclui também os
 * voos já realizados no resultado. Restrito a usuários ADMIN (usado
 * pela tela de gerenciamento de voos, que precisa visualizar o
 * histórico completo).
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { origem, destino, incluirRealizados } = req.query;

    let usuarioSolicitante = undefined;
    const usuarioIdHeader = req.header("x-user-id");
    if (usuarioIdHeader) {
      usuarioSolicitante = await usuarioRepository.buscarPorId(usuarioIdHeader);
    }

    const desejaIncluirRealizados = incluirRealizados === "true";
    // Apenas ADMIN pode efetivamente obter o histórico completo - se
    // um usuário não-admin (ou anônimo) tentar usar o parâmetro, ele
    // é ignorado silenciosamente, mantendo o comportamento padrão
    // (somente voos futuros).
    const podeIncluirRealizados =
      desejaIncluirRealizados && Boolean(usuarioSolicitante?.isAdmin());

    const voos =
      origem || destino
        ? await vooService.buscarPorOrigemDestino(
            origem as string | undefined,
            destino as string | undefined,
            podeIncluirRealizados
          )
        : await vooService.listarTodos(podeIncluirRealizados);

    res.status(200).json(voos);
  } catch (erro) {
    res.status(500).json({ erro: (erro as Error).message });
  }
});

/**
 * GET /voos/:id
 * Busca um voo específico pelo id.
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const voo = await vooService.buscarPorId(req.params.id);

    if (!voo) {
      res.status(404).json({ erro: "Voo não encontrado." });
      return;
    }

    res.status(200).json(voo);
  } catch (erro) {
    res.status(500).json({ erro: (erro as Error).message });
  }
});

/**
 * POST /voos
 * Cadastra um novo voo. Apenas ADMIN.
 * Body esperado: { origem, destino, dataHora, precoBase, tipoVoo, quantidadeAssentos }
 *
 * Após criar o voo, notifica automaticamente todos os usuários VIP e
 * ADMIN sobre o novo voo (notificação antecipada, conforme regra de
 * negócio do status NOVA).
 */
router.post("/", exigirAutenticacao, async (req: Request, res: Response) => {
  try {
    const { origem, destino, dataHora, precoBase, tipoVoo, quantidadeAssentos } =
      req.body;

    const voo = await vooService.cadastrarVoo(
      req.usuarioAutenticado!,
      origem,
      destino,
      new Date(dataHora),
      Number(precoBase),
      tipoVoo as TipoVoo,
      Number(quantidadeAssentos)
    );

    // Notificação antecipada para usuários VIP e ADMIN sobre o novo voo.
    const todosUsuarios = await usuarioRepository.listarTodos();
    const usuariosVip = todosUsuarios.filter((usuario) =>
      usuario.possuiBeneficiosVIP()
    );

    if (usuariosVip.length > 0) {
      await notificacaoService.notificarVarios(
        usuariosVip,
        `Novo voo disponível: ${voo.origem} -> ${voo.destino}. Garanta já sua passagem!`
      );
    }

    res.status(201).json(voo);
  } catch (erro) {
    res.status(400).json({ erro: (erro as Error).message });
  }
});

/**
 * PUT /voos/:id
 * Altera dados de um voo existente (origem, destino, dataHora, precoBase).
 * Apenas ADMIN. Não altera o status (ver rotas /atrasar e /cancelar).
 */
router.put("/:id", exigirAutenticacao, async (req: Request, res: Response) => {
  try {
    const { origem, destino, dataHora, precoBase } = req.body;

    const dadosParaAtualizar: Record<string, unknown> = {};
    if (origem !== undefined) dadosParaAtualizar.origem = origem;
    if (destino !== undefined) dadosParaAtualizar.destino = destino;
    if (dataHora !== undefined) dadosParaAtualizar.dataHora = new Date(dataHora);
    if (precoBase !== undefined) dadosParaAtualizar.precoBase = Number(precoBase);

    const voo = await vooService.alterarVoo(
      req.usuarioAutenticado!,
      req.params.id,
      dadosParaAtualizar
    );

    res.status(200).json(voo);
  } catch (erro) {
    res.status(400).json({ erro: (erro as Error).message });
  }
});

/**
 * PATCH /voos/:id/atrasar
 * Marca o voo como ATRASADA. Apenas ADMIN.
 * Dispara notificação automática a todos os passageiros (feito dentro do VooService).
 */
router.patch(
  "/:id/atrasar",
  exigirAutenticacao,
  async (req: Request, res: Response) => {
    try {
      const voo = await vooService.marcarAtrasado(
        req.usuarioAutenticado!,
        req.params.id
      );
      res.status(200).json(voo);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }
);

/**
 * PATCH /voos/:id/cancelar
 * Marca o voo como CANCELADA. Apenas ADMIN.
 * Dispara notificação automática e reembolsa todas as reservas (feito dentro do VooService).
 */
router.patch(
  "/:id/cancelar",
  exigirAutenticacao,
  async (req: Request, res: Response) => {
    try {
      const voo = await vooService.marcarCancelado(
        req.usuarioAutenticado!,
        req.params.id
      );
      res.status(200).json(voo);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }
);

/**
 * DELETE /voos/:id
 * Remove um voo do sistema. Apenas ADMIN.
 */
router.delete(
  "/:id",
  exigirAutenticacao,
  async (req: Request, res: Response) => {
    try {
      await vooService.removerVoo(req.usuarioAutenticado!, req.params.id);
      res.status(204).send();
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }
);

export default router;
