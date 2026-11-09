/**
 * BuscaInteligenteService
 * -----------------------
 * Orquestra a interpretação de um texto livre do usuário em filtros
 * estruturados de busca de voos, usando um LLM via injeção de
 * dependência.
 *
 * Fluxo:
 * 1. Valida o texto de entrada (tamanho mínimo/máximo).
 * 2. Monta o prompt de sistema com a data de hoje (para datas relativas).
 * 3. Envia ao LLM e recebe o JSON bruto.
 * 4. Remove eventuais cercas de markdown (```json ... ```).
 * 5. Faz parse do JSON e valida com o schema zod.
 * 6. Retorna os filtros tipados.
 *
 * Erros explícitos:
 * - TextoInvalidoError: texto muito curto ou muito longo.
 * - RespostaInvalidaError: o modelo não devolveu JSON válido ou o JSON
 *   não bate com o schema esperado.
 *
 * Por que usar uma interface (LlmClient) em vez de instanciar o
 * AnthropicLlmClient diretamente aqui?
 * Injeção de dependência: o serviço não sabe (e não precisa saber)
 * qual provedor de IA está sendo usado. Isso permite:
 * - Trocar de provedor sem alterar este serviço.
 * - Testar com um LlmFake que devolve respostas fixas, sem gastar
 *   créditos de API nem precisar de conexão.
 */

import { LlmClient } from "../../llm/LlmClient";
import { FiltrosBusca, FiltrosBuscaSchema } from "./filtros";
import { montarPromptSistema } from "./prompt";

/** Comprimento mínimo do texto de busca (caracteres). */
const TEXTO_MIN = 3;

/** Comprimento máximo do texto de busca (caracteres). Limita o custo por chamada. */
const TEXTO_MAX = 300;

/** Lançado quando o texto enviado pelo usuário não atende os critérios de tamanho. */
export class TextoInvalidoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TextoInvalidoError";
  }
}

/** Lançado quando a resposta do LLM não pode ser interpretada como filtros válidos. */
export class RespostaInvalidaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RespostaInvalidaError";
  }
}

export class BuscaInteligenteService {
  /**
   * O LlmClient é recebido pelo construtor (injeção de dependência),
   * seguindo o mesmo padrão POO do restante do projeto.
   */
  constructor(private llm: LlmClient) {}

  /**
   * Interpreta o texto livre do usuário e retorna filtros estruturados.
   *
   * @param texto    Descrição da viagem em linguagem natural.
   * @param hoje     Data de referência para resolver datas relativas.
   * @param origens  Lista de origens cadastradas no banco (para o prompt).
   * @param destinos Lista de destinos cadastrados no banco (para o prompt).
   */
  public async interpretar(
    texto: string,
    hoje: Date = new Date(),
    origens: string[] = [],
    destinos: string[] = []
  ): Promise<FiltrosBusca> {
    const limpo = texto.trim();

    if (limpo.length < TEXTO_MIN || limpo.length > TEXTO_MAX) {
      throw new TextoInvalidoError(
        `O texto deve ter entre ${TEXTO_MIN} e ${TEXTO_MAX} caracteres.`
      );
    }

    // Formata a data e o dia da semana em português para o prompt.
    const dataIso = hoje.toISOString().slice(0, 10);
    const diaDaSemana = hoje.toLocaleDateString("pt-BR", {
      weekday: "long",
      timeZone: "America/Sao_Paulo",
    });

    const bruto = await this.llm.completar({
      system: montarPromptSistema(dataIso, diaDaSemana, origens, destinos),
      usuario: limpo,
    });

    return this.validarResposta(bruto);
  }

  /**
   * Faz parse e validação do texto bruto retornado pelo LLM.
   * Privado: só BuscaInteligenteService precisa fazer essa validação.
   */
  private validarResposta(bruto: string): FiltrosBusca {
    // Alguns modelos envolvem a resposta em cercas de markdown
    // (```json ... ```), mesmo quando instruídos a não fazê-lo.
    const semCercas = bruto.replace(/```json|```/g, "").trim();

    let objeto: unknown;
    try {
      objeto = JSON.parse(semCercas);
    } catch {
      throw new RespostaInvalidaError(
        "A IA não devolveu um JSON válido. Tente reformular o pedido."
      );
    }

    const resultado = FiltrosBuscaSchema.safeParse(objeto);
    if (!resultado.success) {
      throw new RespostaInvalidaError(
        "A resposta da IA não está no formato esperado. Tente reformular o pedido."
      );
    }

    return resultado.data;
  }
}
