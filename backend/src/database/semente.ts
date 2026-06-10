import pool from './connection';
import bcrypt from 'bcryptjs';

async function seed() {
  const cantina = await pool.connect();
  try {
    console.log('Iniciando seed...');
    await cantina.query('BEGIN');

    const hash = await bcrypt.hash('123456', 10);

    await cantina.query(`
      INSERT INTO users (name, email, password, role) VALUES
        ('Gerente Silva',      'gerente@cantina.com',      $1, 'gerente'),
        ('Funcionário João',   'funcionario@cantina.com',  $1, 'funcionario'),
        ('Cliente Maria',      'cliente@cantina.com',      $1, 'cliente')
      ON CONFLICT (email) DO NOTHING
    `, [hash]);

    await cantina.query(`
      INSERT INTO categories (name) VALUES
        ('Lanches'), ('Bebidas'), ('Refeições'), ('Sobremesas'), ('Salgados')
      ON CONFLICT (name) DO NOTHING
    `);

    const cats = await cantina.query('SELECT id, name FROM categories');
    const c: Record<string, string> = {};
    cats.rows.forEach((r: { name: string; id: string }) => { c[r.name] = r.id; });

    await cantina.query(`
      INSERT INTO products (name, description, price, quantity, status, category_id) VALUES
        ('X-Burguer',      'Hambúrguer com queijo e salada',      12.50, 20, 'disponivel', R$1),
        ('X-Frango',       'Frango grelhado com maionese',        11.00, 15, 'disponivel', R$1),
        ('Misto Quente',   'Pão com presunto e queijo',            6.00, 30, 'disponivel', R$1),
        ('Coca-Cola Lata', 'Refrigerante 350ml',                   5.00, 50, 'disponivel', R$2),
        ('Suco de Laranja','Suco natural 300ml',                   7.00, 20, 'disponivel', R$2),
        ('Água Mineral',   'Água 500ml',                           3.00,100, 'disponivel', R$2),
        ('Café',           'Café coado 200ml',                     4.00, 40, 'disponivel', R$2),
        ('Prato Feito',    'Arroz, feijão, carne e salada',       18.00, 10, 'disponivel', R$3),
        ('Pudim',          'Pudim de leite condensado',            6.00, 15, 'disponivel', R$4),
        ('Coxinha',        'Coxinha de frango 100g',               5.00, 30, 'disponivel', R$5)
    `, [c['Lanches'], c['Bebidas'], c['Refeições'], c['Sobremesas'], c['Salgados']]);

    await cantina.query('COMMIT');
    console.log('gerente@cantina.com     | 123456');
    console.log('funcionario@cantina.com | 123456');
    console.log('cliente@cantina.com     | 123456');
  } catch (error) {
    await cantina.query('ROLLBACK');
    console.error('Erro no seed:', error);
    throw error;
  } finally {
    cantina.release();
    await pool.end();
  }
}

seed().catch(console.error);