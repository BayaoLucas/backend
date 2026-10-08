import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Pool, PoolConnection } from 'mysql2/promise';
import { db } from '../config/database';
import { Usuario, NovoUsuario } from '../types';

type LinhaUsuario = Usuario & RowDataPacket;

export class UsuarioModel {
  // Recebe dados já validados. Regras de negócio completas serão aplicadas na Sprint 3.
  static async create(d: NovoUsuario, conexao: Pool | PoolConnection = db): Promise<number> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)',
      [d.nome, d.email, d.senha_hash, d.perfil]
    );
    return resultado.insertId;
  }

  static async findById(id: number, conexao: Pool | PoolConnection = db): Promise<Usuario | null> {
    const [linhas] = await conexao.execute<LinhaUsuario[]>(
      'SELECT * FROM usuarios WHERE id = ?', [id]
    );
    return linhas[0] ?? null;
  }

  static async findAll(conexao: Pool | PoolConnection = db): Promise<Usuario[]> {
    const [linhas] = await conexao.execute<LinhaUsuario[]>(
      'SELECT * FROM usuarios ORDER BY id DESC'
    );
    return linhas;
  }

  // Atualização completa: envie todos os campos obrigatórios de NovoUsuario.
  static async update(id: number, d: NovoUsuario, conexao: Pool | PoolConnection = db): Promise<boolean> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      'UPDATE usuarios SET nome = ?, email = ?, senha_hash = ?, perfil = ? WHERE id = ?',
      [d.nome, d.email, d.senha_hash, d.perfil, id]
    );
    return resultado.affectedRows > 0;
  }

  // Preserva registros e relacionamentos do histórico (RN16).
  static async inactivate(id: number, conexao: Pool | PoolConnection = db): Promise<boolean> {
    const [resultado] = await conexao.execute<ResultSetHeader>(
      'UPDATE usuarios SET ativo = FALSE WHERE id = ?', [id]
    );
    return resultado.affectedRows > 0;
  }

  static async findByEmail(email: string, conexao: Pool | PoolConnection = db): Promise<Usuario | null> {
    const [linhas] = await conexao.execute<LinhaUsuario[]>(
      'SELECT * FROM usuarios WHERE email = ?', [email]
    );
    return linhas[0] ?? null;
  }
}
