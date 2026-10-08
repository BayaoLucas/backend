import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Pool, PoolConnection } from 'mysql2/promise';
import { db } from '../config/database';
import { Cliente, NovoCliente } from '../types';

type LinhaCliente = Cliente & RowDataPacket;

export class ClienteModel {
  // Recebe dados já validados. Regras de negócio completas serão aplicadas na Sprint 3.
  static async create(d: NovoCliente, conexao: Pool | PoolConnection = db): Promise<number> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      'INSERT INTO clientes (nome, cpf, telefone, email) VALUES (?, ?, ?, ?)',
      [d.nome, d.cpf, d.telefone ?? null, d.email ?? null]
    );
    return resultado.insertId;
  }

  static async findById(id: number, conexao: Pool | PoolConnection = db): Promise<Cliente | null> {
    const [linhas] = await conexao.execute<LinhaCliente[]>(
      'SELECT * FROM clientes WHERE id = ?', [id]
    );
    return linhas[0] ?? null;
  }

  static async findAll(conexao: Pool | PoolConnection = db): Promise<Cliente[]> {
    const [linhas] = await conexao.execute<LinhaCliente[]>(
      'SELECT * FROM clientes ORDER BY id DESC'
    );
    return linhas;
  }

  // Atualização completa: envie todos os campos obrigatórios de NovoCliente.
  static async update(id: number, d: NovoCliente, conexao: Pool | PoolConnection = db): Promise<boolean> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      'UPDATE clientes SET nome = ?, cpf = ?, telefone = ?, email = ? WHERE id = ?',
      [d.nome, d.cpf, d.telefone ?? null, d.email ?? null, id]
    );
    return resultado.affectedRows > 0;
  }

  // Preserva registros e relacionamentos do histórico (RN16).
  static async inactivate(id: number, conexao: Pool | PoolConnection = db): Promise<boolean> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      'UPDATE clientes SET ativo = FALSE WHERE id = ?', [id]
    );
    return resultado.affectedRows > 0;
  }

  static async findByCpf(cpf: string, conexao: Pool | PoolConnection = db): Promise<Cliente | null> {
    const [linhas] = await conexao.execute<LinhaCliente[]>(
      'SELECT * FROM clientes WHERE cpf = ?', [cpf]
    );
    return linhas[0] ?? null;
  }
}
