
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Pool, PoolConnection } from 'mysql2/promise';

import { db } from '../config/database';
import { Produto, NovoProduto } from '../types';

type LinhaProduto = Produto & RowDataPacket;
type Conexao = Pool | PoolConnection;

export class ProdutoModel {
  static async create(
    dados: NovoProduto,
    conexao: Conexao = db
  ): Promise<number> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      `INSERT INTO produtos
       (codigo, nome, descricao, tamanho, cor, preco, estoque)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        dados.codigo,
        dados.nome,
        dados.descricao ?? null,
        dados.tamanho ?? null,
        dados.cor ?? null,
        dados.preco,
        dados.estoque ?? 0
      ]
    );

    return resultado.insertId;
  }

  static async findById(
    id: number,
    conexao: Conexao = db
  ): Promise<Produto | null> {
    const [linhas] = await conexao.execute<LinhaProduto[]>(
      'SELECT * FROM produtos WHERE id = ?',
      [id]
    );

    return linhas[0] ?? null;
  }

  static async findByIdParaVenda(
    id: number,
    conexao: PoolConnection
  ): Promise<Produto | null> {
    const [linhas] = await conexao.execute<LinhaProduto[]>(
      'SELECT * FROM produtos WHERE id = ? FOR UPDATE',
      [id]
    );

    return linhas[0] ?? null;
  }

  static async findAll(
    filtros: {
      termo?: string;
      codigo?: string;
      incluirInativos?: boolean;
    } = {},
    conexao: Conexao = db
  ): Promise<Produto[]> {
    const condicoes: string[] = [];
    const valores: string[] = [];

    if (!filtros.incluirInativos) {
      condicoes.push('ativo = 1');
    }

    if (filtros.codigo) {
      condicoes.push('codigo = ?');
      valores.push(filtros.codigo);
    } else if (filtros.termo) {
      const termo = `%${filtros.termo}%`;

      condicoes.push(
        '(nome LIKE ? OR codigo LIKE ? OR descricao LIKE ?)'
      );

      valores.push(termo, termo, termo);
    }

    const where = condicoes.length
      ? `WHERE ${condicoes.join(' AND ')}`
      : '';

    const [linhas] = await conexao.execute<LinhaProduto[]>(
      `SELECT *
       FROM produtos
       ${where}
       ORDER BY nome ASC
       LIMIT 100`,
      valores
    );

    return linhas;
  }

  static async update(
    id: number,
    dados: NovoProduto,
    conexao: Conexao = db
  ): Promise<boolean> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      `UPDATE produtos
       SET codigo = ?, nome = ?, descricao = ?,
           tamanho = ?, cor = ?, preco = ?, estoque = ?
       WHERE id = ?`,
      [
        dados.codigo,
        dados.nome,
        dados.descricao ?? null,
        dados.tamanho ?? null,
        dados.cor ?? null,
        dados.preco,
        dados.estoque ?? 0,
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
    const [resultado] = await conexao.execute<ResultSetHeader>(
      'UPDATE produtos SET ativo = ? WHERE id = ?',
      [ativo ? 1 : 0, id]
    );

    return resultado.affectedRows > 0;
  }

  static async baixarEstoque(
    id: number,
    quantidade: number,
    conexao: PoolConnection
  ): Promise<boolean> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      `UPDATE produtos
       SET estoque = estoque - ?
       WHERE id = ? AND ativo = 1 AND estoque >= ?`,
      [quantidade, id, quantidade]
    );

    return resultado.affectedRows === 1;
  }

  static async devolverEstoque(
    id: number,
    quantidade: number,
    conexao: PoolConnection
  ): Promise<void> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      'UPDATE produtos SET estoque = estoque + ? WHERE id = ?',
      [quantidade, id]
    );

    if (resultado.affectedRows !== 1) {
      throw new Error('Produto não encontrado na devolução.');
    }
  }
}
