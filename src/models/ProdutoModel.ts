import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Pool, PoolConnection } from 'mysql2/promise';
import { db } from '../config/database';
import { Produto, NovoProduto } from '../types';

type LinhaProduto = Produto & RowDataPacket;

export class ProdutoModel {
  // Recebe dados já validados. Regras de negócio completas serão aplicadas na Sprint 3.
  static async create(d: NovoProduto, conexao: Pool | PoolConnection = db): Promise<number> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      'INSERT INTO produtos (codigo, nome, descricao, tamanho, cor, preco, estoque) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [d.codigo, d.nome, d.descricao ?? null, d.tamanho ?? null, d.cor ?? null, d.preco, d.estoque ?? 0]
    );
    return resultado.insertId;
  }

  static async findById(id: number, conexao: Pool | PoolConnection = db): Promise<Produto | null> {
    const [linhas] = await conexao.execute<LinhaProduto[]>(
      'SELECT * FROM produtos WHERE id = ?', [id]
    );
    return linhas[0] ?? null;
  }

  static async findAll(conexao: Pool | PoolConnection = db): Promise<Produto[]> {
    const [linhas] = await conexao.execute<LinhaProduto[]>(
      'SELECT * FROM produtos ORDER BY id DESC'
    );
    return linhas;
  }

  // Atualização completa: envie todos os campos obrigatórios de NovoProduto.
  static async update(id: number, d: NovoProduto, conexao: Pool | PoolConnection = db): Promise<boolean> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      'UPDATE produtos SET codigo = ?, nome = ?, descricao = ?, tamanho = ?, cor = ?, preco = ?, estoque = ? WHERE id = ?',
      [d.codigo, d.nome, d.descricao ?? null, d.tamanho ?? null, d.cor ?? null, d.preco, d.estoque ?? 0, id]
    );
    return resultado.affectedRows > 0;
  }

  // Preserva registros e relacionamentos do histórico (RN16).
  static async inactivate(id: number, conexao: Pool | PoolConnection = db): Promise<boolean> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      'UPDATE produtos SET ativo = FALSE WHERE id = ?', [id]
    );
    return resultado.affectedRows > 0;
  }

  static async findByCodigo(codigo: string, conexao: Pool | PoolConnection = db): Promise<Produto | null> {
    const [linhas] = await conexao.execute<LinhaProduto[]>(
      'SELECT * FROM produtos WHERE codigo = ?', [codigo]
    );
    return linhas[0] ?? null;
  }
}
