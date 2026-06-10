import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // aceita SSL o certificado semprecisar verificar a certificação

  }
});

pool.on('error', (err) => {
  console.error('Erro no pool do PostgreSQL:', err);
});

export default pool;