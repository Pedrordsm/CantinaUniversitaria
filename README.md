# Cantina Universitaria

Aplicacao frontend em React + TypeScript para uma cantina universitaria.

O projeto roda em modo demo, com dados mockados e persistidos no `localStorage` do navegador. Nao ha backend, banco de dados, servidor Node ou API externa obrigatoria.

## Pre-requisitos

1. Node.js v18+
2. npm

## Como rodar localmente

```bash
cd frontend
npm install
npm run dev
```

O app abre em:

```bash
http://localhost:5173
```

## Publicacao

O GitHub Pages publica apenas o build estatico do frontend em `frontend/dist`.

O workflow em `.github/workflows/publish.yml` roda automaticamente a cada push na `main`.

## Contas de teste

| Email | Senha | Perfil |
| --- | --- | --- |
| gerente@cantina.com | 123456 | Gerente |
| funcionario@cantina.com | 123456 | Funcionario |
| cliente@cantina.com | 123456 | Cliente |
| pedro@cantina.com | 123456 | Cliente |

Tambem e possivel criar novas contas pela tela de cadastro.

## Dados demo

Os dados ficam no navegador usando `localStorage`.

Para resetar a demo, limpe os dados do site no navegador ou remova estas chaves:

- `cantina-demo-db-v1`
- `auth-storage`
- `cart-storage`

## Funcionalidades

- Login e cadastro mockados
- Cardapio com produtos e categorias
- Carrinho e criacao de pedidos
- Historico e cancelamento de pedidos
- Gestao de produtos para funcionarios
- Gestao de usuarios e relatorios basicos para gerentes
