# ✈️ Frontend — Sistema de Compra de Passagens de Avião

Interface web em **React + TypeScript**, estilizada com **Material UI (MUI)**, que consome a API do [backend](../backend/README.md).

> Para a visão geral do projeto (frontend + backend), veja o [README da raiz](../README.md).

---

## 📑 Índice

1. [Como o frontend funciona](#-como-o-frontend-funciona)
2. [POO no frontend: o que muda em relação ao backend](#-poo-no-frontend-o-que-muda-em-rela%C3%A7%C3%A3o-ao-backend)
3. [Tecnologias](#-tecnologias)
4. [Estrutura de pastas](#-estrutura-de-pastas)
5. [Instalação e execução](#-instala%C3%A7%C3%A3o-e-execu%C3%A7%C3%A3o)
6. [Mapa de telas](#-mapa-de-telas)
7. [Limitações conhecidas](#-limita%C3%A7%C3%B5es-conhecidas)

---

## 🧠 Como o frontend funciona

O frontend é organizado por responsabilidade, parecido com o backend:

```
pages/         → as telas da aplicação (cada rota tem uma página)
      ↓
components/    → peças visuais reutilizáveis (cards, modais, formulários)
      ↓
api/           → funções que chamam a API do backend
      ↓
Backend (http://localhost:3000)
```

O **estado de quem está logado** fica disponível para qualquer tela através do `AuthContext` (Context API do React) — assim, não é preciso passar manualmente "quem é o usuário" de tela em tela.

Toda chamada para o backend passa por um único ponto central (`apiClient.ts`), que já cuida de duas coisas automaticamente: enviar a identificação do usuário logado, e transformar erros da API em mensagens que as telas conseguem exibir.

---

## 🎓 POO no frontend: o que muda em relação ao backend

O backend usa classes e herança "de verdade" (uma classe `UsuarioVIP` que estende `Usuario`, por exemplo). O frontend não recebe essas classes — ele recebe apenas **dados** (JSON) vindos da API, sem os métodos que existiam no backend.

Para não perder a regra de negócio na tradução, o frontend recria, de forma simples, o que o polimorfismo do backend fazia: existe um arquivo (`utils/permissoes.ts`) com funções como `possuiBeneficiosVIP(usuario)` e `isAdmin(usuario)`, que olham o campo `tipo` do usuário e devolvem a resposta certa — a mesma regra do backend, só que escrita como função em vez de método de classe. É assim que telas como a navbar decidem mostrar ou esconder o menu de Administração, por exemplo.

Outros conceitos que aparecem no frontend:

| Conceito | Onde aparece |
|---|---|
| **Reaproveitamento (DRY)** | Componentes como `CardVoo`, `PrecoComDesconto` e `MapaAssentos` são usados em várias telas diferentes, sem duplicar código |
| **Tipagem (equivalente a contratos de classe)** | Cada entidade do backend (Usuário, Voo, Reserva...) tem um tipo TypeScript correspondente, garantindo que o frontend sempre saiba exatamente quais dados esperar |
| **Encapsulamento de lógica** | A lógica de "qual desconto é o melhor para este usuário" fica isolada em um único arquivo (`utils/descontos.ts`), e não é repetida em cada tela que precisa exibir um preço |

---

## 🛠 Tecnologias

| Tecnologia | Para que serve aqui |
|---|---|
| **React** | Biblioteca para construir a interface em componentes |
| **TypeScript** | Tipagem estática, evitando erros de "esqueci esse campo" |
| **Vite** | Ferramenta que builda e serve o projeto durante o desenvolvimento |
| **React Router** | Controla a navegação entre as telas (rotas) |
| **Material UI (MUI)** | Biblioteca de componentes visuais prontos (botões, cards, tabelas, formulários) |

---

## 🌳 Estrutura de pastas

```
frontend/
└── src/
    ├── main.tsx         → ponto de entrada, monta os provedores globais
    ├── App.tsx          → define todas as rotas da aplicação
    ├── pages/           → as telas (Login, Voos, MinhasReservas...)
    ├── components/       → peças visuais reutilizáveis
    ├── api/              → funções que chamam o backend
    ├── contexts/         → estado global (autenticação)
    ├── hooks/            → funções reutilizáveis ligadas ao React (ex: useAuth)
    ├── utils/            → funções auxiliares (formatação, permissões, descontos)
    └── types/            → os "formatos" dos dados (espelham as entidades do backend)
```

---

## 💻 Instalação e execução

### Pré-requisitos
- [Node.js](https://nodejs.org/) 18 ou superior
- O **backend precisa estar rodando** (veja o [README do backend](../backend/README.md)) — o frontend não funciona sem ele

### Passo a passo

```bash
cd frontend
npm install     # instala as dependências
npm run dev     # inicia o servidor de desenvolvimento
```

Acesse **http://localhost:5173** no navegador.

> 💡 As chamadas que o frontend faz para `/api/...` são automaticamente redirecionadas para o backend (configurado em `vite.config.ts`) — por isso não é preciso alterar nenhum endereço, desde que o backend esteja rodando na porta padrão (3000).

### Outros comandos úteis

| Comando | O que faz |
|---|---|
| `npm run build` | Gera a versão final, otimizada, para produção |
| `npm run preview` | Permite testar localmente a versão de produção |

---

## 🗺 Mapa de telas

| Tela | Quem pode acessar |
|---|---|
| Busca de voos | Qualquer pessoa |
| Detalhes do voo / seleção de assento | Qualquer pessoa (reservar exige login) |
| Login / Cadastro | Qualquer pessoa |
| Minhas Reservas | Usuário logado |
| Tornar-se VIP | Usuário logado |
| Notificações | Usuário logado |
| Gerenciar Voos / Descontos / Usuários / Relatórios | Apenas Administrador |

---

## ⚠️ Limitações conhecidas

- Não há atualização em tempo real (como WebSockets): o contador de notificações é atualizado periodicamente, a cada poucos segundos.
- Os relatórios administrativos são calculados no próprio navegador, a partir dos dados já existentes — não existe um endpoint de relatório dedicado no backend.
- A tela de cadastro permite criar uma conta diretamente como Administrador, apenas para facilitar testes — em um sistema real, isso nunca ficaria disponível ao público.
