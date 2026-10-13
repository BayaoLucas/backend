
import {
    createHash,
    randomBytes
  } from 'node:crypto';
  
  const DURACAO_MS = 8 * 60 * 60 * 1000;
  
  const sessoes = new Map<
    string,
    {
      usuarioId: number;
      expiraEm: number;
    }
  >();
  
  function chave(token: string): string {
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }
  
  export function iniciarSessao(
    usuarioId: number
  ): {
    token: string;
    expiraEm: string;
  } {
    const token = randomBytes(32).toString('base64url');
    const expiraEm = Date.now() + DURACAO_MS;
  
    sessoes.set(chave(token), {
      usuarioId,
      expiraEm
    });
  
    return {
      token,
      expiraEm: new Date(expiraEm).toISOString()
    };
  }
  
  export function identificarSessao(
    token: string
  ): number | null {
    const identificador = chave(token);
    const sessao = sessoes.get(identificador);
  
    if (!sessao) return null;
  
    if (sessao.expiraEm <= Date.now()) {
      sessoes.delete(identificador);
      return null;
    }
  
    return sessao.usuarioId;
  }
  
  export function encerrarSessao(
    token: string
  ): void {
    sessoes.delete(chave(token));
  }
  