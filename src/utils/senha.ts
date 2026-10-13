
import {
    randomBytes,
    scrypt,
    timingSafeEqual
  } from 'node:crypto';
  
  import { ErroHttp } from './erros';
  
  const CUSTO = 16384;
  const BLOCO = 8;
  const PARALELISMO = 1;
  const TAMANHO = 64;
  
  function derivar(
    senha: string,
    sal: string
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(
        senha,
        sal,
        TAMANHO,
        {
          N: CUSTO,
          r: BLOCO,
          p: PARALELISMO
        },
        (erro, resultado) => {
          if (erro) reject(erro);
          else resolve(resultado);
        }
      );
    });
  }
  
  export function conferirFormatoSenha(
    senha: unknown
  ): asserts senha is string {
    if (
      typeof senha !== 'string' ||
      senha.length < 8 ||
      senha.length > 128
    ) {
      throw new ErroHttp(
        400,
        'A senha deve conter entre 8 e 128 caracteres.'
      );
    }
  }
  
  export async function gerarHashSenha(
    senha: string
  ): Promise<string> {
    conferirFormatoSenha(senha);
  
    const sal = randomBytes(16).toString('hex');
    const hash = await derivar(senha, sal);
  
    return `scrypt$${CUSTO}$${BLOCO}$${PARALELISMO}$${sal}$${hash.toString('hex')}`;
  }
  
  export async function verificarSenha(
    senha: string,
    armazenado: string
  ): Promise<boolean> {
    try {
      const partes = armazenado.split('$');
  
      if (
        partes.length !== 6 ||
        partes[0] !== 'scrypt'
      ) {
        return false;
      }
  
      const [
        _,
        nTexto,
        rTexto,
        pTexto,
        sal,
        hashHex
      ] = partes;
  
      if (
        nTexto !== String(CUSTO) ||
        rTexto !== String(BLOCO) ||
        pTexto !== String(PARALELISMO)
      ) {
        return false;
      }
  
      if (
        !/^[a-f0-9]{32}$/.test(sal) ||
        !/^[a-f0-9]{128}$/.test(hashHex)
      ) {
        return false;
      }
  
      const hashRecebido = Buffer.from(
        hashHex,
        'hex'
      );
  
      const hashCalculado = await derivar(
        senha,
        sal
      );
  
      return timingSafeEqual(
        hashRecebido,
        hashCalculado
      );
    } catch {
      return false;
    }
  }
  