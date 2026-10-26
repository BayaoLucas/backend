import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Pool, PoolConnection } from 'mysql2/promise';

import { db } from '../config/database';
import { Produto, NovoProduto } from '../types';

type LinhaProduto = Produto & RowDataPacket;
type Conexao = Pool | PoolConnection;

export class ProdutoModel {
  static async gerarProximoCodigo(conexao: Conexao = db): Promise<string> {
    await conexao.query(`
      CREATE TABLE IF NOT EXISTS sequencia_codigos_produto (
        numero INT AUTO_INCREMENT PRIMARY KEY
      ) ENGINE=InnoDB;
    `);

    const [contagem] = await conexao.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM sequencia_codigos_produto'
    );

    if (Number(contagem[0]?.total || 0) === 0) {
      const [maxProd] = await conexao.query<RowDataPacket[]>(
        'SELECT MAX(id) as max_id FROM produtos'
      );
      const inicial = Number(maxProd[0]?.max_id || 0);
      if (inicial > 0) {
        await conexao.query(
          'INSERT INTO sequencia_codigos_produto (numero) VALUES (?)',
          [inicial]
        );
      }
    }

    const [res] = await conexao.execute<ResultSetHeader>(
      'INSERT INTO sequencia_codigos_produto VALUES (NULL)'
    );

    return String(res.insertId);
  }

  static async obterProximoCodigoPrevisao(conexao: Conexao = db): Promise<string> {
    await conexao.query(`
      CREATE TABLE IF NOT EXISTS sequencia_codigos_produto (
        numero INT AUTO_INCREMENT PRIMARY KEY
      ) ENGINE=InnoDB;
    `);

    const [res] = await conexao.query<RowDataPacket[]>(
      'SELECT MAX(numero) as max_num FROM sequencia_codigos_produto'
    );

    const maxSeq = Number(res[0]?.max_num || 0);
    if (maxSeq > 0) {
      return String(maxSeq + 1);
    }

    const [maxProd] = await conexao.query<RowDataPacket[]>(
      'SELECT MAX(id) as max_id FROM produtos'
    );
    return String(Number(maxProd[0]?.max_id || 0) + 1);
  }

  static async create(
    dados: NovoProduto,
    conexao: Conexao = db
  ): Promise<number> {
    let codigo = dados.codigo ? String(dados.codigo).trim() : '';

    if (!codigo) {
      codigo = await ProdutoModel.gerarProximoCodigo(conexao);
    }

    const [resultado] = await conexao.execute<ResultSetHeader>(
      `INSERT INTO produtos
       (codigo, nome, descricao, tamanho, cor, preco, estoque)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo,
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
       ORDER BY id ASC
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
