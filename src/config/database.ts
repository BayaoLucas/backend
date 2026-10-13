
import 'dotenv/config';
import mysql, { PoolConnection } from 'mysql2/promise';

export const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ms2_vestuario',
  waitForConnections: true,
  connectionLimit: 10,
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

export async function withTransaction<T>(
  executar: (conexao: PoolConnection) => Promise<T>
): Promise<T> {
  const conexao = await db.getConnection();

  try {
    await conexao.beginTransaction();

    const resultado = await executar(conexao);

    await conexao.commit();

    return resultado;
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}
