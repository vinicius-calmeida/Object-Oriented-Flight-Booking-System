# ✈️ Backend — Sistema de Compra de Passagens de Avião

API REST em **TypeScript + Node.js + Express**, com banco de dados **SQLite** gerenciado pelo **TypeORM**. Centraliza toda a regra de negócio do sistema, incluindo o recurso de busca inteligente com LLM (Gemini).

> Para a visão geral do projeto (frontend + backend + IA), veja o [README da raiz](../README.md).

---

## 📑 Índice

1. [Como o backend funciona](#-como-o-backend-funciona)
2. [Busca inteligente com IA](#-busca-inteligente-com-ia)
3. [Conceitos de POO usados aqui](#-conceitos-de-poo-usados-aqui)
4. [Tecnologias](#-tecnologias)
5. [Estrutura de pastas](#-estrutura-de-pastas)
6. [Instalação e execução](#-instalação-e-execução)
7. [Principais endpoints da API](#-principais-endpoints-da-api)
8. [Regras de negócio importantes](#-regras-de-negócio-importantes)
9. [Limitações conhecidas](#-limitações-conhecidas)

---

## 🧠 Como o backend funciona

O código é organizado em **camadas**, cada uma com uma única responsabilidade:

```
Requisição HTTP
      ↓
Controllers     → recebe a requisição, identifica quem está pedindo, devolve a resposta
      ↓
Services        → regra de negócio (o que pode, o que não pode, cálculos)
      ↓
Repositories    → busca e salva dados no banco
      ↓
Models          → representam as entidades do sistema (Usuário, Voo, Reserva...)
      ↓
Banco de dados (SQLite)
```

Cada camada só conhece a imediatamente abaixo dela. Um Controller nunca fala direto com o banco; um Service nunca monta resposta HTTP.

---

## 🤖 Busca inteligente com IA

Permite que o usuário descreva a viagem em texto livre. O sistema usa o Gemini para extrair filtros estruturados e buscar os voos correspondentes.

### Arquitetura

```
VooController (POST /voos/busca-inteligente)
    │
    ├── busca origens/destinos reais do banco (VooService.listarOrigensDestinos)
    │
    ▼
BuscaInteligenteService
    ├── valida o texto de entrada (3–300 caracteres)
    ├── monta o prompt com cidades reais + data de hoje
    ├── LlmClient (interface)  ──►  GeminiLlmClient (implementação real)
    │                               LlmFake (usada nos testes unitários)
    ├── recebe JSON do modelo
    └── valida com FiltrosBuscaSchema (zod)
    │
    ▼
VooService.buscarComFiltros(filtros)
    ├── busca por origem/destino no banco (LIKE)
    ├── filtra por data
    ├── filtra por classe de assento (contarAssentosDisponiveis)
    └── filtra por preço máximo
```

### Por que injetar as cidades reais no prompt?

Sem isso, pesquisar "voo para os EUA" faria o LLM retornar `destino: "Estados Unidos"` — que não faria match com "Nova Iorque" no banco. Ao injetar a lista real de destinos cadastrados, o modelo escolhe a cidade correta diretamente.

### Tratamento de erros

| Situação | Erro | Código HTTP |
|---|---|---|
| Texto muito curto ou longo | `TextoInvalidoError` | 400 |
| Modelo retornou JSON inválido | `RespostaInvalidaError` | 422 |
| Falha na API do Gemini | Erro genérico | 503 |

### Configuração

Crie o arquivo `.env` na raiz da pasta `Backend/` (nunca sobe para o Git):

```env
GEMINI_API_KEY=sua_chave_aqui         # obtenha em aistudio.google.com/apikey
LLM_MODEL=gemini-3.1-flash-lite       # verifique o nome atual em aistudio.google.com/docs/models
```

O arquivo `.env.example` (que vai para o Git) mostra as variáveis necessárias sem os valores.

---

## 🎓 Conceitos de POO usados aqui

| Conceito | Onde aparece |
|---|---|
| **Abstração** | `Usuario` é abstrata — nunca existe um "usuário genérico", sempre Padrão, VIP ou Admin |
| **Herança** | `UsuarioPadrao`, `UsuarioVIP` e `Admin` herdam de `Usuario` |
| **Polimorfismo** | `getPermissoes()`, `isAdmin()` e `possuiBeneficiosVIP()` têm comportamento diferente por subclasse |
| **Encapsulamento** | Senha só acessível via `validarSenha()`; estado do assento só muda via `reservar()`/`liberar()` |
| **Injeção de dependência** | `BuscaInteligenteService` recebe `LlmClient` pelo construtor — permite trocar de provedor e usar `LlmFake` nos testes |
| **Interface** | `LlmClient` desacopla o serviço da implementação concreta do Gemini |
| **Enums** | `StatusVoo`, `ClasseAssento`, `TipoUsuario` etc. |

---

## 🛠 Tecnologias

| Tecnologia | Para que serve |
|---|---|
| **TypeScript** | Linguagem principal — tipagem estática |
| **Node.js** | Ambiente de execução |
| **Express** | Framework de rotas HTTP |
| **TypeORM** | ORM — ponte entre classes e tabelas do banco |
| **SQLite** | Banco de dados em arquivo local |
| **@google/genai** | SDK oficial do Google Gemini |
| **Zod** | Validação de schema da resposta do LLM |
| **express-rate-limit** | Limite de requisições na rota de IA |
| **Vitest** | Framework de testes unitários |

---

## 🌳 Estrutura de pastas

```
Backend/src/
├── app.ts                          → ponto de entrada, monta o servidor
├── enums/                          → StatusVoo, ClasseAssento, TipoUsuario...
├── models/                         → Usuario, Voo, Reserva, Assento...
├── repositories/                   → acesso direto ao banco
├── services/
│   ├── busca-inteligente/
│   │   ├── BuscaInteligenteService.ts
│   │   ├── filtros.ts              → schema zod + tipo FiltrosBusca
│   │   └── prompt.ts               → montarPromptSistema()
│   ├── VooService.ts
│   ├── ReservaService.ts
│   └── ...
├── llm/
│   ├── LlmClient.ts                → interface
│   └── GeminiLlmClient.ts          → implementação real
├── controllers/                    → rotas HTTP
├── database/                       → configuração TypeORM
├── utils/                          → funções auxiliares
└── tests/
    ├── BuscaInteligenteService.test.ts   → 21 testes unitários (LlmFake)
    ├── testeSistema.ts             → demonstração de todos os fluxos
    └── seed.ts                     → popula banco com dados de exemplo
```

---

## 💻 Instalação e execução

### Pré-requisito

[Node.js](https://nodejs.org/) 18 ou superior.

### Passo a passo

```bash
cd Backend
npm install

# Configure as variáveis de ambiente:
cp .env.example .env
# Edite .env: preencha GEMINI_API_KEY e LLM_MODEL

npm run dev     # inicia em modo desenvolvimento (reinicia automaticamente)
```

Quando tudo der certo:
```
✅ Conexão com o banco de dados (SQLite) estabelecida com sucesso.
🚀 Servidor rodando em http://localhost:3000
```

O arquivo `database.sqlite` é criado automaticamente na primeira execução.

### Todos os comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia em modo desenvolvimento |
| `npm run build` | Compila TypeScript para JavaScript |
| `npm start` | Executa a versão compilada |
| `npm test` | Roda os 21 testes unitários (sem usar a API real) |
| `npm run test:sistema` | Demonstra todos os fluxos no terminal via Services |
| `npx ts-node src/tests/seed.ts` | Popula o banco com 12 voos e 3 usuários de exemplo |

> Para testar com o banco zerado: pare o servidor, apague `database.sqlite` e rode `npm run dev` novamente.

---

## 📡 Principais endpoints da API

| Recurso | Endpoints |
|---|---|
| Autenticação | `POST /auth/cadastro`, `POST /auth/login` |
| Usuários | `GET /usuarios`, `GET /usuarios/:id`, `POST /usuarios/upgrade-vip`, `GET /usuarios/:id/notificacoes` |
| Voos | `GET /voos`, `GET /voos/:id`, `POST /voos` (admin), `PUT /voos/:id` (admin), `PATCH /voos/:id/atrasar` (admin), `PATCH /voos/:id/cancelar` (admin), `DELETE /voos/:id` (admin) |
| **Busca inteligente** | **`POST /voos/busca-inteligente`** — body: `{ texto: string }`, header: `x-user-id` |
| Reservas | `POST /reservas`, `POST /reservas/multiplas`, `GET /reservas/minhas`, `POST /reservas/:id/confirmar-pagamento`, `PATCH /reservas/:id/cancelar` |
| Descontos | `GET /descontos/ativos`, `POST /descontos` (admin) |

### Busca inteligente — exemplo de uso

```bash
curl -X POST http://localhost:3000/voos/busca-inteligente \
  -H "Content-Type: application/json" \
  -H "x-user-id: <id-do-usuario>" \
  -d '{"texto":"quero um voo barato para o Rio na sexta"}'
```

Resposta:
```json
{
  "filtros": {
    "origem": null,
    "destino": "Rio de Janeiro",
    "data": "2026-11-13",
    "classeAssento": null,
    "precoMaximo": null
  },
  "voos": [ ... ]
}
```

### Reserva múltipla — exemplo de uso

```bash
curl -X POST http://localhost:3000/reservas/multiplas \
  -H "Content-Type: application/json" \
  -H "x-user-id: <id-do-usuario>" \
  -d '{
    "vooId": "<id-do-voo>",
    "passageiros": [
      { "assentoId": "<id-1>", "cpf": "12345678901" },
      { "assentoId": "<id-2>", "cpf": "98765432100" }
    ]
  }'
```

---

## 📐 Regras de negócio importantes

- Voos passam por status automáticos: `NOVA` → `A_VENDA` → `ULTIMAS_PASSAGENS` → `ESGOTADA` → `REALIZADO`. `ATRASADA` e `CANCELADA` são definidos manualmente pelo admin.
- Cancelar um voo reembolsa automaticamente todas as reservas e notifica os passageiros.
- Usuário Padrão só reserva assento Econômico; VIP e Admin podem reservar qualquer classe.
- Máximo de **4 assentos por compra**, cada um com CPF do passageiro.
- Descontos Gerais valem para qualquer usuário; descontos VIP só para quem tem benefícios VIP. O melhor desconto disponível é aplicado automaticamente — eles nunca se somam.
- A rota de busca inteligente é limitada a **10 requisições por minuto por IP**.

---

## ⚠️ Limitações conhecidas

- Senhas em texto puro (sem hash) — adequado apenas para fins didáticos.
- Autenticação via header `x-user-id` sem criptografia — não seguro para produção.
- Pagamento simbólico sem integração financeira real.
- O LLM pode errar na interpretação — validação com zod captura os erros; a busca comum funciona como fallback.
