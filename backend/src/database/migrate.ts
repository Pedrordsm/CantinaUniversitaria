/**
 * migrate.ts
 * Cria todas as tabelas no PostgreSQL (Aiven).
 * Schema adaptado do script MySQL original para sintaxe PostgreSQL.
 * Rodar com: npm run migrate
 */

import pool from './connection';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🔌 Conectado ao banco de dados Aiven PostgreSQL.');
    console.log('📦 Iniciando criação das tabelas...\n');

    await client.query('BEGIN');
    // Mapeamento: idUsuario→id, nome→name, funcao→role, eh_banido→is_banned,
    //             qtd_cancelamentos→cancel_count, data_criacao→created_at
    await client.query(`
      CREATE TABLE IF NOT EXISTS Usuario (
        idUsuario     SERIAL PRIMARY KEY,
        nome          VARCHAR(100)  NOT NULL,
        email         VARCHAR(100)  NOT NULL UNIQUE,
        senha         VARCHAR(255)  NOT NULL,
        funcao        VARCHAR(20)   NOT NULL DEFAULT 'cliente'
                        CHECK (funcao IN ('cliente', 'funcionario', 'gerente')),
        eh_banido     BOOLEAN       NOT NULL DEFAULT FALSE,
        qtd_cancelamentos INT       NOT NULL DEFAULT 0,
        data_criacao  TIMESTAMP     NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela Usuario criada.');

    // ─── Categoria ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS Categoria (
        idCategoria   SERIAL PRIMARY KEY,
        nome          VARCHAR(100) NOT NULL
      );
    `);
    console.log('✅ Tabela Categoria criada.');

    // ─── Produto ────────────────────────────────────────────────────────────────
    // situacao: 'disponivel' | 'em_falta' | 'inativo'  (era BOOLEAN no MySQL)
    // fk_idCategoria → Categoria.idCategoria
    await client.query(`
      CREATE TABLE IF NOT EXISTS Produto (
        idProduto     SERIAL PRIMARY KEY,
        nome          VARCHAR(100)  NOT NULL,
        descricao     VARCHAR(255)  NOT NULL DEFAULT '',
        preco         NUMERIC(10,2) NOT NULL,
        quantidade    INT           NOT NULL DEFAULT 0,
        situacao      VARCHAR(20)   NOT NULL DEFAULT 'disponivel'
                        CHECK (situacao IN ('disponivel', 'em_falta', 'inativo')),
        url_foto      VARCHAR(255)  NULL,
        data_criacao  TIMESTAMP     NOT NULL DEFAULT NOW(),
        data_atualizacao TIMESTAMP  NOT NULL DEFAULT NOW(),
        fk_idCategoria INT          NOT NULL,
        FOREIGN KEY (fk_idCategoria)
          REFERENCES Categoria (idCategoria)
          ON DELETE RESTRICT
          ON UPDATE CASCADE
      );
    `);
    console.log('✅ Tabela Produto criada.');

    // ─── Pedido ─────────────────────────────────────────────────────────────────
    // situacao: 'pendente'|'aceito'|'em_preparo'|'pronto'|'retirado'|'cancelado'
    // data_fim serve como updated_at
    await client.query(`
      CREATE TABLE IF NOT EXISTS Pedido (
        idPedido              SERIAL PRIMARY KEY,
        valor_total           NUMERIC(10,2) NOT NULL,
        data_inicio           TIMESTAMP     NOT NULL DEFAULT NOW(),
        situacao              VARCHAR(20)   NOT NULL DEFAULT 'pendente'
                                CHECK (situacao IN ('pendente','aceito','em_preparo','pronto','retirado','cancelado')),
        data_fim              TIMESTAMP     NULL,
        observacoes           VARCHAR(255)  NULL,
        motivo_cancelamento   VARCHAR(255)  NULL,
        cancelado_por         VARCHAR(20)   NULL,
        fk_idUsuario          INT           NOT NULL,
        FOREIGN KEY (fk_idUsuario)
          REFERENCES Usuario (idUsuario)
          ON DELETE RESTRICT
          ON UPDATE CASCADE
      );
    `);
    console.log('✅ Tabela Pedido criada.');

    // ─── itens_pedido ───────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS itens_pedido (
        idItens_pedido  SERIAL PRIMARY KEY,
        quantidade      INT           NOT NULL,
        nome_produto    VARCHAR(100)  NOT NULL,
        preco_produto   NUMERIC(10,2) NOT NULL,
        subtotal        NUMERIC(10,2) NOT NULL,
        url_foto_produto VARCHAR(255) NULL,
        fk_idProduto    INT           NOT NULL,
        fk_idPedido     INT           NOT NULL,
        FOREIGN KEY (fk_idProduto)
          REFERENCES Produto (idProduto)
          ON DELETE RESTRICT
          ON UPDATE CASCADE,
        FOREIGN KEY (fk_idPedido)
          REFERENCES Pedido (idPedido)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      );
    `);
    console.log('✅ Tabela itens_pedido criada.');

    // ─── Notificacao ────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS Notificacao (
        idNotificacao   SERIAL PRIMARY KEY,
        mensagem        VARCHAR(255) NOT NULL,
        titulo          VARCHAR(100) NOT NULL,
        tipo            VARCHAR(50)  NOT NULL,
        foi_lida        BOOLEAN      NOT NULL DEFAULT FALSE,
        data_envio      TIMESTAMP    NOT NULL DEFAULT NOW(),
        role_alvo       VARCHAR(20)  NULL,
        fk_idPedido     INT          NULL,
        fk_idUsuario    INT          NULL,
        FOREIGN KEY (fk_idPedido)
          REFERENCES Pedido (idPedido)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        FOREIGN KEY (fk_idUsuario)
          REFERENCES Usuario (idUsuario)
          ON DELETE RESTRICT
          ON UPDATE CASCADE
      );
    `);
    console.log('✅ Tabela Notificacao criada.');

    await client.query('COMMIT');
    console.log('\n🎉 Migração concluída com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante a migração:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
