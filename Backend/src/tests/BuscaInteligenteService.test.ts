/**
 * BuscaInteligenteService.test.ts
 * --------------------------------
 * Testes unitários do BuscaInteligenteService usando um LlmFake —
 * nenhuma chamada real à API do Gemini é feita. Isso garante:
 *  - Testes rápidos e determinísticos (sem dependência de rede)
 *  - Sem custo de API
 *  - Cobertura de todos os caminhos de erro tratados pelo serviço
 *
 * Por que LlmFake funciona aqui?
 * BuscaInteligenteService depende da interface LlmClient, não da
 * implementação concreta. Qualquer objeto que implemente
 * `completar(): Promise<string>` serve — essa é a injeção de
 * dependência que projetamos desde o início.
 */

import { describe, it, expect } from "vitest";
import {
  BuscaInteligenteService,
  TextoInvalidoError,
  RespostaInvalidaError,
} from "../services/busca-inteligente/BuscaInteligenteService";
import type { LlmClient } from "../llm/LlmClient";

// ---------------------------------------------------------------
// LlmFake: implementação de mentira que devolve um valor fixo.
// Cada teste constrói o seu próprio, com a resposta que quer simular.
// ---------------------------------------------------------------
function criarLlmFake(resposta: string): LlmClient {
  return {
    async completar(): Promise<string> {
      return resposta;
    },
  };
}

// Data de referência fixa para todos os testes que envolvem datas
// relativas — garante resultados previsíveis independente de quando
// os testes rodam.
const HOJE = new Date("2026-11-09T12:00:00.000Z");

// ---------------------------------------------------------------
// Helpers de JSON válido
// ---------------------------------------------------------------
const filtroCompleto = {
  origem: "São Paulo",
  destino: "Rio de Janeiro",
  data: "2026-11-14",
  classeAssento: "ECONOMICO",
  precoMaximo: 500,
};

const filtroSoDestino = {
  origem: null,
  destino: "Nova Iorque",
  data: null,
  classeAssento: null,
  precoMaximo: null,
};

// ---------------------------------------------------------------
describe("BuscaInteligenteService", () => {
  // =============================================================
  // CASOS DE SUCESSO
  // =============================================================

  it("retorna filtros quando o LLM devolve JSON válido completo", async () => {
    const servico = new BuscaInteligenteService(
      criarLlmFake(JSON.stringify(filtroCompleto))
    );

    const resultado = await servico.interpretar("voo de SP para Rio na sexta econômico até 500 reais", HOJE);

    expect(resultado.origem).toBe("São Paulo");
    expect(resultado.destino).toBe("Rio de Janeiro");
    expect(resultado.data).toBe("2026-11-14");
    expect(resultado.classeAssento).toBe("ECONOMICO");
    expect(resultado.precoMaximo).toBe(500);
  });

  it("retorna filtros com campos null quando o usuário não informa tudo", async () => {
    const servico = new BuscaInteligenteService(
      criarLlmFake(JSON.stringify(filtroSoDestino))
    );

    const resultado = await servico.interpretar("quero ir para Nova Iorque", HOJE);

    expect(resultado.destino).toBe("Nova Iorque");
    expect(resultado.origem).toBeNull();
    expect(resultado.data).toBeNull();
    expect(resultado.classeAssento).toBeNull();
    expect(resultado.precoMaximo).toBeNull();
  });

  it("aceita JSON devolvido dentro de cercas de markdown ```json ... ```", async () => {
    const comCercas = "```json\n" + JSON.stringify(filtroCompleto) + "\n```";
    const servico = new BuscaInteligenteService(criarLlmFake(comCercas));

    const resultado = await servico.interpretar("voo de SP para Rio na sexta", HOJE);

    expect(resultado.origem).toBe("São Paulo");
    expect(resultado.destino).toBe("Rio de Janeiro");
  });

  it("aceita cercas de markdown sem o 'json' explícito (``` ... ```)", async () => {
    const comCercasSemJson = "```\n" + JSON.stringify(filtroSoDestino) + "\n```";
    const servico = new BuscaInteligenteService(criarLlmFake(comCercasSemJson));

    const resultado = await servico.interpretar("quero ir para Nova Iorque", HOJE);

    expect(resultado.destino).toBe("Nova Iorque");
  });

  it("aceita classeAssento VIP", async () => {
    const filtro = { ...filtroCompleto, classeAssento: "VIP" };
    const servico = new BuscaInteligenteService(criarLlmFake(JSON.stringify(filtro)));

    const resultado = await servico.interpretar("assento VIP para o Rio", HOJE);

    expect(resultado.classeAssento).toBe("VIP");
  });

  it("aceita todos os campos como null (LLM não identificou nada)", async () => {
    const filtroVazio = {
      origem: null,
      destino: null,
      data: null,
      classeAssento: null,
      precoMaximo: null,
    };
    const servico = new BuscaInteligenteService(criarLlmFake(JSON.stringify(filtroVazio)));

    const resultado = await servico.interpretar("quero viajar", HOJE);

    expect(resultado.origem).toBeNull();
    expect(resultado.destino).toBeNull();
  });

  // =============================================================
  // ERROS DE TEXTO DO USUÁRIO (TextoInvalidoError)
  // =============================================================

  it("lança TextoInvalidoError para texto vazio", async () => {
    const servico = new BuscaInteligenteService(criarLlmFake("{}"));

    await expect(servico.interpretar("", HOJE)).rejects.toThrow(TextoInvalidoError);
  });

  it("lança TextoInvalidoError para texto com apenas espaços", async () => {
    const servico = new BuscaInteligenteService(criarLlmFake("{}"));

    await expect(servico.interpretar("   ", HOJE)).rejects.toThrow(TextoInvalidoError);
  });

  it("lança TextoInvalidoError para texto com 2 caracteres (abaixo do mínimo de 3)", async () => {
    const servico = new BuscaInteligenteService(criarLlmFake("{}"));

    await expect(servico.interpretar("ab", HOJE)).rejects.toThrow(TextoInvalidoError);
  });

  it("lança TextoInvalidoError para texto com 301 caracteres (acima do máximo de 300)", async () => {
    const servico = new BuscaInteligenteService(criarLlmFake("{}"));
    const textoLongo = "a".repeat(301);

    await expect(servico.interpretar(textoLongo, HOJE)).rejects.toThrow(TextoInvalidoError);
  });

  it("aceita texto com exatamente 3 caracteres (mínimo válido)", async () => {
    const servico = new BuscaInteligenteService(
      criarLlmFake(JSON.stringify(filtroSoDestino))
    );

    // Não deve lançar erro
    await expect(servico.interpretar("Rio", HOJE)).resolves.toBeDefined();
  });

  it("aceita texto com exatamente 300 caracteres (máximo válido)", async () => {
    const servico = new BuscaInteligenteService(
      criarLlmFake(JSON.stringify(filtroSoDestino))
    );
    const textoLimite = "a".repeat(300);

    await expect(servico.interpretar(textoLimite, HOJE)).resolves.toBeDefined();
  });

  // =============================================================
  // ERROS DE RESPOSTA DO LLM (RespostaInvalidaError)
  // =============================================================

  it("lança RespostaInvalidaError quando o LLM devolve texto puro (não JSON)", async () => {
    const servico = new BuscaInteligenteService(
      criarLlmFake("Desculpe, não entendi sua pergunta.")
    );

    await expect(
      servico.interpretar("voo para o Rio", HOJE)
    ).rejects.toThrow(RespostaInvalidaError);
  });

  it("lança RespostaInvalidaError quando o LLM devolve JSON com campo de tipo errado", async () => {
    // precoMaximo deveria ser number, não string
    const filtroInvalido = { ...filtroCompleto, precoMaximo: "barato" };
    const servico = new BuscaInteligenteService(
      criarLlmFake(JSON.stringify(filtroInvalido))
    );

    await expect(
      servico.interpretar("voo barato para o Rio", HOJE)
    ).rejects.toThrow(RespostaInvalidaError);
  });

  it("lança RespostaInvalidaError quando classeAssento tem valor fora do enum", async () => {
    const filtroInvalido = { ...filtroCompleto, classeAssento: "PRIMEIRA_CLASSE" };
    const servico = new BuscaInteligenteService(
      criarLlmFake(JSON.stringify(filtroInvalido))
    );

    await expect(
      servico.interpretar("voo primeira classe", HOJE)
    ).rejects.toThrow(RespostaInvalidaError);
  });

  it("lança RespostaInvalidaError quando data está em formato errado (DD/MM/AAAA)", async () => {
    const filtroInvalido = { ...filtroCompleto, data: "14/11/2026" };
    const servico = new BuscaInteligenteService(
      criarLlmFake(JSON.stringify(filtroInvalido))
    );

    await expect(
      servico.interpretar("voo para Rio dia 14/11", HOJE)
    ).rejects.toThrow(RespostaInvalidaError);
  });

  it("lança RespostaInvalidaError quando precoMaximo é negativo", async () => {
    const filtroInvalido = { ...filtroCompleto, precoMaximo: -100 };
    const servico = new BuscaInteligenteService(
      criarLlmFake(JSON.stringify(filtroInvalido))
    );

    await expect(
      servico.interpretar("voo para o Rio", HOJE)
    ).rejects.toThrow(RespostaInvalidaError);
  });

  it("lança RespostaInvalidaError quando o LLM devolve string vazia", async () => {
    const servico = new BuscaInteligenteService(criarLlmFake(""));

    await expect(
      servico.interpretar("voo para o Rio", HOJE)
    ).rejects.toThrow(RespostaInvalidaError);
  });

  it("lança RespostaInvalidaError quando o LLM devolve um array em vez de objeto", async () => {
    const servico = new BuscaInteligenteService(criarLlmFake("[]"));

    await expect(
      servico.interpretar("voo para o Rio", HOJE)
    ).rejects.toThrow(RespostaInvalidaError);
  });

  // =============================================================
  // COMPORTAMENTO DO PROMPT (verificado indiretamente via LlmFake)
  // =============================================================

  it("passa origens e destinos disponíveis para o LLM quando fornecidos", async () => {
    // Captura o que foi enviado ao LLM para verificar que as cidades
    // aparecem no prompt de sistema.
    let promptSistemaRecebido = "";

    const llmSpy: LlmClient = {
      async completar({ system }) {
        promptSistemaRecebido = system;
        return JSON.stringify(filtroSoDestino);
      },
    };

    const servico = new BuscaInteligenteService(llmSpy);
    await servico.interpretar(
      "voo para os EUA",
      HOJE,
      ["São Paulo", "Belo Horizonte"],
      ["Nova Iorque", "Miami"]
    );

    expect(promptSistemaRecebido).toContain("Nova Iorque");
    expect(promptSistemaRecebido).toContain("Miami");
    expect(promptSistemaRecebido).toContain("São Paulo");
  });

  it("inclui a data de hoje no prompt de sistema", async () => {
    let promptSistemaRecebido = "";

    const llmSpy: LlmClient = {
      async completar({ system }) {
        promptSistemaRecebido = system;
        return JSON.stringify(filtroSoDestino);
      },
    };

    const servico = new BuscaInteligenteService(llmSpy);
    await servico.interpretar("voo para o Rio", HOJE);

    // HOJE = 2026-11-09
    expect(promptSistemaRecebido).toContain("2026-11-09");
  });
});
