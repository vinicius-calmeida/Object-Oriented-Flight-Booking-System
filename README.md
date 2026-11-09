# ✈️ Sistema de Compra de Passagens de Avião

Projeto **fullstack** que simula um sistema de venda de passagens aéreas, com três tipos de usuário (Padrão, VIP e Administrador), gerenciamento de voos, reservas, pagamento simbólico, upgrade de conta e descontos. Inclui um recurso de **busca inteligente em linguagem natural** alimentado por um LLM (Gemini), desenvolvido como extensão de portfólio para demonstrar integração de IA em software orientado a objetos.

O projeto é dividido em duas partes independentes:

| Parte | Tecnologia | O que faz |
|---|---|---|
| **[`Backend/`](./Backend/README.md)** | TypeScript, Node.js, Express, TypeORM, SQLite | API REST com toda a regra de negócio e persistência de dados |
| **[`Frontend/`](./Frontend/README.md)** | TypeScript, React, Vite, Material UI | Interface web que consome essa API |

Cada pasta tem seu próprio README com detalhes técnicos. Este README dá a visão geral do projeto como um todo.

---

## 📑 Índice

1. [Sobre o projeto](#-sobre-o-projeto)
2. [Busca inteligente com IA](#-busca-inteligente-com-ia)
3. [Tipos de usuário](#-tipos-de-usuário-e-o-que-cada-um-pode-fazer)
4. [Principais funcionalidades](#-principais-funcionalidades)
5. [Tecnologias](#-tecnologias-utilizadas)
6. [Estrutura de pastas](#-estrutura-de-pastas)
7. [Como rodar](#-como-rodar-o-projeto)
8. [Roteiro de teste](#-roteiro-de-teste-completo)
9. [Decisões e limitações](#-decisões-de-projeto-e-limitações-conhecidas)

---

## 📖 Sobre o projeto

O sistema simula uma agência de viagens aéreas. Um administrador cadastra voos e descontos; usuários buscam voos — em texto livre ou por filtros —, escolhem até **4 assentos** em uma única compra (informando o CPF de cada passageiro) e confirmam o pagamento simbolicamente; usuários podem evoluir para uma conta VIP e passar a ter acesso a assentos exclusivos e descontos automáticos.

O backend é construído em camadas separadas com princípios de Programação Orientada a Objetos. O frontend consome a API exclusivamente por HTTP, como em um sistema real.

---

## 🤖 Busca inteligente com IA

O usuário descreve a viagem em linguagem natural e o sistema interpreta o texto, extrai filtros estruturados e devolve os voos correspondentes.

### Como funciona

```
Frontend (BuscaInteligente.tsx)
    │
    │  POST /api/voos/busca-inteligente  { texto: "voo barato para o Rio na sexta" }
    ▼
VooController  ──►  busca origens/destinos reais do banco
    │
    ▼
BuscaInteligenteService
    ├── monta prompt com cidades reais + data de hoje
    ├── GeminiLlmClient  ──►  API Gemini (gemini-3.1-flash-lite)
    ├── recebe JSON do modelo
    └── valida com schema zod
    │
    ▼
VooService.buscarComFiltros()
    └── aplica filtros: data, classe de assento, preço máximo
    │
    ▼
{ filtros, voos }  ──►  Frontend exibe filtros interpretados + lista de voos
```

### Exemplos

| Texto digitado | Filtros extraídos |
|---|---|
| `"voo barato para o Rio na sexta"` | `destino: "Rio de Janeiro"`, `data: "2026-11-13"` |
| `"quero ir para os EUA"` | `destino: "Nova Iorque"` *(mapeado via lista de destinos reais do banco)* |
| `"assento VIP para Paris até R$ 5000"` | `destino: "Paris"`, `classeAssento: "VIP"`, `precoMaximo: 5000` |

### Decisões de arquitetura

| Decisão | Justificativa |
|---|---|
| `LlmClient` como interface | Desacopla o serviço do provedor. Para trocar Gemini por outro LLM, só muda a implementação concreta. |
| Validação com zod | LLMs podem devolver JSON inválido ou campos com tipo errado. O schema transforma qualquer resposta inesperada em erro tratável. |
| O modelo só interpreta, não executa | O LLM devolve filtros; o backend decide o que fazer. Reduz risco de prompt injection. |
| Cidades reais no prompt | O banco injeta a lista de origens e destinos cadastrados no prompt — o modelo escolhe dentre cidades reais em vez de inventar termos geográficos como "EUA". |
| Transparência para o usuário | Os filtros interpretados aparecem como chips ("Entendi: De X, Para Y...") — o usuário pode corrigir se o modelo errou. |
| Rate limiting (10 req/min) | Protege a cota gratuita da API do Gemini. |
| Degradação elegante | Se a IA falhar, a busca comum continua funcionando normalmente. |

### Configuração

1. Obtenha uma chave gratuita em [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Crie `Backend/.env` (não vai para o Git):

```env
GEMINI_API_KEY=sua_chave_aqui
LLM_MODEL=gemini-3.1-flash-lite
```

### Limitações

- O LLM pode errar em pedidos ambíguos — por isso os filtros são exibidos antes dos resultados.
- O nome das cidades depende do cadastro no banco. Se o banco tiver "Rio de Janeiro" e o modelo retornar "Rio", o match pode falhar se ele ignorar a lista injetada no prompt.
- Cada chamada consome créditos da API (o plano gratuito cobre bem o uso de portfólio).

---

## 👥 Tipos de usuário e o que cada um pode fazer

| Funcionalidade | Padrão | VIP | Administrador |
|---|:---:|:---:|:---:|
| Buscar e visualizar voos | ✅ | ✅ | ✅ |
| **Busca inteligente com IA** | ✅ | ✅ | ✅ |
| Comprar até 4 assentos por compra | ✅ | ✅ | ✅ |
| Comprar assento econômico | ✅ | ✅ | ✅ |
| Comprar assento VIP | ❌ | ✅ | ✅ |
| Receber descontos gerais | ✅ | ✅ | ✅ |
| Receber descontos exclusivos VIP | ❌ | ✅ | ✅ |
| Receber notificação antecipada de novos voos | ❌ | ✅ | ✅ |
| Cancelar a própria reserva | ✅ | ✅ | ✅ |
| Fazer upgrade para VIP | ✅ | — | — |
| Cadastrar / alterar voos | ❌ | ❌ | ✅ |
| Marcar voo como atrasado / cancelado | ❌ | ❌ | ✅ |
| Criar / remover descontos | ❌ | ❌ | ✅ |
| Gerenciar usuários | ❌ | ❌ | ✅ |
| Ver relatórios do sistema | ❌ | ❌ | ✅ |

---

## ⚙️ Principais funcionalidades

- **Autenticação** (cadastro e login)
- **Busca de voos** por origem/destino, com status automático e manual
- **Busca inteligente**: texto livre → Gemini extrai filtros → voos correspondentes
- **Compra de passagem**: selecione até 4 assentos, informe CPF por passageiro, confirme e pague simbolicamente
- **Histórico de reservas** completo
- **Cancelamento de reserva** pelo próprio usuário
- **Upgrade para VIP** com efeito imediato
- **Descontos automáticos** sem cupom — o melhor disponível é aplicado automaticamente
- **Notificações** em eventos importantes (compra, upgrade, novo voo, atraso, cancelamento)
- **Painel administrativo** completo (voos, descontos, usuários, relatórios)

---

## 🛠 Tecnologias utilizadas

| Camada | Tecnologias |
|---|---|
| Backend | TypeScript, Node.js, Express, TypeORM, SQLite |
| Frontend | TypeScript, React, Vite, React Router, Material UI |
| IA | Google Gemini API (`@google/genai`), Zod (validação de schema) |
| Testes | Vitest (21 testes unitários com LLM simulado) |

---

## 🌳 Estrutura de pastas

```
sistema-passagens-aereas/
├── README.md
├── Backend/
│   ├── README.md
│   └── src/
│       ├── llm/                     → interface LlmClient + GeminiLlmClient
│       ├── services/
│       │   └── busca-inteligente/   → BuscaInteligenteService, schema zod, prompt
│       ├── controllers/             → rotas HTTP (incluindo /voos/busca-inteligente)
│       ├── models/                  → entidades (Usuario, Voo, Reserva, Assento...)
│       ├── repositories/            → acesso ao banco
│       └── tests/                   → testes unitários + script de seed
└── Frontend/
    └── src/
        └── components/voos/
            └── BuscaInteligente.tsx → componente de busca em linguagem natural
```

---

## ▶️ Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- Chave de API do Gemini (gratuita em [aistudio.google.com/apikey](https://aistudio.google.com/apikey))

### Configuração inicial (uma única vez)

```bash
# 1. Configure a chave de API
cp Backend/.env.example Backend/.env
# Edite Backend/.env: preencha GEMINI_API_KEY e LLM_MODEL=gemini-3.1-flash-lite

# 2. (Opcional) Popule o banco com 12 voos e 3 usuários de exemplo
cd Backend && npm install
npx ts-node src/tests/seed.ts
```

### Rodando

**Terminal 1 — Backend:**
```bash
cd Backend
npm install
npm run dev
# Aguarde: 🚀 Servidor rodando em http://localhost:3000
```

**Terminal 2 — Frontend:**
```bash
cd Frontend
npm install
npm run dev
```

Acesse **http://localhost:5173**.

---

## 🧪 Roteiro de teste completo

1. Cadastre um **administrador** e, em aba anônima, um **usuário comum**.
2. Como administrador, **cadastre um voo** (ex: São Paulo → Rio de Janeiro).
3. Como usuário, use a **busca inteligente**: escreva `"voo para o Rio na próxima semana"` e observe os filtros interpretados.
4. Selecione até **4 assentos**, preencha o CPF de cada passageiro e confirme.
5. Em "Minhas Reservas", **confirme o pagamento**.
6. Faça **upgrade para VIP** e reserve um assento VIP.
7. Como administrador, **marque o voo como atrasado** — o usuário recebe notificação.
8. **Cancele o voo** — todas as reservas são reembolsadas automaticamente.

**Testes automatizados:**
```bash
cd Backend
npm test               # 21 testes unitários (sem chamar a API real)
npm run test:sistema   # demonstra todos os fluxos via Services no terminal
```

---

## 📋 Decisões de projeto e limitações conhecidas

Por ser um projeto acadêmico/portfólio:

- **Sem hash de senha** — senhas em texto puro, apenas para fins didáticos.
- **Autenticação simplificada** — sem JWT; o frontend envia o id do usuário em um header.
- **Pagamento simbólico** — sem integração com gateway real.
- **Banco local (SQLite)** — arquivo gerado automaticamente, sem servidor separado.
- **LLM pode errar** — os filtros são exibidos antes dos resultados para o usuário confirmar; a busca comum está sempre disponível como fallback.

### Próximos passos possíveis

- Cache de interpretações repetidas (reduz latência e custo de API)
- Conjunto de avaliação com frases de teste e métricas de acerto do LLM
- Deploy em nuvem (Railway, Render ou similar)
- Autenticação com JWT
- Substituição do SQLite por PostgreSQL
