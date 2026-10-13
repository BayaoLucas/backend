
import { ErrorRequestHandler } from 'express';

export class ErroHttp extends Error {
  constructor(
    public readonly status: number,
    mensagem: string
  ) {
    super(mensagem);
    this.name = 'ErroHttp';
  }
}

export const tratarErro: ErrorRequestHandler = (
  erro: unknown,
  _req,
  res,
  _next
) => {
  if (res.headersSent) return;

  if (erro instanceof ErroHttp) {
    res.status(erro.status).json({
      erro: erro.message
    });
    return;
  }

  if (erro instanceof SyntaxError && 'body' in erro) {
    res.status(400).json({
      erro: 'JSON inválido no corpo da requisição.'
    });
    return;
  }

  const codigo = (
    erro as { code?: string } | null
  )?.code;

  if (codigo === 'ER_DUP_ENTRY') {
    res.status(409).json({
      erro: 'Já existe um cadastro com esse valor único.'
    });
    return;
  }

  if (
    codigo === 'ER_NO_REFERENCED_ROW_2' ||
    codigo === 'ER_ROW_IS_REFERENCED_2'
  ) {
    res.status(409).json({
      erro: 'Operação incompatível com registros relacionados.'
    });
    return;
  }

  if (
    codigo === 'ER_CHECK_CONSTRAINT_VIOLATED' ||
    codigo === 'ER_BAD_NULL_ERROR' ||
    codigo === 'ER_DATA_TOO_LONG'
  ) {
    res.status(422).json({
      erro: 'Os dados não atendem às regras do banco.'
    });
    return;
  }

  console.error('Falha interna:', erro);

  res.status(500).json({
    erro: 'Erro interno do servidor.'
  });
};
