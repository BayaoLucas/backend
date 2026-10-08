import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Pool, PoolConnection } from 'mysql2/promise';
import { db } from '../config/database';
import { ItemVenda, NovoItemVenda } from '../types';

type LinhaItemVenda = ItemVenda & RowDataPacket;

export class ItemVendaModel {
  // Recebe dados já validados. Regras de negócio completas serão aplicadas na Sprint 3.
  static async create(d: NovoItemVenda, conexao: PoolConnection): Promise<number> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      'INSERT INTO itens_venda (venda_id, produto_id, codigo_produto, nome_produto, quantidade, preco_unitario) VALUES (?, ?, ?, ?, ?, ?)',
      [d.venda_id, d.produto_id, d.codigo_produto, d.nome_produto, d.quantidade, d.preco_unitario]
    );
    return resultado.insertId;
  }

  static async findById(id: number, conexao: Pool | PoolConnection = db): Promise<ItemVenda | null> {
    const [linhas] = await conexao.execute<LinhaItemVenda[]>(
      'SELECT * FROM itens_venda WHERE id = ?', [id]
    );
    return linhas[0] ?? null;
  }

  static async findAll(conexao: Pool | PoolConnection = db): Promise<ItemVenda[]> {
    const [linhas] = await conexao.execute<LinhaItemVenda[]>(
      'SELECT * FROM itens_venda ORDER BY id DESC'
    );
    return linhas;
  }

  static async findByVendaId(vendaId: number, conexao: Pool | PoolConnection = db): Promise<ItemVenda[]> {
    const [linhas] = await conexao.execute<LinhaItemVenda[]>(
      'SELECT * FROM itens_venda WHERE venda_id = ? ORDER BY id', [vendaId]
    );
    return linhas;
  }
}
