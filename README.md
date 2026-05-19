# 🍽️ Cantina Universitária

Sistema completo de cantina universitária com React + TypeScript (frontend) e Node.js + SQLite (backend).

## Pré-requisitos

1. **Node.js** (v18+): https://nodejs.org/
2. **npm** (vem com Node.js)

## Configuração Inicial

### 1. Backend

```bash
cd backend
npm install
```

Copie o arquivo de variáveis de ambiente:
```bash
copy .env.example .env
```

O SQLite usa `DB_PATH=data/cantina.sqlite` por padrão. O arquivo do banco será criado automaticamente ao executar as migrations.

Execute as migrations (cria as tabelas):
```bash
npm run migrate
```

Popule o banco com dados iniciais:
```bash
npm run seed
```

Inicie o servidor:
```bash
npm run dev
```

O backend roda em: http://localhost:3001

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend roda em: http://localhost:5173

## Usuários de Teste (após seed)

| Email | Senha | Perfil |
|-------|-------|--------|
| gerente@cantina.com | 123456 | Gerente |
| funcionario@cantina.com | 123456 | Funcionário |
| cliente@cantina.com | 123456 | Cliente |

## Funcionalidades

### Cliente
- Visualizar cardápio com produtos disponíveis
- Adicionar/remover itens do carrinho
- Definir quantidade desejada
- Ver valor total do carrinho
- Realizar pedido
- Cancelar pedido (enquanto pendente)
- Histórico de pedidos com status
- Notificações em tempo real

### Funcionário
- CRUD completo de produtos (nome, preço, quantidade, foto)
- Alterar status dos produtos (disponível / em falta)
- Visualizar novos pedidos (com alerta sonoro/visual)
- Aceitar ou cancelar pedidos
- Notificações em tempo real

### Gerente
- Tudo que o funcionário pode fazer
- Relatório de produtos mais vendidos
- Relatório de horários de pico de retirada
- Relatório de pedidos mais cancelados
- Relatório de usuários que mais cancelam (para possível banimento)

## Decisões de Projeto

- **Quantidade no DB**: Produtos têm quantidade em estoque. Ao aceitar um pedido, a quantidade é decrementada. Se chegar a 0, o produto vai automaticamente para "em falta".
- **Cancelamento**: Clientes podem cancelar pedidos com status "pendente". Funcionários podem cancelar pedidos em qualquer status antes de "pronto para retirada".
- **Notificações**: Implementadas via WebSocket (Socket.io) para alertas em tempo real.
- **Upload de fotos**: Armazenadas localmente em `backend/uploads/`.
