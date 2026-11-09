/**
 * LlmClient
 * ---------
 * Interface que define o contrato para qualquer cliente de LLM usado
 * no sistema. Ao depender desta interface (e não da implementação
 * concreta), o BuscaInteligenteService fica desacoplado do provedor
 * de IA: é possível trocar a Anthropic por outro provedor ou usar um
 * "falso" nos testes sem alterar uma linha do serviço.
 *
 * Decisão de projeto: injeção de dependência pelo construtor, mantendo
 * o estilo orientado a objetos do restante do backend.
 */
export interface LlmClient {
  /**
   * Envia uma mensagem para o modelo e retorna o texto da resposta.
   *
   * @param params.system  Prompt de sistema: instrui o modelo sobre
   *                       seu papel e formato de resposta esperado.
   * @param params.usuario Mensagem do usuário que o modelo deve processar.
   * @returns              Texto puro devolvido pelo modelo.
   */
  completar(params: { system: string; usuario: string }): Promise<string>;
}
