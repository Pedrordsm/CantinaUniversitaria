import pool from './connection';
import bcrypt from 'bcryptjs';

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Iniciando seed...');
    await client.query('BEGIN');

    // Usuários
    const hashedPassword = await bcrypt.hash('123456', 10);

    await client.query(`
      INSERT INTO users (name, email, password, role) VALUES
        ('Gerente Silva', 'gerente@cantina.com', $1, 'gerente'),
        ('Funcionário João', 'funcionario@cantina.com', $1, 'funcionario'),
        ('Cliente Maria', 'cliente@cantina.com', $1, 'cliente'),
        ('Cliente Pedro', 'pedro@cantina.com', $1, 'cliente')
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword]);

    // Categorias
    await client.query(`
      INSERT INTO categories (name) VALUES
        ('Lanches'),
        ('Bebidas'),
        ('Refeições'),
        ('Sobremesas'),
        ('Salgados')
      ON CONFLICT (name) DO NOTHING
    `);

    const catResult = await client.query('SELECT id, name FROM categories');
    const categories: Record<string, string> = {};
    catResult.rows.forEach((row: { id: string; name: string }) => {
      categories[row.name] = row.id;
    });

    // Produtos
    await client.query(`
      INSERT INTO products (name, description, price, quantity, status, category_id) VALUES
        ('X-Burguer', 'Hambúrguer artesanal com queijo, alface e tomate', 12.50, 20, 'disponivel', $1),
        ('X-Frango', 'Frango grelhado com queijo e maionese especial', 11.00, 15, 'disponivel', $1),
        ('Misto Quente', 'Pão de forma com presunto e queijo', 6.00, 30, 'disponivel', $1),
        ('Coca-Cola Lata', 'Refrigerante gelado 350ml', 5.00, 50, 'disponivel', $2),
        ('Suco de Laranja', 'Suco natural 300ml', 7.00, 20, 'disponivel', $2),
        ('Água Mineral', 'Água mineral 500ml', 3.00, 100, 'disponivel', $2),
        ('Café', 'Café coado 200ml', 4.00, 40, 'disponivel', $2),
        ('Prato Feito', 'Arroz, feijão, carne e salada', 18.00, 10, 'disponivel', $3),
        ('Macarrão', 'Macarrão ao molho bolonhesa', 15.00, 8, 'disponivel', $3),
        ('Pudim', 'Pudim de leite condensado', 6.00, 15, 'disponivel', $4),
        ('Brigadeiro', 'Brigadeiro artesanal', 3.50, 25, 'disponivel', $4),
        ('Coxinha', 'Coxinha de frango 100g', 5.00, 30, 'disponivel', $5),
        ('Esfiha', 'Esfiha de carne 80g', 4.50, 25, 'disponivel', $5)
      ON CONFLICT DO NOTHING
    `, [categories['Lanches'], categories['Bebidas'], categories['Refeições'], categories['Sobremesas'], categories['Salgados']]);

    await client.query('COMMIT');
    console.log('✅ Seed executado com sucesso!');
    console.log('');
    console.log('👤 Usuários criados:');
    console.log('   gerente@cantina.com     | senha: 123456 | perfil: gerente');
    console.log('   funcionario@cantina.com | senha: 123456 | perfil: funcionário');
    console.log('   cliente@cantina.com     | senha: 123456 | perfil: cliente');
    console.log('   pedro@cantina.com       | senha: 123456 | perfil: cliente');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro no seed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
