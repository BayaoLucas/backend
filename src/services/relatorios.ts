
import { RowDataPacket } from 'mysql2';
import { db } from '../config/database';
import { Venda } from '../types';
import { ClienteModel } from '../models/ClienteModel';
import { VendaModel } from '../models/VendaModel';
import { ItemVendaModel } from '../models/ItemVendaModel';
import { ErroHttp } from '../utils/erros';

type LinhaVenda = Venda & RowDataPacket;

interface LinhaResumo extends RowDataPacket {
  concluidas: number | string;
  canceladas: number | string;
  faturamento: string;
}

interface LinhaPagamento extends RowDataPacket {
  forma_pagamento: string;
  quantidade: number | string;
  total: string;
}

export async function vendasPorPeriodo(
  inicio: string,
  fim: string
): Promise<Venda[]> {
  const [vendas] = await db.execute<LinhaVenda[]>(
    `SELECT *
     FROM vendas
     WHERE realizada_em >= ?
       AND realizada_em < DATE_ADD(?, INTERVAL 1 DAY)
     ORDER BY realizada_em DESC, id DESC
     LIMIT 100`,
    [inicio, fim]
  );

  return vendas;
}

export async function historicoCliente(
  clienteId: number
) {
  const cliente = await ClienteModel.findById(clienteId);

  if (!cliente) {
    throw new ErroHttp(404, 'Cliente não encontrado.');
  }

  const vendas = await VendaModel.findByClienteId(
    clienteId
  );

  const historico = await Promise.all(
    vendas.map(async venda => ({
      ...venda,
      itens: await ItemVendaModel.findByVendaId(
        venda.id
      )
    }))
  );

  return {
    cliente,
    vendas: historico
  };
}

export async function resumoDiario(data: string) {
  const [resumos] = await db.execute<LinhaResumo[]>(
    `SELECT
       SUM(CASE WHEN status = 'CONCLUIDA'
         THEN 1 ELSE 0 END) AS concluidas,
       SUM(CASE WHEN status = 'CANCELADA'
         THEN 1 ELSE 0 END) AS canceladas,
       COALESCE(
         SUM(CASE WHEN status = 'CONCLUIDA'
           THEN total ELSE 0 END),
         0
       ) AS faturamento
     FROM vendas
     WHERE realizada_em >= ?
       AND realizada_em < DATE_ADD(?, INTERVAL 1 DAY)`,
    [data, data]
  );

  const [pagamentos] = await db.execute<LinhaPagamento[]>(
    `SELECT
       forma_pagamento,
       COUNT(*) AS quantidade,
       COALESCE(SUM(total), 0) AS total
     FROM vendas
     WHERE status = 'CONCLUIDA'
       AND realizada_em >= ?
       AND realizada_em < DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY forma_pagamento
     ORDER BY forma_pagamento`,
    [data, data]
  );

  const resumo = resumos[0];

  return {
    data,
    vendas_concluidas: Number(resumo?.concluidas ?? 0),
    vendas_canceladas: Number(resumo?.canceladas ?? 0),
    faturamento: String(resumo?.faturamento ?? '0.00'),
    pagamentos: pagamentos.map(pagamento => ({
      forma_pagamento: pagamento.forma_pagamento,
      quantidade: Number(pagamento.quantidade),
      total: String(pagamento.total)
    }))
  };
}
