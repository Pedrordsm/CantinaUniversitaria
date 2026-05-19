import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

type QueryParams = unknown[];
type QueryResult<T = any> = {
  rows: T[];
  rowCount: number;
};

const databasePath = path.resolve(
  process.cwd(),
  process.env.DB_PATH || path.join('data', 'cantina.sqlite')
);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma('foreign_keys = ON');
database.pragma('journal_mode = WAL');

function normalizeSql(sql: string) {
  return sql
    .replace(/\$(\d+)/g, '@p$1')
    .replace(/\bTRUE\b/gi, '1')
    .replace(/\bFALSE\b/gi, '0')
    .replace(/\bNOW\(\)/gi, "datetime('now')");
}

function normalizeParams(params: QueryParams = []) {
  return params.map((param) => {
    if (typeof param === 'boolean') return param ? 1 : 0;
    if (param instanceof Date) return param.toISOString();
    return param;
  });
}

function toNamedParams(params: QueryParams = []) {
  return normalizeParams(params).reduce<Record<string, unknown>>((named, param, index) => {
    named[`p${index + 1}`] = param;
    return named;
  }, {});
}

function query<T = any>(sql: string, params: QueryParams = []): QueryResult<T> {
  const normalizedSql = normalizeSql(sql);
  const normalizedParams = toNamedParams(params);
  const statement = database.prepare(normalizedSql);

  if (statement.reader) {
    const rows = params.length > 0 ? (statement.all(normalizedParams) as T[]) : (statement.all() as T[]);
    return { rows, rowCount: rows.length };
  }

  const info = params.length > 0 ? statement.run(normalizedParams) : statement.run();
  return { rows: [], rowCount: info.changes };
}

function connect() {
  return {
    query,
    release: () => undefined,
  };
}

function end() {
  database.close();
}

export { databasePath };
export default { query, connect, end };
