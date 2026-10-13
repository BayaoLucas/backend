
import {
  ResultSetHeader,
  RowDataPacket
} from 'mysql2';

import {
  Pool,
  PoolConnection
} from 'mysql2/promise';

import { db } from '../config/database';

import {
  Cliente,
  NovoCliente
} from '../types';

type LinhaCliente = Cliente & RowDataPacket;

type Conexao = Pool | PoolConnection;

export class ClienteModel {

  static async create(
    dados: NovoCliente,
    conexao: Conexao = db
  ): Promise<number> {
    const [resultado] =
      await conexao.execute<ResultSetHeader>(
        `INSERT INTO clientes
         (nome, cpf, telefone, email)
         VALUES (?, ?, ?, ?)`,
        [
          dados.nome,
          dados.cpf,
          dados.telefone ?? null,
          dados.email ?? null
        ]
      );

    return resultado.insertId;
  }

  static async findById(
    id: number,
    conexao: Conexao = db
  ): Promise<Cliente | null> {
    const [linhas] =
      await conexao.execute<LinhaCliente[]>(
        'SELECT * FROM clientes WHERE id = ?',
        [id]
      );

    return linhas[0] ?? null;
  }

  static async findByCpf(
    cpf: string,
    conexao: Conexao = db
  ): Promise<Cliente | null> {
    const [linhas] =
      await conexao.execute<LinhaCliente[]>(
        'SELECT * FROM clientes WHERE cpf = ?',
        [cpf]
      );

    return linhas[0] ?? null;
  }

  static async findAll(
    conexao: Conexao = db
  ): Promise<Cliente[]> {
    const [linhas] =
      await conexao.execute<LinhaCliente[]>(
        'SELECT * FROM clientes ORDER BY id DESC'
      );

    return linhas;
  }

  static async update(
    id: number,
    dados: NovoCliente,
    conexao: Conexao = db
  ): Promise<boolean> {
    const [resultado] =
      await conexao.execute<ResultSetHeader>(
        `UPDATE clientes
         SET nome = ?,
             cpf = ?,
             telefone = ?,
             email = ?
         WHERE id = ?`,
        [
          dados.nome,
          dados.cpf,
          dados.telefone ?? null,
          dados.email ?? null,
          id
        ]
      );

    return resultado.affectedRows > 0;
  }

  static async setAtivo(
    id: number,
    ativo: boolean,
    conexao: Conexao = db
  ): Promise<boolean> {
    const [resultado] =
      await conexao.execute<ResultSetHeader>(
        'UPDATE clientes SET ativo = ? WHERE id = ?',
        [
          ativo ? 1 : 0,
          id
        ]
      );

    return resultado.affectedRows > 0;
  }
}
