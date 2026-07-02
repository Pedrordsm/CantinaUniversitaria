# Cantina Universitária

Sistema web completo para gestão de cantina universitária com três perfis de usuário (cliente, funcionário, gerente), cardápio online, carrinho de compras, gestão de pedidos em tempo real e relatórios gerenciais.

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand |
| Backend | Node.js, Express, TypeScript, Socket.io |
| Banco de dados | PostgreSQL (Aiven) |
| Autenticação | JWT + bcryptjs |
| Containerização | Docker + Docker Compose |

---

## Rodando com Docker (recomendado)

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) instalado
- Conta no [Aiven](https://aiven.io) com serviço PostgreSQL criado

### 1. Configure as variáveis de ambiente

```bash
cd backend
copy .env.example .env
```

Edite o `backend/.env` com suas credenciais:

```env
PORT=3001
NODE_ENV=development

DB_HOST=seu-host.aivencloud.com
DB_PORT=sua-porta
DB_NAME=seu-banco
DB_USER=avnadmin
DB_PASSWORD=sua-senha
DB_SSL=true

JWT_SECRET=troque-por-uma-chave-segura
JWT_EXPIRES_IN=7d

UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

> O arquivo `.env` nunca deve ser enviado ao repositório — ele já está no `.gitignore`.

### 2. Crie as tabelas no banco

Na primeira vez, rode a migração para criar as tabelas no PostgreSQL:

```bash
cd backend
npm install
npm run migrate
```

Opcionalmente, popule com dados iniciais de teste:

```bash
npm run seed
```

### 3. Suba os containers

Na raiz do projeto (onde está o `docker-compose.yml`):

```bash
docker-compose up -d --build
```

| Flag | O que faz |
|---|---|
| `-d` | Roda em background (detached) |
| `--build` | Reconstrói as imagens antes de subir |

### 4. Acesse a aplicação

| Serviço | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend (API) | http://localhost:3001/api/health |

### Comandos úteis

```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver logs só do backend
docker-compose logs -f backend

# Parar os containers
docker-compose down

# Parar e remover volumes (apaga uploads)
docker-compose down -v

# Rebuildar sem cache (após mudanças no código)
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Como funciona a comunicação interna

```
Navegador
    │
    ▼
Nginx (porta 5173)
    ├── /api/*       → proxy → backend:3001
    ├── /uploads/*   → proxy → backend:3001
    ├── /socket.io/* → proxy → backend:3001 (WebSocket)
    └── /*           → index.html (SPA fallback)
```

O Nginx é responsável por rotear as chamadas de API para o container do backend. O frontend nunca faz chamadas diretas para `localhost:3001` — tudo passa pelo Nginx.

---

## Rodando localmente (sem Docker)

### Pré-requisitos

- Node.js v18+
- npm
- Conta no [Aiven](https://aiven.io) com serviço PostgreSQL criado

### 1. Instale as dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure o backend

```bash
cd backend
copy .env.example .env
# edite o .env com suas credenciais
```

### 3. Crie as tabelas e popule o banco

```bash
cd backend
npm run migrate
npm run seed
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

Acesse em `http://localhost:5173`.

> Em modo local, o Vite faz o proxy `/api → localhost:3001` automaticamente. Não é necessário configurar nada extra.

---

## Contas de teste (criadas pelo seed)

| Email | Senha | Perfil |
|---|---|---|
| gerente@cantina.com | 123456 | Gerente |
| funcionario@cantina.com | 123456 | Funcionário |
| cliente@cantina.com | 123456 | Cliente |

> Contas de funcionário e gerente não podem ser criadas pelo cadastro público — apenas pelo seed ou diretamente no banco.

---

## Modo demo (offline)

Para rodar sem backend algum, edite `frontend/src/lib/config.ts`:

```ts
isDemoMode: true
```

Os dados ficam no `localStorage` do navegador. Útil para testar a interface sem banco de dados.

---

## Estrutura do projeto

```
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── .env               # credenciais (não versionado)
│   ├── .env.example       # template
│   ├── uploads/           # imagens dos produtos (gerado em runtime)
│   └── src/
│       ├── database/      # connection, migrate, seed
│       ├── middleware/     # auth JWT, upload Multer
│       ├── routes/        # auth, products, orders, users, reports...
│       ├── types/         # interfaces + mappers DB→frontend
│       ├── server.ts
│       └── socket.ts
└── frontend/
    ├── Dockerfile
    ├── nginx.conf          # configuração do Nginx com proxy para o backend
    └── src/
        ├── lib/            # axios, config, demoApi
        ├── pages/          # client, staff, manager
        ├── store/          # authStore, cartStore
        └── types/
```
