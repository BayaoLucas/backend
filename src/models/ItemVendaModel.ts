
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Pool, PoolConnection } from 'mysql2/promise';

import { db } from '../config/database';

import {
  ItemVenda,
  NovoItemVenda
} from '../types';

type LinhaItemVenda = ItemVenda & RowDataPacket;
type Conexao = Pool | PoolConnection;

export class ItemVendaModel {
  static async create(
    dados: NovoItemVenda,
    conexao: PoolConnection
  ): Promise<number> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      `INSERT INTO itens_venda
       (venda_id, produto_id, codigo_produto,
        nome_produto, quantidade, preco_unitario)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        dados.venda_id,
        dados.produto_id,
        dados.codigo_produto,
        dados.nome_produto,
        dados.quantidade,
        dados.preco_unitario
      ]
    );

    return resultado.insertId;
  }

  static async findById(
    id: number,
    conexao: Conexao = db
  ): Promise<ItemVenda | null> {
    const [linhas] = await conexao.execute<LinhaItemVenda[]>(
      'SELECT * FROM itens_venda WHERE id = ?',
      [id]
    );

    return linhas[0] ?? null;
  }

  static async findAll(
    conexao: Conexao = db
  ): Promise<ItemVenda[]> {
    const [linhas] = await conexao.execute<LinhaItemVenda[]>(
      `SELECT *
       FROM itens_venda
       ORDER BY id DESC
       LIMIT 100`
    );

    return linhas;
  }

  static async findByVendaId(
    vendaId: number,
    conexao: Conexao = db
  ): Promise<ItemVenda[]> {
    const [linhas] = await conexao.execute<LinhaItemVenda[]>(
      `SELECT *
       FROM itens_venda
       WHERE venda_id = ?
       ORDER BY produto_id ASC`,
      [vendaId]
    );

    return linhas;
  }
}
