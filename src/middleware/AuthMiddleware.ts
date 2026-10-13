
import {
    Request,
    Response,
    NextFunction
  } from 'express';
  
  import jwt, { JwtPayload } from 'jsonwebtoken';
  
  import {
    createHash,
    randomUUID
  } from 'node:crypto';
  
  import { UsuarioModel } from '../models/UsuarioModel';
  import { Usuario } from '../types';
  
  type RequisicaoAutenticada = Request & {
    usuarioDoSistema?: Usuario;
  };
  
  export class ApiError extends Error {
    constructor(
      public readonly status: number,
      mensagem: string
    ) {
      super(mensagem);
      this.name = 'ApiError';
    }
  }
  
  const tokensRevogados = new Map<string, number>();
  
  function segredoJwt(): string {
    const segredo = process.env.JWT_SECRET;
  
    if (!segredo || segredo.length < 32) {
      throw new Error(
        'Configure JWT_SECRET com pelo menos 32 caracteres no .env.'
      );
    }
  
    return segredo;
  }
  
  function chaveToken(token: string): string {
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }
  
  export function gerarToken(usuarioId: number): string {
    return jwt.sign(
      {},
      segredoJwt(),
      {
        subject: String(usuarioId),
        expiresIn: '8h',
        issuer: 'ms2-vestuario',
        audience: 'ms2-api',
        jwtid: randomUUID(),
        algorithm: 'HS256'
      }
    );
  }
  
  export function revogarToken(token: string): void {
    const payload = jwt.decode(token) as JwtPayload | null;
  
    if (payload && typeof payload.exp === 'number') {
      tokensRevogados.set(
        chaveToken(token),
        payload.exp * 1000
      );
    }
  }
  
  export function usuarioAutenticado(req: Request): Usuario {
    const usuario = (
      req as RequisicaoAutenticada
    ).usuarioDoSistema;
  
    if (!usuario) {
      throw new ApiError(401, 'Usuário não autenticado.');
    }
  
    return usuario;
  }
  
  export async function autenticar(
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const autorizacao = req.headers.authorization;
  
      if (
        !autorizacao ||
        !/^Bearer \S+$/.test(autorizacao)
      ) {
        throw new ApiError(
          401,
          'Informe um token Bearer válido.'
        );
      }
  
      const token = autorizacao.slice(7);
      const chave = chaveToken(token);
  
      const expiracaoRevogacao = tokensRevogados.get(chave);
  
      if (expiracaoRevogacao !== undefined) {
        if (expiracaoRevogacao > Date.now()) {
          throw new ApiError(401, 'Token revogado.');
        }
  
        tokensRevogados.delete(chave);
      }
  
      const resultado = jwt.verify(
        token,
        segredoJwt(),
        {
          algorithms: ['HS256'],
          issuer: 'ms2-vestuario',
          audience: 'ms2-api'
        }
      );
  
      if (
        typeof resultado === 'string' ||
        !resultado.sub ||
        !/^[1-9]\d*$/.test(resultado.sub)
      ) {
        throw new ApiError(401, 'Token inválido.');
      }
  
      const usuarioId = Number(resultado.sub);
  
      if (!Number.isSafeInteger(usuarioId)) {
        throw new ApiError(401, 'Token inválido.');
      }
  
      const usuario = await UsuarioModel.findById(usuarioId);
  
      if (!usuario || Number(usuario.ativo) !== 1) {
        throw new ApiError(
          401,
          'Usuário inexistente ou inativo.'
        );
      }
  
      (
        req as RequisicaoAutenticada
      ).usuarioDoSistema = usuario;
  
      next();
    } catch (erro) {
      if (erro instanceof ApiError) {
        next(erro);
        return;
      }
  
      if (erro instanceof jwt.JsonWebTokenError ||
          erro instanceof jwt.TokenExpiredError) {
        next(new ApiError(401, 'Token inválido ou expirado.'));
        return;
      }
  
      next(erro);
    }
  }
  
  export function somenteGerente(
    req: Request,
    _res: Response,
    next: NextFunction
  ): void {
    try {
      const usuario = usuarioAutenticado(req);
  
      if (usuario.perfil !== 'GERENTE') {
        throw new ApiError(
          403,
          'Operação permitida apenas para gerentes.'
        );
      }
  
      next();
    } catch (erro) {
      next(erro);
    }
  }
  