import dotenv from 'dotenv';
import mysql, { PoolConnection } from 'mysql2/promise';

dotenv.config();

export const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ms2_vestuario',
  waitForConnections: true,
  connectionLimit: 10,
  // DECIMAL permanece string para preservar os valores exatos do banco.
  decimalNumbers: false
});

export async function testarConexao(): Promise<void> {
  const conexao = await db.getConnection();
  try {
    await conexao.ping();
    console.log('MySQL conectado com sucesso!');
  } finally {
    conexao.release();
  }
}

// Suporte da camada de dados para a transação de venda da Sprint 3.
// Todos os models chamados aqui devem receber esta mesma conexão.
export async function withTransaction<T>(operacao: (conexao: PoolConnection) => Promise<T>): Promise<T> {
  const conexao = await db.getConnection();
  try {
    await conexao.beginTransaction();
    const resultado = await operacao(conexao);
    await conexao.commit();
    return resultado;
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}

export function mensagemConexao(erro: unknown): string {
  const codigo = (erro as { code?: string })?.code;
  if (codigo === 'ER_ACCESS_DENIED_ERROR') return 'Acesso negado: confira DB_USER e DB_PASSWORD no .env, usando os dados do Workbench.';
  if (codigo === 'ER_BAD_DB_ERROR') return 'Banco não encontrado: execute sql/banco.sql na conexão correta ou confira DB_NAME.';
  if (codigo === 'ECONNREFUSED') return 'MySQL indisponível: confira se o serviço está iniciado, além de DB_HOST e DB_PORT.';
  return `Falha no MySQL (${codigo ?? 'erro sem código'}). Confira a configuração e a estrutura do banco.`;
}
