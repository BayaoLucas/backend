import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Pool, PoolConnection } from 'mysql2/promise';
import { randomBytes } from 'node:crypto';

import { db } from '../config/database';
import { Produto, NovoProduto } from '../types';

type LinhaProduto = Produto & RowDataPacket;
type Conexao = Pool | PoolConnection;

export class ProdutoModel {
  static async gerarCodigoAleatorioUnico(conexao: Conexao = db): Promise<string> {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo = '';
    let existe = true;

    while (existe) {
      const bytes = randomBytes(6);
      let parteAleatoria = '';
      for (let i = 0; i < 6; i++) {
        parteAleatoria += caracteres[bytes[i] % caracteres.length];
      }
      codigo = `AUR-${parteAleatoria}`;

      const [linhas] = await conexao.execute<RowDataPacket[]>(
        'SELECT id FROM produtos WHERE codigo = ? LIMIT 1',
        [codigo]
      );
      if (linhas.length === 0) {
        existe = false;
      }
    }

    return codigo;
  }

  static async create(
    dados: NovoProduto,
    conexao: Conexao = db
  ): Promise<number> {
    let codigo = dados.codigo ? String(dados.codigo).trim() : '';

    if (!codigo) {
      codigo = await ProdutoModel.gerarCodigoAleatorioUnico(conexao);
    }

    const [resultado] = await conexao.execute<ResultSetHeader>(
      `INSERT INTO produtos
       (codigo, nome, descricao, tamanho, cor, genero, preco, estoque, imagem_url, visivel_catalogo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo,
        dados.nome,
        dados.descricao ?? null,
        dados.tamanho ?? null,
        dados.cor ?? null,
        dados.genero ?? null,
        dados.preco,
        dados.estoque ?? 0,
        dados.imagem_url ?? null,
        dados.visivel_catalogo ?? 1
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
      genero?: string;
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
        '(nome LIKE ? OR codigo LIKE ? OR descricao LIKE ? OR cor LIKE ?)'
      );

      valores.push(termo, termo, termo, termo);
    }

    if (filtros.genero) {
      condicoes.push('genero = ?');
      valores.push(filtros.genero);
    }

    const where = condicoes.length
      ? `WHERE ${condicoes.join(' AND ')}`
      : '';

    const [linhas] = await conexao.execute<LinhaProduto[]>(
      `SELECT *
       FROM produtos
       ${where}
       ORDER BY id DESC
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
           tamanho = ?, cor = ?, genero = ?, preco = ?, estoque = ?,
           imagem_url = ?, visivel_catalogo = ?
       WHERE id = ?`,
      [
        dados.codigo,
        dados.nome,
        dados.descricao ?? null,
        dados.tamanho ?? null,
        dados.cor ?? null,
        dados.genero ?? null,
        dados.preco,
        dados.estoque ?? 0,
        dados.imagem_url ?? null,
        dados.visivel_catalogo ?? 1,
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

  static async setVisivelCatalogo(
    id: number,
    visivel: boolean,
    conexao: Conexao = db
  ): Promise<boolean> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      'UPDATE produtos SET visivel_catalogo = ? WHERE id = ?',
      [visivel ? 1 : 0, id]
    );
    return resultado.affectedRows > 0;
  }

  static async temVendasAssociadas(
    id: number,
    conexao: Conexao = db
  ): Promise<boolean> {
    const [linhas] = await conexao.execute<RowDataPacket[]>(
      'SELECT id FROM itens_venda WHERE produto_id = ? LIMIT 1',
      [id]
    );
    return linhas.length > 0;
  }

  static async delete(
    id: number,
    conexao: Conexao = db
  ): Promise<boolean> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      'DELETE FROM produtos WHERE id = ?',
      [id]
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
