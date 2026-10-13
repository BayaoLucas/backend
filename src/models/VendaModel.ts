
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Pool, PoolConnection } from 'mysql2/promise';

import { db } from '../config/database';

import {
  Venda,
  NovaVenda,
  StatusVenda
} from '../types';

type LinhaVenda = Venda & RowDataPacket;
type Conexao = Pool | PoolConnection;

export class VendaModel {
  static async create(
    dados: NovaVenda,
    conexao: PoolConnection
  ): Promise<number> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      `INSERT INTO vendas
       (cliente_id, usuario_id, autorizador_desconto_id,
        subtotal, desconto_percentual, forma_pagamento)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        dados.cliente_id ?? null,
        dados.usuario_id,
        dados.autorizador_desconto_id ?? null,
        dados.subtotal,
        dados.desconto_percentual ?? '0.00',
        dados.forma_pagamento
      ]
    );

    return resultado.insertId;
  }

  static async findById(
    id: number,
    conexao: Conexao = db
  ): Promise<Venda | null> {
    const [linhas] = await conexao.execute<LinhaVenda[]>(
      'SELECT * FROM vendas WHERE id = ?',
      [id]
    );

    return linhas[0] ?? null;
  }

  static async findByIdParaCancelamento(
    id: number,
    conexao: PoolConnection
  ): Promise<Venda | null> {
    const [linhas] = await conexao.execute<LinhaVenda[]>(
      'SELECT * FROM vendas WHERE id = ? FOR UPDATE',
      [id]
    );

    return linhas[0] ?? null;
  }

  static async findAll(
    filtros: {
      inicio?: string;
      fim?: string;
      status?: StatusVenda;
    } = {},
    conexao: Conexao = db
  ): Promise<Venda[]> {
    const condicoes: string[] = [];
    const valores: string[] = [];

    if (filtros.inicio) {
      condicoes.push('realizada_em >= ?');
      valores.push(filtros.inicio);
    }

    if (filtros.fim) {
      condicoes.push(
        'realizada_em < DATE_ADD(?, INTERVAL 1 DAY)'
      );
      valores.push(filtros.fim);
    }

    if (filtros.status) {
      condicoes.push('status = ?');
      valores.push(filtros.status);
    }

    const where = condicoes.length
      ? `WHERE ${condicoes.join(' AND ')}`
      : '';

    const [linhas] = await conexao.execute<LinhaVenda[]>(
      `SELECT *
       FROM vendas
       ${where}
       ORDER BY realizada_em DESC, id DESC
       LIMIT 100`,
      valores
    );

    return linhas;
  }

  static async findByClienteId(
    clienteId: number,
    conexao: Conexao = db
  ): Promise<Venda[]> {
    const [linhas] = await conexao.execute<LinhaVenda[]>(
      `SELECT *
       FROM vendas
       WHERE cliente_id = ?
       ORDER BY realizada_em DESC, id DESC`,
      [clienteId]
    );

    return linhas;
  }

  static async cancelar(
    id: number,
    gerenteId: number,
    motivo: string,
    conexao: PoolConnection
  ): Promise<boolean> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      `UPDATE vendas
       SET status = 'CANCELADA',
           cancelado_por_id = ?,
           cancelada_em = NOW(),
           motivo_cancelamento = ?
       WHERE id = ? AND status = 'CONCLUIDA'`,
      [gerenteId, motivo, id]
    );

    return resultado.affectedRows === 1;
  }

  static async resumoDiario(data: string) {
    const [resumos] = await db.execute<RowDataPacket[]>(
      `SELECT
         SUM(CASE WHEN status = 'CONCLUIDA'
             THEN 1 ELSE 0 END) AS concluidas,
         SUM(CASE WHEN status = 'CANCELADA'
             THEN 1 ELSE 0 END) AS canceladas,
         COALESCE(
           SUM(CASE WHEN status = 'CONCLUIDA'
             THEN total ELSE 0 END), 0
         ) AS faturamento
       FROM vendas
       WHERE realizada_em >= ?
         AND realizada_em < DATE_ADD(?, INTERVAL 1 DAY)`,
      [data, data]
    );

    const [pagamentos] = await db.execute<RowDataPacket[]>(
      `SELECT
         forma_pagamento,
         COUNT(*) AS quantidade,
         SUM(total) AS valor
       FROM vendas
       WHERE status = 'CONCLUIDA'
         AND realizada_em >= ?
         AND realizada_em < DATE_ADD(?, INTERVAL 1 DAY)
       GROUP BY forma_pagamento
       ORDER BY forma_pagamento`,
      [data, data]
    );

    return {
      data,
      vendas_concluidas: Number(
        resumos[0]?.concluidas ?? 0
      ),
      vendas_canceladas: Number(
        resumos[0]?.canceladas ?? 0
      ),
      faturamento: String(
        resumos[0]?.faturamento ?? '0.00'
      ),
      pagamentos: pagamentos.map(p => ({
        forma_pagamento: p.forma_pagamento,
        quantidade: Number(p.quantidade),
        valor: String(p.valor)
      }))
    };
  }
}
