/**
 * GeminiLlmClient
 * ---------------
 * Implementação concreta de LlmClient que usa a API do Google Gemini
 * via SDK oficial (@google/genai v3+). É a implementação usada em produção.
 *
 * Configuração necessária no .env:
 *   GEMINI_API_KEY=AIza...
 *   LLM_MODEL=gemini-3.1-flash-lite
 *
 * Por que Flash-Lite?
 * A tarefa é simples: extrair filtros de um texto curto. O Flash-Lite
 * é o modelo mais rápido e barato do Gemini 3, mais que suficiente
 * para extração de dados estruturados. O plano gratuito do Google AI
 * Studio cobre bem o uso de portfólio.
 *
 * Sobre o SDK:
 * O @google/genai (v3) é o SDK atual (lançado em 2025), substituto
 * do @google/generative-ai legado. Ele usa GoogleGenAI como cliente
 * principal e aceita systemInstruction diretamente no getGenerativeModel.
 */

import { GoogleGenAI } from "@google/genai";
import { LlmClient } from "./LlmClient";

export class GeminiLlmClient implements LlmClient {
  private genAI: GoogleGenAI;
  private modelo: string;

  constructor(
    apiKey: string = process.env.GEMINI_API_KEY ?? "",
    modelo: string = process.env.LLM_MODEL ?? ""
  ) {
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY não configurada. Adicione-a ao arquivo .env."
      );
    }
    if (!modelo) {
      throw new Error(
        "LLM_MODEL não configurado. Adicione o nome do modelo ao arquivo .env."
      );
    }

    this.genAI = new GoogleGenAI({ apiKey });
    this.modelo = modelo;
  }

  async completar({
    system,
    usuario,
  }: {
    system: string;
    usuario: string;
  }): Promise<string> {
    const resposta = await this.genAI.models.generateContent({
      model: this.modelo,
      config: { systemInstruction: system },
      contents: usuario,
    });

    return resposta.text ?? "";
  }
}
