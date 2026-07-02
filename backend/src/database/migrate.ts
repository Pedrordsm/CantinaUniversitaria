/**
 * migrate.ts
 * Cria todas as tabelas no PostgreSQL respeitando exatamente o schema cantinadb.
 * Rodar com: npm run migrate
 */

import pool from './connection';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🔌 Conectado ao banco de dados PostgreSQL.');
    console.log('📦 Iniciando criação das tabelas...\n');

    await client.query('BEGIN');

    // ─── Usuario ────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS Usuario (
        idUsuario         SERIAL PRIMARY KEY,
        nome              VARCHAR(45)  NOT NULL,
        email             VARCHAR(45)  NOT NULL UNIQUE,
        senha             VARCHAR(255) NOT NULL,
        qtd_cancelamentos INT          NULL,
        data_criacao      TIMESTAMP    NOT NULL,
        funcao            VARCHAR(45)  NOT NULL,
        eh_banido         BOOLEAN      NOT NULL
      );
    `);
    console.log('✅ Tabela Usuario criada.');

    // ─── Categoria ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS Categoria (
        idCategoria SERIAL PRIMARY KEY,
        nome        VARCHAR(45) NOT NULL
      );
    `);
    console.log('✅ Tabela Categoria criada.');

    // ─── Produto ────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS Produto (
        idProduto      SERIAL PRIMARY KEY,
        nome           VARCHAR(45)    NOT NULL,
        descricao      VARCHAR(150)   NOT NULL,
        preco          NUMERIC(10, 2) NOT NULL,
        quantidade     INT            NOT NULL,
        situacao       BOOLEAN        NOT NULL,
        url_foto       VARCHAR(255)   NULL,
        fk_idCategoria INT            NOT NULL,
        FOREIGN KEY (fk_idCategoria)
          REFERENCES Categoria (idCategoria)
          ON DELETE RESTRICT
          ON UPDATE CASCADE
      );
    `);
    console.log('✅ Tabela Produto criada.');

    // ─── Pedido ─────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS Pedido (
        idPedido            SERIAL PRIMARY KEY,
        valor_total         NUMERIC(10, 2) NOT NULL,
        data_inicio         TIMESTAMP      NOT NULL,
        situacao            VARCHAR(20)    NOT NULL,
        data_fim            TIMESTAMP      NULL,
        observacoes         VARCHAR(100)   NULL,
        motivo_cancelamento VARCHAR(100)   NULL,
        fk_idUsuario        INT            NOT NULL,
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
        idItens_pedido SERIAL PRIMARY KEY,
        quantidade     INT            NOT NULL,
        nome_produto   VARCHAR(45)    NOT NULL,
        preco_produto  NUMERIC(10, 2) NOT NULL,
        subtotal       NUMERIC(10, 2) NOT NULL,
        fk_idProduto   INT            NOT NULL,
        fk_idPedido    INT            NOT NULL,
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
        idNotificacao SERIAL PRIMARY KEY,
        mensagem      VARCHAR(150) NOT NULL,
        titulo        VARCHAR(45)  NOT NULL,
        tipo          VARCHAR(45)  NOT NULL,
        foi_lida      BOOLEAN      NOT NULL,
        data_envio    TIMESTAMP    NOT NULL,
        fk_idPedido   INT          NULL,
        fk_idUsuario  INT          NOT NULL,
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
