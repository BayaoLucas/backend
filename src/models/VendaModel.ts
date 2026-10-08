import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Pool, PoolConnection } from 'mysql2/promise';
import { db } from '../config/database';
import { Venda, NovaVenda } from '../types';

type LinhaVenda = Venda & RowDataPacket;

export class VendaModel {
  // Recebe dados já validados. Regras de negócio completas serão aplicadas na Sprint 3.
  static async create(d: NovaVenda, conexao: PoolConnection): Promise<number> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      'INSERT INTO vendas (cliente_id, usuario_id, autorizador_desconto_id, subtotal, desconto_percentual, forma_pagamento) VALUES (?, ?, ?, ?, ?, ?)',
      [d.cliente_id ?? null, d.usuario_id, d.autorizador_desconto_id ?? null, d.subtotal, d.desconto_percentual ?? '0.00', d.forma_pagamento]
    );
    return resultado.insertId;
  }

  static async findById(id: number, conexao: Pool | PoolConnection = db): Promise<Venda | null> {
    const [linhas] = await conexao.execute<LinhaVenda[]>(
      'SELECT * FROM vendas WHERE id = ?', [id]
    );
    return linhas[0] ?? null;
  }

  static async findAll(conexao: Pool | PoolConnection = db): Promise<Venda[]> {
    const [linhas] = await conexao.execute<LinhaVenda[]>(
      'SELECT * FROM vendas ORDER BY id DESC'
    );
    return linhas;
  }

  static async findByClienteId(clienteId: number, conexao: Pool | PoolConnection = db): Promise<Venda[]> {
    const [linhas] = await conexao.execute<LinhaVenda[]>(
      'SELECT * FROM vendas WHERE cliente_id = ? ORDER BY id', [clienteId]
    );
    return linhas;
  }
}
