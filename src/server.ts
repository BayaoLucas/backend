import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import {
  db,
  testarConexao,
  mensagemConexao
} from './config/database';

import { ApiError } from './middleware/authMiddleware';
import { router } from './routes';

const app = express();
const porta = Number(process.env.PORT || 3000);

// Autoriza o frontend (permite localhost e 127.0.0.1 em qualquer porta local)
app.use(
  cors({
    origin: (origem, callback) => {
      if (!origem || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origem)) {
        callback(null, true);
      } else {
        callback(new Error('Origem nao permitida pelo CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Permite receber JSON
app.use(express.json());

// ROTA PUBLICA
app.get('/api/status', (_req, res) => {
  res.status(200).json({
    projeto: 'Aurora',
    servidor: 'em execucao'
  });
});

// Demais rotas da aplicacao
app.use('/api', router);

// Rota nao encontrada
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    erro: 'Rota nao encontrada.'
  });
});

// Tratamento centralizado de erros
app.use((
  erro: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (res.headersSent) return;

  if (erro instanceof ApiError) {
    res.status(erro.status).json({
      erro: erro.message
    });
    return;
  }

  if (erro instanceof SyntaxError && 'body' in erro) {
    res.status(400).json({
      erro: 'JSON invalido.'
    });
    return;
  }

  const codigo = (erro as { code?: string } | null)?.code;

  if (codigo === 'ER_DUP_ENTRY') {
    res.status(409).json({
      erro: 'Registro duplicado. Verifique CPF, e-mail ou codigo.'
    });
    return;
  }

  if (
    codigo === 'ER_NO_REFERENCED_ROW_2' ||
    codigo === 'ER_ROW_IS_REFERENCED_2'
  ) {
    res.status(409).json({
      erro: 'Operacao incompativel com os relacionamentos do banco.'
    });
    return;
  }

  if (
    codigo === 'ER_CHECK_CONSTRAINT_VIOLATED' ||
    codigo === 'ER_BAD_NULL_ERROR' ||
    codigo === 'ER_DATA_TOO_LONG' ||
    codigo === 'ER_DATA_OUT_OF_RANGE'
  ) {
    res.status(422).json({
      erro: 'Dados incompativeis com as regras do banco.'
    });
    return;
  }

  console.error('Erro interno:', erro);

  res.status(500).json({
    erro: 'Erro interno do servidor.'
  });
});

async function iniciar(): Promise<void> {
  await testarConexao();

  const servidor = app.listen(porta, () => {
    console.log(
      `Aurora em http://localhost:${porta}/api/status`
    );
  });

  servidor.on(
    'error',
    async (erro: NodeJS.ErrnoException) => {
      if (erro.code === 'EADDRINUSE') {
        console.error(
          `A porta ${porta} ja esta em uso. Pare o outro servidor ou altere PORT no .env.`
        );
      } else {
        console.error(erro.message);
      }

      await db.end();
      process.exitCode = 1;
    }
  );
}

iniciar().catch(async (erro) => {
  console.error(`Falha na inicializacao: ${mensagemConexao(erro)}`);
  await db.end();
  process.exitCode = 1;
});