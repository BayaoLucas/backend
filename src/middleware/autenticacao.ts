
import {
    NextFunction,
    Request,
    Response
  } from 'express';
  
  import { UsuarioModel } from '../models/UsuarioModel';
  import { Usuario } from '../types';
  import { ErroHttp } from '../utils/erros';
  import { identificarSessao } from '../services/sessao';
  
  type RequestComSessao = Request & {
    usuarioDaSessao?: Usuario;
    tokenDaSessao?: string;
  };
  
  export function usuarioAtual(req: Request): Usuario {
    const usuario = (
      req as RequestComSessao
    ).usuarioDaSessao;
  
    if (!usuario) {
      throw new ErroHttp(
        401,
        'É necessário entrar no sistema.'
      );
    }
  
    return usuario;
  }
  
  export function tokenAtual(req: Request): string {
    const token = (
      req as RequestComSessao
    ).tokenDaSessao;
  
    if (!token) {
      throw new ErroHttp(401, 'Sessão inválida.');
    }
  
    return token;
  }
  
  export function usuarioPublico(
    usuario: Usuario
  ): Omit<Usuario, 'senha_hash'> {
    const {
      senha_hash: _senha,
      ...dadosPublicos
    } = usuario;
  
    return dadosPublicos;
  }
  
  export async function exigirLogin(
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> {
    const cabecalho = req.headers.authorization ?? '';
  
    const correspondencia =
      /^Bearer ([A-Za-z0-9_-]{43})$/.exec(cabecalho);
  
    if (!correspondencia) {
      throw new ErroHttp(
        401,
        'Informe Authorization: Bearer SEU_TOKEN.'
      );
    }
  
    const token = correspondencia[1];
    const usuarioId = identificarSessao(token);
  
    if (!usuarioId) {
      throw new ErroHttp(
        401,
        'Sessão ausente ou expirada.'
      );
    }
  
    const usuario = await UsuarioModel.findById(usuarioId);
  
    if (
      !usuario ||
      Number(usuario.ativo) !== 1
    ) {
      throw new ErroHttp(
        401,
        'Usuário inexistente ou inativo.'
      );
    }
  
    (
      req as RequestComSessao
    ).usuarioDaSessao = usuario;
  
    (
      req as RequestComSessao
    ).tokenDaSessao = token;
  
    next();
  }
  
  export function exigirGerente(
    req: Request,
    _res: Response,
    next: NextFunction
  ): void {
    if (usuarioAtual(req).perfil !== 'GERENTE') {
      throw new ErroHttp(
        403,
        'Acesso permitido apenas a gerentes.'
      );
    }
  
    next();
  }
  