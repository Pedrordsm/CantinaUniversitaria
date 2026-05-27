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
| PostgreSQL | 14+ | Banco de dados |
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
| lucide-react | 0.294 | Ícones |
| react-hot-toast | 2.4 | Notificações toast |

---

## Estrutura do Projeto

```
Cantina universitaria/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── connection.ts      # Pool de conexão PostgreSQL
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
│   │   │   ├── notifications.ts   # Notificações por usuário/role
│   │   │   ├── reports.ts         # Relatórios gerenciais
│   │   │   └── users.ts           # Gestão de usuários (gerente)
│   │   ├── types/
│   │   │   └── index.ts           # Interfaces TypeScript
│   │   ├── server.ts              # Entry point, middlewares, rotas
│   │   └── socket.ts              # Inicialização e eventos Socket.io
│   ├── uploads/                   # Imagens de produtos (geradas em runtime)
│   ├── .env                       # Variáveis de ambiente (não versionar)
│   ├── .env.example               # Template de variáveis
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useSocket.ts       # Hook de conexão WebSocket
│   │   ├── layouts/
│   │   │   ├── ClientLayout.tsx   # Header + nav do cliente
│   │   │   ├── StaffLayout.tsx    # Sidebar do funcionário/gerente
│   │   │   └── ManagerLayout.tsx  # Re-export do StaffLayout
│   │   ├── lib/
│   │   │   └── api.ts             # Instância Axios com interceptors
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── client/
│   │   │   │   ├── MenuPage.tsx   # Cardápio
│   │   │   │   ├── CartPage.tsx   # Carrinho
│   │   │   │   └── OrdersPage.tsx # Histórico de pedidos
│   │   │   ├── staff/
│   │   │   │   ├── StaffOrdersPage.tsx  # Gestão de pedidos
│   │   │   │   └── ProductsPage.tsx     # CRUD de produtos
│   │   │   └── manager/
│   │   │       ├── ReportsPage.tsx      # Relatórios
│   │   │       └── UsersPage.tsx        # Gestão de usuários
│   │   ├── store/
│   │   │   ├── authStore.ts       # Estado de autenticação (Zustand + persist)
│   │   │   └── cartStore.ts       # Estado do carrinho (Zustand + persist)
│   │   ├── types/
│   │   │   └── index.ts           # Interfaces TypeScript
│   │   ├── App.tsx                # Roteamento principal
│   │   ├── main.tsx               # Entry point + ErrorBoundary
│   │   └── index.css              # Tailwind + classes utilitárias
│   ├── index.html
│   ├── vite.config.ts             # Proxy /api → localhost:3001
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── instalar.bat                   # Script de instalação (Windows)
├── README.md
├── GUIA_DESENVOLVEDOR.md
└── GUIA_USUARIO.md
```

---

## Configuração do Ambiente

### Pré-requisitos

- **Node.js** v18 ou superior → https://nodejs.org/
- **PostgreSQL** v14 ou superior → https://www.postgresql.org/download/
- **npm** (incluído com Node.js)

### 1. Banco de Dados

Abra o pgAdmin ou o terminal `psql` e execute:

```sql
CREATE DATABASE cantina_universitaria;
```

### 2. Variáveis de Ambiente

Copie o template e edite com suas credenciais:

```bash
cd backend
copy .env.example .env
```

Conteúdo do `.env`:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=cantina_universitaria
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

JWT_SECRET=cantina_secret_key_mude_em_producao_2024
JWT_EXPIRES_IN=7d

UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

> **Importante:** nunca versione o arquivo `.env`. Ele já está no `.gitignore`.

### 3. Instalação das Dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

Ou use o script automatizado (Windows):

```bash
instalar.bat
```

### 4. Migrations e Seed

```bash
cd backend
npm run migrate   # Cria todas as tabelas
npm run seed      # Insere dados iniciais e usuários de teste
```

### 5. Iniciar os Servidores

Abra **dois terminais**:

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Rodando em http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm run dev
# Rodando em http://localhost:5173
```

---

## Banco de Dados

### Diagrama de Tabelas

```
users
  id, name, email, password, role, is_banned, cancel_count

categories
  id, name

products
  id, name, description, price, quantity, image_url, status, category_id

orders
  id, user_id, status, total, notes, cancelled_by, cancel_reason

order_items
  id, order_id, product_id, quantity, unit_price, subtotal

notifications
  id, user_id, role, title, message, type, order_id, is_read
```

### Roles de Usuário

| Role | Acesso |
|---|---|
| `cliente` | Cardápio, carrinho, pedidos próprios |
| `funcionario` | Pedidos (todos), produtos |
| `gerente` | Tudo do funcionário + relatórios + usuários |

### Fluxo de Status do Pedido

```
pendente → aceito → em_preparo → pronto → retirado
    ↓          ↓         ↓
 cancelado  cancelado  cancelado
```

- **Cliente** só pode cancelar em `pendente`
- **Funcionário/Gerente** pode cancelar até `em_preparo`
- Ao cancelar, o estoque dos produtos é devolvido automaticamente

### Lógica de Estoque

- Ao criar um pedido, a quantidade de cada produto é decrementada
- Se `quantity` chegar a 0, o `status` do produto muda automaticamente para `em_falta`
- Ao cancelar um pedido, o estoque é restaurado e o produto volta para `disponivel` se a quantidade for > 0

---

## API REST

Base URL: `http://localhost:3001/api`

### Autenticação

Todas as rotas protegidas exigem o header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Auth
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/auth/register` | Público | Cadastro de cliente |
| POST | `/auth/login` | Público | Login |
| GET | `/auth/me` | Autenticado | Dados do usuário logado |

#### Produtos
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/products` | Público | Lista produtos disponíveis |
| GET | `/products/all` | Funcionário+ | Lista todos (incluindo inativos) |
| GET | `/products/:id` | Público | Detalhe do produto |
| POST | `/products` | Funcionário+ | Criar produto (multipart/form-data) |
| PUT | `/products/:id` | Funcionário+ | Editar produto |
| PATCH | `/products/:id/status` | Funcionário+ | Alterar status |
| DELETE | `/products/:id` | Funcionário+ | Excluir (ou inativar se em pedido ativo) |

#### Pedidos
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/orders` | Autenticado | Lista pedidos (cliente vê só os seus) |
| GET | `/orders/:id` | Autenticado | Detalhe do pedido |
| POST | `/orders` | Cliente | Criar pedido |
| PATCH | `/orders/:id/status` | Funcionário+ | Avançar status |
| PATCH | `/orders/:id/cancel` | Autenticado | Cancelar pedido |

#### Relatórios (Gerente)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/reports/summary` | Resumo geral |
| GET | `/reports/top-products` | Produtos mais vendidos |
| GET | `/reports/peak-hours` | Horários de pico de retirada |
| GET | `/reports/cancellations` | Produtos com mais cancelamentos |
| GET | `/reports/user-cancellations` | Usuários que mais cancelam |

#### Outros
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/categories` | Público | Lista categorias |
| POST | `/categories` | Funcionário+ | Criar categoria |
| GET | `/notifications` | Autenticado | Notificações do usuário |
| GET | `/notifications/unread-count` | Autenticado | Contagem de não lidas |
| PATCH | `/notifications/read-all` | Autenticado | Marcar todas como lidas |
| GET | `/users` | Gerente | Lista usuários |
| PATCH | `/users/:id/ban` | Gerente | Banir/desbanir usuário |

---

## WebSocket (Socket.io)

### Conexão

O cliente conecta passando o JWT no handshake:

```typescript
const socket = io('http://localhost:3001', {
  auth: { token: 'Bearer ...' }
});
```

### Salas

Ao conectar, o servidor coloca o socket em duas salas automaticamente:
- `user:<id>` — notificações pessoais
- `role:<role>` — notificações por perfil (ex: `role:funcionario`)

### Eventos Emitidos pelo Servidor

| Evento | Sala | Payload | Quando |
|---|---|---|---|
| `notification` | `user:<id>` ou `role:<role>` | `{ title, message, type, order_id }` | Mudança de status, cancelamento, pedido pronto |
| `new_order` | `role:funcionario`, `role:gerente` | `{ order_id }` | Novo pedido criado |

### Tipos de Notificação

| type | Descrição |
|---|---|
| `new_order` | Novo pedido recebido |
| `order_accepted` | Pedido aceito pelo funcionário |
| `order_ready` | Pedido pronto para retirada |
| `order_cancelled` | Pedido cancelado |

---

## Frontend — Decisões de Arquitetura

### Roteamento

O `App.tsx` usa componentes wrapper (`ClientApp`, `StaffApp`) que verificam autenticação e role antes de renderizar o layout. Isso evita problemas de race condition com o React Router v6.

```tsx
function ClientApp() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user) return <Navigate to="/login" />;
  if (user.role !== 'cliente') return <Navigate to="/login" />;
  return <ClientLayout />;  // ClientLayout tem <Outlet /> interno
}
```

### Hidratação do Zustand

O `authStore` usa `persist` para salvar o token no `localStorage`. Como a hidratação é assíncrona, o `App.tsx` aguarda `_hasHydrated = true` antes de renderizar as rotas, evitando redirecionamentos incorretos para `/login`.

### Proxy do Vite

O `vite.config.ts` configura proxy para `/api` e `/uploads` apontando para `localhost:3001`, então o frontend nunca faz requisições cross-origin em desenvolvimento.

### Cache com TanStack Query

- Dados de produtos: `staleTime: 30s`, `refetchInterval: 30s`
- Pedidos ativos: `refetchInterval: 10-15s`
- Notificações: `refetchInterval: 15-30s`

---

## Upload de Imagens

- Armazenadas em `backend/uploads/`
- Servidas estaticamente em `http://localhost:3001/uploads/<filename>`
- Tipos aceitos: JPEG, PNG, WebP
- Tamanho máximo: 5MB (configurável via `MAX_FILE_SIZE` no `.env`)
- Ao editar um produto com nova imagem, a imagem antiga é deletada do disco

---

## Scripts Disponíveis

### Backend
```bash
npm run dev       # Inicia com hot reload (ts-node-dev)
npm run build     # Compila TypeScript para dist/
npm run start     # Inicia a versão compilada
npm run migrate   # Executa as migrations
npm run seed      # Popula o banco com dados iniciais
```

### Frontend
```bash
npm run dev       # Inicia o servidor de desenvolvimento Vite
npm run build     # Build de produção (tsc + vite build)
npm run preview   # Preview do build de produção
npm run lint      # ESLint
```

---

## Adicionando Novas Funcionalidades

### Nova rota no backend

1. Crie o arquivo em `backend/src/routes/nova-rota.ts`
2. Implemente os handlers com `async (req, res): Promise<void>`
3. Use `authenticate` e `authorize(...)` dos middlewares
4. Registre no `server.ts`:
   ```typescript
   import novaRota from './routes/nova-rota';
   app.use('/api/nova-rota', novaRota);
   ```

### Nova página no frontend

1. Crie o componente em `frontend/src/pages/`
2. Importe e adicione a rota no `App.tsx` dentro do wrapper correto (`ClientApp` ou `StaffApp`)
3. Adicione o link de navegação no layout correspondente (`ClientLayout` ou `StaffLayout`)

### Nova tabela no banco

1. Adicione o `CREATE TABLE` no `migrate.ts`
2. Adicione os dados de exemplo no `seed.ts`
3. Rode `npm run migrate` novamente (use `IF NOT EXISTS` para não quebrar)

---

## Variáveis de Ambiente — Referência Completa

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3001` | Porta do servidor |
| `NODE_ENV` | `development` | Ambiente |
| `DB_HOST` | `localhost` | Host do PostgreSQL |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_NAME` | `cantina_universitaria` | Nome do banco |
| `DB_USER` | `postgres` | Usuário do banco |
| `DB_PASSWORD` | — | Senha do banco |
| `JWT_SECRET` | — | Chave secreta JWT (mude em produção) |
| `JWT_EXPIRES_IN` | `7d` | Expiração do token |
| `MAX_FILE_SIZE` | `5242880` | Tamanho máximo de upload em bytes (5MB) |

---

## Problemas Comuns

**Erro de conexão com o banco**
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no `.env`
- Certifique-se de que o banco `cantina_universitaria` foi criado

**Tela em branco no frontend**
- Abra o console do navegador (F12) para ver o erro
- Verifique se o backend está rodando em `localhost:3001`
- Limpe o `localStorage` do navegador e recarregue

**Upload de imagem não funciona**
- Verifique se a pasta `backend/uploads/` existe
- Confirme que o processo tem permissão de escrita na pasta

**Token expirado / redirecionando para login**
- O token expira em 7 dias por padrão
- Faça logout e login novamente
- Para aumentar o tempo, altere `JWT_EXPIRES_IN` no `.env`
