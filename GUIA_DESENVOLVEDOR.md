# Guia do Desenvolvedor — Cantina Universitária

## Visão Geral

Sistema web completo para gestão de cantina universitária, com três perfis de usuário (cliente, funcionário, gerente), cardápio online, carrinho de compras, gestão de pedidos em tempo real e relatórios gerenciais.

---

## Stack Tecnológica

### Backend
| Tecnologia | Versão | Função |
|---|---|---|
| Node.js | 18+ | Runtime |
| TypeScript | 5.3 | Tipagem estática |
| Express | 4.18 | Framework HTTP |
| PostgreSQL | 14+ | Banco de dados (Aiven) |
| Socket.io | 4.6 | WebSocket / tempo real |
| JWT (jsonwebtoken) | 9.0 | Autenticação |
| bcryptjs | 2.4 | Hash de senhas |
| Multer | 1.4 | Upload de arquivos |
| ts-node-dev | 2.0 | Hot reload em dev |

### Frontend
| Tecnologia | Versão | Função |
|---|---|---|
| React | 18.2 | UI |
| TypeScript | 5.2 | Tipagem estática |
| Vite | 5.0 | Build tool / dev server |
| Tailwind CSS | 3.3 | Estilização |
| React Router DOM | 6.20 | Roteamento |
| TanStack Query | 5.13 | Cache e fetching de dados |
| Zustand | 4.4 | Estado global |
| Axios | 1.6 | Cliente HTTP |
| Socket.io-client | 4.6 | WebSocket |
| Recharts | 2.10 | Gráficos |
| date-fns | 3.0 | Formatação de datas |

---

## Estrutura do Projeto

```
CantinaUniversitaria/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── connection.ts      # Pool de conexão PostgreSQL (Aiven)
│   │   │   ├── migrate.ts         # Criação das tabelas
│   │   │   └── seed.ts            # Dados iniciais
│   │   ├── middleware/
│   │   │   ├── auth.ts            # Autenticação JWT + autorização por role
│   │   │   └── upload.ts          # Multer para upload de imagens
│   │   ├── routes/
│   │   │   ├── auth.ts            # Login, registro, /me
│   │   │   ├── products.ts        # CRUD de produtos
│   │   │   ├── categories.ts      # CRUD de categorias
│   │   │   ├── orders.ts          # Pedidos e fluxo de status
│   │   │   ├── notifications.ts   # Notificações por usuário
│   │   │   ├── reports.ts         # Relatórios gerenciais
│   │   │   └── users.ts           # Gestão de usuários (gerente)
│   │   ├── types/
│   │   │   └── index.ts           # Interfaces + funções de mapeamento DB→frontend
│   │   ├── server.ts              # Entry point, middlewares, rotas
│   │   └── socket.ts              # Inicialização e eventos Socket.io
│   ├── uploads/                   # Imagens de produtos (geradas em runtime, não versionado)
│   ├── .env                       # Variáveis de ambiente (NÃO versionar)
│   ├── .env.example               # Template de variáveis
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── lib/
    │   │   ├── api.ts             # Instância Axios com proxy e interceptors
    │   │   ├── config.ts          # isDemoMode toggle
    │   │   └── demoApi.ts         # Adapter offline (localStorage)
    │   ├── pages/
    │   │   ├── client/            # MenuPage, CartPage, OrdersPage
    │   │   ├── staff/             # StaffOrdersPage, ProductsPage
    │   │   └── manager/           # ReportsPage, UsersPage
    │   ├── store/
    │   │   ├── authStore.ts       # Zustand + persist
    │   │   └── cartStore.ts       # Zustand + persist
    │   └── types/index.ts         # Interfaces TypeScript do frontend
    ├── vite.config.ts             # Proxy /api e /uploads → localhost:3001
    └── ...
```

---

## Configuração do Ambiente

### Pré-requisitos

- **Node.js** v18 ou superior
- **npm**
- Conta no **Aiven** com serviço PostgreSQL criado e banco `cantinadb` configurado

### 1. Banco de Dados (Aiven)

No painel do Aiven, crie um serviço PostgreSQL. Dentro do serviço, crie um banco de dados chamado `cantinadb` com o schema de mesmo nome.

O schema das tabelas está em `backend/src/database/migrate.ts` e pode ser criado com `npm run migrate`.

### 2. Variáveis de Ambiente

```bash
cd backend
copy .env.example .env
```

Preencha com as credenciais do painel Aiven → Connection Information:

```env
PORT=3001
NODE_ENV=development

DB_HOST=seu-host.aivencloud.com
DB_PORT=sua-porta
DB_NAME=cantinadb
DB_USER=avnadmin
DB_PASSWORD=sua-senha
DB_SSL=true

JWT_SECRET=troque-em-producao
JWT_EXPIRES_IN=7d

UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

FRONTEND_URL=http://localhost:5173
```

> **Importante:** nunca versione o `.env`. Ele já está no `.gitignore`.

### 3. Instalação

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Migrations e Seed

```bash
cd backend
npm run migrate   # Cria as tabelas no Aiven
npm run seed      # Insere categorias, produtos e usuários de teste
```

### 5. Iniciar

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

---

## Banco de Dados

### Schema (cantinadb)

```
usuario
  idUsuario, nome, email, senha, funcao, eh_banido, qtd_cancelamentos, data_criacao

categoria
  idCategoria, nome

produto
  idProduto, nome, descricao, preco, quantidade, situacao (BOOLEAN), url_foto, fk_idCategoria

pedido
  idPedido, valor_total, data_inicio, situacao, data_fim, observacoes, motivo_cancelamento, fk_idUsuario

itens_pedido
  idItens_pedido, quantidade, nome_produto, preco_produto, subtotal, fk_idProduto, fk_idPedido

notificacao
  idNotificacao, mensagem, titulo, tipo, foi_lida, data_envio, fk_idPedido, fk_idUsuario
```

### Mapeamento DB → Frontend

O banco usa nomes em português (`funcao`, `eh_banido`, `situacao`). O arquivo `backend/src/types/index.ts` contém funções de mapeamento (`mapUser`, `mapProduct`, `mapOrder` etc.) que convertem para os campos que o frontend espera (`role`, `is_banned`, `status`).

### Produto.situacao (BOOLEAN)

No banco, `situacao` é `BOOLEAN`:
- `true` → `'disponivel'`
- `false` → `'em_falta'`

O status `'inativo'` do frontend é tratado como `false` no banco.

### Roles de Usuário

| Role | Acesso |
|---|---|
| `cliente` | Cardápio, carrinho, pedidos próprios |
| `funcionario` | Pedidos (todos), produtos, categorias |
| `gerente` | Tudo do funcionário + relatórios + usuários |

> Contas de funcionário e gerente não podem ser criadas pelo cadastro público. Use o seed ou insira diretamente no banco com senha hasheada via bcrypt.

### Fluxo de Status do Pedido

```
pendente → aceito → em_preparo → pronto → retirado
    ↓          ↓         ↓
 cancelado  cancelado  cancelado
```

---

## Armazenamento de Imagens

As imagens de produtos são gerenciadas pelo **Multer** e armazenadas **localmente** na pasta `backend/uploads/`.

- Tipos aceitos: JPEG, PNG, WebP
- Tamanho máximo: 5MB (configurável via `MAX_FILE_SIZE`)
- Servidas em: `http://localhost:3001/uploads/<filename>`
- A pasta `uploads/` está no `.gitignore` — não é versionada
- Ao editar um produto com nova imagem, a imagem antiga é deletada do disco automaticamente

> Em produção, considere substituir o armazenamento local por um serviço de objeto (S3, Cloudflare R2, etc.)

---

## Modo Demo (Offline)

O frontend tem um modo offline que simula toda a API no `localStorage` sem precisar do backend.

Para ativar, edite `frontend/src/lib/config.ts`:

```ts
isDemoMode: true
```

Para voltar ao backend real:

```ts
isDemoMode: false
```

---

## Proxy do Vite

O `vite.config.ts` redireciona `/api` e `/uploads` para `localhost:3001`, evitando problemas de CORS em desenvolvimento:

```ts
proxy: {
  '/api': { target: 'http://localhost:3001', changeOrigin: true },
  '/uploads': { target: 'http://localhost:3001', changeOrigin: true },
}
```

---

## API REST

Base URL: `http://localhost:3001/api`

### Autenticação

Rotas protegidas exigem:
```
Authorization: Bearer <token>
```

### Endpoints principais

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/auth/register` | Público | Cadastro (cria cliente) |
| POST | `/auth/login` | Público | Login |
| GET | `/auth/me` | Autenticado | Dados do usuário logado |
| GET | `/products` | Público | Lista produtos disponíveis |
| GET | `/products/all` | Funcionário+ | Lista todos os produtos |
| POST | `/products` | Funcionário+ | Criar produto |
| PUT | `/products/:id` | Funcionário+ | Editar produto |
| PATCH | `/products/:id/status` | Funcionário+ | Alterar status |
| DELETE | `/products/:id` | Funcionário+ | Excluir produto |
| GET | `/orders` | Autenticado | Lista pedidos |
| POST | `/orders` | Cliente | Criar pedido |
| PATCH | `/orders/:id/status` | Funcionário+ | Avançar status |
| PATCH | `/orders/:id/cancel` | Autenticado | Cancelar pedido |
| GET | `/reports/summary` | Gerente | Resumo geral |
| GET | `/reports/top-products` | Gerente | Mais vendidos |
| GET | `/reports/peak-hours` | Gerente | Horários de pico |
| GET | `/reports/cancellations` | Gerente | Cancelamentos |
| GET | `/users` | Gerente | Lista usuários |
| PATCH | `/users/:id/ban` | Gerente | Banir/desbanir |

---

## Scripts

### Backend
```bash
npm run dev       # Hot reload
npm run build     # Compila TypeScript
npm run start     # Inicia versão compilada
npm run migrate   # Cria tabelas no banco
npm run seed      # Popula dados iniciais
```

### Frontend
```bash
npm run dev       # Servidor de desenvolvimento
npm run build     # Build de produção
npm run preview   # Preview do build
```

---

## Segurança

- `.env` e `uploads/` estão no `.gitignore` — nunca são versionados
- Senhas armazenadas com bcrypt (salt rounds: 10)
- Tokens JWT com expiração configurável
- SSL obrigatório na conexão com Aiven (`DB_SSL=true`)
- Interceptor do Axios não redireciona para `/login` quando já está em página de autenticação