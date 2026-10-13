
import { RowDataPacket } from 'mysql2';
import { db } from '../config/database';
import { Produto } from '../types';

type LinhaProduto = Produto & RowDataPacket;

interface FiltroCatalogo {
  codigo?: string;
  termo?: string;
  incluirInativos?: boolean;
}

export async function buscarProdutos(
  filtro: FiltroCatalogo
): Promise<Produto[]> {
  const condicoes: string[] = [];
  const valores: string[] = [];

  if (!filtro.incluirInativos) {
    condicoes.push('ativo = 1');
  }

  if (filtro.codigo) {
    condicoes.push('codigo = ?');
    valores.push(filtro.codigo.trim().toUpperCase());
  } else if (filtro.termo) {
    const termo = `%${filtro.termo.trim()}%`;

    condicoes.push(
      '(nome LIKE ? OR descricao LIKE ? OR codigo LIKE ?)'
    );

    valores.push(termo, termo, termo);
  }

  const where = condicoes.length
    ? `WHERE ${condicoes.join(' AND ')}`
    : '';

  const [produtos] = await db.execute<LinhaProduto[]>(
    `SELECT *
     FROM produtos
     ${where}
     ORDER BY nome ASC
     LIMIT 100`,
    valores
  );

  return produtos;
}
