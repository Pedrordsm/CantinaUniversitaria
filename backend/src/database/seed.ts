/**
 * seed.ts
 * Popula o banco com dados iniciais para desenvolvimento/teste.
 * Rodar com: npm run seed
 */

import pool from './connection';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Iniciando seed...\n');
    await client.query('BEGIN');

    // ─── Usuários ────────────────────────────────────────────────────────────────
    const senhaHash = await bcrypt.hash('123456', 10);

    await client.query(`
      INSERT INTO usuario (nome, email, senha, funcao, eh_banido, qtd_cancelamentos, data_criacao)
      VALUES
        ('Gerente Silva',     'gerente@cantina.com',     $1, 'gerente',     FALSE, 0, NOW()),
        ('Funcionario Joao',  'funcionario@cantina.com', $1, 'funcionario', FALSE, 0, NOW()),
        ('Cliente Maria',     'cliente@cantina.com',     $1, 'cliente',     FALSE, 0, NOW()),
        ('Cliente Pedro',     'pedro@cantina.com',       $1, 'cliente',     FALSE, 0, NOW())
      ON CONFLICT (email) DO NOTHING;
    `, [senhaHash]);
    console.log('✅ Usuários inseridos.');

    // ─── Categorias ──────────────────────────────────────────────────────────────
    const catRes = await client.query(`
      INSERT INTO categoria (nome)
      VALUES ('Lanches'), ('Bebidas'), ('Refeicoes'), ('Sobremesas'), ('Salgados')
      ON CONFLICT DO NOTHING
      RETURNING idcategoria, nome;
    `);

    const catMap: Record<string, number> = {};
    catRes.rows.forEach((r: { idcategoria: number; nome: string }) => {
      catMap[r.nome] = r.idcategoria;
    });

    // Se já existiam as categorias (ON CONFLICT), busca os ids
    if (Object.keys(catMap).length === 0) {
      const existing = await client.query('SELECT idcategoria, nome FROM categoria;');
      existing.rows.forEach((r: { idcategoria: number; nome: string }) => {
        catMap[r.nome] = r.idcategoria;
      });
    }
    console.log('✅ Categorias inseridas.');

    // ─── Produtos ────────────────────────────────────────────────────────────────
    // situacao é BOOLEAN: TRUE = disponível, FALSE = indisponível
    const produtos: [string, string, number, number, string][] = [
      ['X-Burguer',       'Hamburguer artesanal com queijo, alface e tomate', 12.5,  20, 'Lanches'],
      ['X-Frango',        'Frango grelhado com queijo e maionese especial',    11.0,  15, 'Lanches'],
      ['Misto Quente',    'Pao de forma com presunto e queijo',                 6.0,  30, 'Lanches'],
      ['Coca-Cola Lata',  'Refrigerante gelado 350ml',                          5.0,  50, 'Bebidas'],
      ['Suco de Laranja', 'Suco natural 300ml',                                  7.0,  20, 'Bebidas'],
      ['Agua Mineral',    'Agua mineral 500ml',                                  3.0, 100, 'Bebidas'],
      ['Cafe',            'Cafe coado 200ml',                                    4.0,  40, 'Bebidas'],
      ['Prato Feito',     'Arroz, feijao, carne e salada',                      18.0,  10, 'Refeicoes'],
      ['Macarrao',        'Macarrao ao molho bolonhesa',                        15.0,   8, 'Refeicoes'],
      ['Pudim',           'Pudim de leite condensado',                           6.0,  15, 'Sobremesas'],
      ['Brigadeiro',      'Brigadeiro artesanal',                                3.5,  25, 'Sobremesas'],
      ['Coxinha',         'Coxinha de frango 100g',                              5.0,  30, 'Salgados'],
      ['Esfiha',          'Esfiha de carne 80g',                                 4.5,  25, 'Salgados'],
    ];

    for (const [nome, descricao, preco, quantidade, catNome] of produtos) {
      const catId = catMap[catNome];
      // BOOLEAN: TRUE se tem estoque, FALSE se não tem
      const situacao = quantidade > 0;
      await client.query(
        `INSERT INTO produto (nome, descricao, preco, quantidade, situacao, fk_idcategoria)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING;`,
        [nome, descricao, preco, quantidade, situacao, catId]
      );
    }
    console.log('✅ Produtos inseridos.');

    await client.query('COMMIT');
    console.log('\n🎉 Seed concluído! Usuários de teste:');
    console.log('  gerente@cantina.com     / 123456  (gerente)');
    console.log('  funcionario@cantina.com / 123456  (funcionario)');
    console.log('  cliente@cantina.com     / 123456  (cliente)');
    console.log('  pedro@cantina.com       / 123456  (cliente)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante o seed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
