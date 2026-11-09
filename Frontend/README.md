# ✈️ Frontend — Sistema de Compra de Passagens de Avião

Interface web em **React + TypeScript**, estilizada com **Material UI**, que consome a API do [backend](../Backend/README.md). Inclui o componente de busca inteligente em linguagem natural.

> Para a visão geral do projeto (frontend + backend + IA), veja o [README da raiz](../README.md).

---

## 📑 Índice

1. [Como o frontend funciona](#-como-o-frontend-funciona)
2. [Busca inteligente no frontend](#-busca-inteligente-no-frontend)
3. [Compra de múltiplos assentos](#-compra-de-múltiplos-assentos)
4. [POO no frontend: o que muda em relação ao backend](#-poo-no-frontend-o-que-muda-em-relação-ao-backend)
5. [Tecnologias](#-tecnologias)
6. [Estrutura de pastas](#-estrutura-de-pastas)
7. [Instalação e execução](#-instalação-e-execução)
8. [Mapa de telas](#-mapa-de-telas)
9. [Limitações conhecidas](#-limitações-conhecidas)

---

## 🧠 Como o frontend funciona

```
pages/         → as telas da aplicação (cada rota tem uma página)
      ↓
components/    → peças visuais reutilizáveis (cards, modais, formulários)
      ↓
api/           → funções que chamam a API do backend
      ↓
Backend (http://localhost:3000)
```

O **estado de quem está logado** fica disponível globalmente via `AuthContext` (Context API do React). Toda chamada ao backend passa pelo `apiClient.ts`, que injeta automaticamente o header `x-user-id` e padroniza o tratamento de erros.

---

## 🤖 Busca inteligente no frontend

O componente `BuscaInteligente.tsx` aparece no topo da tela de voos (apenas para usuários logados) e permite descrever a viagem em texto livre.

### Fluxo visual

1. Usuário digita: `"voo para o Rio na sexta até R$ 500"`
2. Clica em **Buscar com IA** — spinner aparece enquanto o Gemini processa
3. Os filtros interpretados são exibidos como chips:
   `Entendi:` `Para: Rio de Janeiro` `Data: 13/11/2026` `Até R$ 500`
4. Os voos correspondentes substituem a listagem normal
5. O usuário pode clicar em **Limpar** para voltar à listagem original

### Degradação elegante

Se a IA falhar (API fora do ar, resposta inválida, limite de requisições), o erro é exibido no próprio componente e a busca comum por origem/destino continua disponível abaixo, sem nenhum impacto.

---

## 🛋️ Compra de múltiplos assentos

Na tela de detalhes do voo, o usuário pode selecionar **até 4 assentos** de uma vez:

1. **Clique em um assento** para selecioná-lo (ícone com borda destacada)
2. **Clique novamente** para desselecionar
3. O contador `X / 4 assentos selecionados` mostra o progresso em tempo real
4. Assentos além do limite ficam esmaecidos com tooltip explicativo
5. Uma tabela aparece com uma linha por assento — cada linha tem um campo **CPF do passageiro** (formatado automaticamente como `000.000.000-00`)
6. O botão `Reservar X passagem(ns)` só ativa quando todos os CPFs têm 11 dígitos
7. O total estimado é calculado em tempo real

---

## 🎓 POO no frontend: o que muda em relação ao backend

O backend usa classes e herança (ex: `UsuarioVIP extends Usuario`). O frontend recebe apenas **dados JSON** da API, sem os métodos. Para não perder a regra de negócio:

- `utils/permissoes.ts` tem funções como `possuiBeneficiosVIP(usuario)` e `isAdmin(usuario)` que replicam a lógica do backend consultando o campo `tipo`
- Tipos TypeScript em `types/entidades.ts` espelham exatamente as entidades do backend, garantindo que o frontend saiba quais dados esperar

Outros princípios presentes:

| Conceito | Onde aparece |
|---|---|
| **Reutilização (DRY)** | `CardVoo`, `PrecoComDesconto`, `MapaAssentos` usados em várias telas |
| **Contratos de tipo** | Cada entidade do backend tem uma interface TypeScript correspondente |
| **Encapsulamento de lógica** | Lógica de desconto isolada em `utils/descontos.ts` |
| **Separação de responsabilidades** | `MapaAssentos` só notifica o pai via callback — não faz chamadas de API |

---

## 🛠 Tecnologias

| Tecnologia | Para que serve |
|---|---|
| **React** | Biblioteca para construir a interface em componentes |
| **TypeScript** | Tipagem estática |
| **Vite** | Build tool e servidor de desenvolvimento |
| **React Router** | Navegação entre telas |
| **Material UI (MUI)** | Componentes visuais prontos (botões, cards, tabelas, formulários) |

---

## 🌳 Estrutura de pastas

```
Frontend/src/
├── main.tsx              → ponto de entrada
├── App.tsx               → define as rotas
├── pages/
│   ├── Voos.tsx          → busca comum + busca inteligente integradas
│   ├── DetalhesVoo.tsx   → seleção de múltiplos assentos + CPFs
│   ├── MinhasReservas.tsx
│   ├── Login.tsx / Cadastro.tsx
│   └── admin/            → telas administrativas
├── components/
│   ├── voos/
│   │   ├── BuscaInteligente.tsx   → componente de busca com IA
│   │   ├── MapaAssentos.tsx       → grade visual, seleção múltipla
│   │   ├── CardVoo.tsx
│   │   └── FiltroBusca.tsx
│   ├── reservas/
│   └── ...
├── api/
│   ├── apiClient.ts       → wrapper HTTP central (injeta x-user-id)
│   ├── vooApi.ts          → inclui buscarInteligente()
│   ├── reservaApi.ts      → inclui criarMultiplas()
│   └── ...
├── contexts/              → AuthContext (estado de login global)
├── hooks/                 → useAuth e outros
├── utils/                 → permissoes, descontos, formatadores
└── types/
    ├── entidades.ts       → interfaces (Voo, Reserva, FiltrosBusca, ...)
    └── enums.ts           → espelhos dos enums do backend
```

---

## 💻 Instalação e execução

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- O **backend precisa estar rodando** ([README do backend](../Backend/README.md))

### Passo a passo

```bash
cd Frontend
npm install
npm run dev
```

Acesse **http://localhost:5173**.

> As chamadas para `/api/...` são redirecionadas automaticamente para o backend (configurado em `vite.config.ts`) — não é preciso alterar nenhum endereço.

### Outros comandos

| Comando | O que faz |
|---|---|
| `npm run build` | Gera a versão otimizada para produção |
| `npm run preview` | Testa localmente a versão de produção |

---

## 🗺 Mapa de telas

| Tela | Quem pode acessar | Novidades |
|---|---|---|
| Busca de voos | Qualquer pessoa | **Busca inteligente** (logados) |
| Detalhes do voo | Qualquer pessoa (reservar exige login) | **Múltiplos assentos + CPF** |
| Login / Cadastro | Qualquer pessoa | — |
| Minhas Reservas | Usuário logado | — |
| Tornar-se VIP | Usuário logado | — |
| Notificações | Usuário logado | — |
| Gerenciar Voos / Descontos / Usuários / Relatórios | Apenas Administrador | — |

---

## ⚠️ Limitações conhecidas

- Sem atualização em tempo real (WebSockets) — o contador de notificações é atualizado periodicamente.
- Relatórios administrativos calculados no navegador, não em endpoint dedicado.
- A tela de cadastro permite criar conta como Administrador diretamente — apenas para facilitar testes.
