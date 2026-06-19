# Cantina Universitária

Sistema web completo para gestão de cantina universitária com três perfis de usuário (cliente, funcionário, gerente), cardápio online, carrinho de compras, gestão de pedidos em tempo real e relatórios gerenciais.

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand |
| Backend | Node.js, Express, TypeScript, Socket.io |
| Banco de dados | PostgreSQL (Aiven) |
| Autenticação | JWT + bcryptjs |

## Pré-requisitos

- Node.js v18+
- npm
- Conta no [Aiven](https://aiven.io) com serviço PostgreSQL criado

## Configuração

### 1. Clone o repositório e instale as dependências

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Configure as variáveis de ambiente do backend

```bash
cd backend
copy .env.example .env
```

Edite o `.env` com suas credenciais do Aiven:

```env
DB_HOST=seu-host.aivencloud.com
DB_PORT=sua-porta
DB_NAME=seu-banco
DB_USER=avnadmin
DB_PASSWORD=sua-senha
DB_SSL=true
```

> Nunca suba o `.env` para o repositório. Ele já está no `.gitignore`.

### 3. Crie as tabelas e popule o banco

```bash
cd backend
npm run migrate   # Cria as tabelas
npm run seed      # Insere dados iniciais
```

### 4. Inicie os servidores

```bash
# Terminal 1 — Backend (porta 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (porta 5173)
cd frontend
npm run dev
```

Acesse em `http://localhost:5173`

## Contas de teste (criadas pelo seed)

| Email | Senha | Perfil |
|---|---|---|
| gerente@cantina.com | 123456 | Gerente |
| funcionario@cantina.com | 123456 | Funcionário |
| cliente@cantina.com | 123456 | Cliente |

> Contas de funcionário e gerente não podem ser criadas pelo cadastro público — apenas pelo seed ou diretamente no banco.

## Armazenamento de imagens

As imagens de produtos são salvas localmente na pasta `backend/uploads/` e servidas em `http://localhost:3001/uploads/<arquivo>`. A pasta está no `.gitignore` e não é enviada ao repositório.

## Modo demo (offline)

Para rodar sem backend, edite `frontend/src/lib/config.ts`:

```ts
isDemoMode: true
```

Os dados ficam no `localStorage` do navegador.

## Estrutura

```
├── backend/
│   ├── src/
│   │   ├── database/      # connection, migrate, seed
│   │   ├── middleware/    # auth JWT, upload Multer
│   │   ├── routes/        # auth, products, orders, users, reports...
│   │   ├── types/         # interfaces + mappers DB→frontend
│   │   ├── server.ts
│   │   └── socket.ts
│   ├── uploads/           # imagens (gerado em runtime, não versionado)
│   ├── .env               # credenciais (não versionado)
│   └── .env.example       # template
└── frontend/
    └── src/
        ├── lib/           # axios, config, demoApi
        ├── pages/         # client, staff, manager
        ├── store/         # authStore, cartStore
        └── types/
```
