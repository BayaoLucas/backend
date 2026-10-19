
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Pool, PoolConnection } from 'mysql2/promise';

import { db } from '../config/database';
import { Usuario, NovoUsuario } from '../types';
import { ApiError } from '../middleware/AuthMiddleware';

type LinhaUsuario = Usuario & RowDataPacket;
type Conexao = Pool | PoolConnection;

export class UsuarioModel {
  static async create(
    dados: NovoUsuario,
    conexao: Conexao = db
  ): Promise<number> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      `INSERT INTO usuarios
       (nome, email, senha_hash, perfil)
       VALUES (?, ?, ?, ?)`,
      [
        dados.nome,
        dados.email,
        dados.senha_hash,
        dados.perfil
      ]
    );

    return resultado.insertId;
  }

  static async criarPrimeiroGerente(
    dados: NovoUsuario
  ): Promise<number> {
    const conexao = await db.getConnection();
    let bloqueado = false;

    try {
      const [bloqueios] = await conexao.query<RowDataPacket[]>(
        'SELECT GET_LOCK(?, 5) AS adquirido',
        ['ms2_primeiro_gerente']
      );

      if (Number(bloqueios[0]?.adquirido) !== 1) {
        throw new ApiError(
          503,
          'Não foi possível iniciar o cadastro gerencial.'
        );
      }

      bloqueado = true;

      const [usuarios] = await conexao.query<RowDataPacket[]>(
        'SELECT COUNT(*) AS quantidade FROM usuarios'
      );

      if (Number(usuarios[0].quantidade) !== 0) {
        throw new ApiError(
          403,
          'O cadastro inicial já foi encerrado.'
        );
      }

      return await UsuarioModel.create(dados, conexao);
    } finally {
      if (bloqueado) {
        await conexao.query(
          'SELECT RELEASE_LOCK(?)',
          ['ms2_primeiro_gerente']
        );
      }

      conexao.release();
    }
  }

  static async findById(
    id: number,
    conexao: Conexao = db
  ): Promise<Usuario | null> {
    const [linhas] = await conexao.execute<LinhaUsuario[]>(
      'SELECT * FROM usuarios WHERE id = ?',
      [id]
    );

    return linhas[0] ?? null;
  }

  static async findByEmail(
    email: string,
    conexao: Conexao = db
  ): Promise<Usuario | null> {
    const [linhas] = await conexao.execute<LinhaUsuario[]>(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    return linhas[0] ?? null;
  }

  static async findAll(
    conexao: Conexao = db
  ): Promise<Usuario[]> {
    const [linhas] = await conexao.execute<LinhaUsuario[]>(
      'SELECT * FROM usuarios ORDER BY id DESC'
    );

    return linhas;
  }

  static async update(
    id: number,
    dados: NovoUsuario,
    conexao: Conexao = db
  ): Promise<boolean> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      `UPDATE usuarios
       SET nome = ?, email = ?, senha_hash = ?, perfil = ?
       WHERE id = ?`,
      [
        dados.nome,
        dados.email,
        dados.senha_hash,
        dados.perfil,
        id
      ]
    );

    return resultado.affectedRows > 0;
  }

  static async atualizarSenha(
    id: number,
    senhaHash: string,
    conexao: Conexao = db
  ): Promise<void> {
    await conexao.execute(
      'UPDATE usuarios SET senha_hash = ? WHERE id = ?',
      [senhaHash, id]
    );
  }

  static async setAtivo(
    id: number,
    ativo: boolean,
    conexao: Conexao = db
  ): Promise<boolean> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      'UPDATE usuarios SET ativo = ? WHERE id = ?',
      [ativo ? 1 : 0, id]
    );

    return resultado.affectedRows > 0;
  }
}
