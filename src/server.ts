import cors from 'cors';
import express, { 
  Request,
  Response,
  NextFunction
} from 'express';

import { db, testarConexao } from './config/database';

import { usuarioRoutes } from './routes/usuarioRoutes';
import { clienteRoutes } from './routes/clienteRoutes';
import { produtoRoutes } from './routes/produtoRoutes';
import { vendaRoutes } from './routes/vendaRoutes';
import { itemVendaRoutes } from './routes/itemVendaRoutes';

import { UsuarioController } from './controllers/UsuarioController';

import {
  ApiError,
  autenticar
} from './middleware/AuthMiddleware';

const app = express();
const porta = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.get(['/status', '/api/status'], (_req, res) => {
  res.status(200).json({
    projeto: 'MS² Vestuário',
    servidor: 'em execução'
  });
});

// Compatibilidade com a URL de login anterior.

app.post(
  '/api/auth/login',
  UsuarioController.login
);

app.get(
  '/api/auth/me',
  autenticar,
  UsuarioController.meuPerfil
);

app.post(
  '/api/auth/logout',
  autenticar,
  UsuarioController.logout
);

// Rotas organizadas pelo padrão MCR.

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/itens-venda', itemVendaRoutes);

// Rota não encontrada.

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    erro: 'Rota não encontrada.'
  });
});

// Tratamento centralizado de erros.

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
      erro: 'JSON inválido.'
    });
    return;
  }

  const codigo = (
    erro as { code?: string } | null
  )?.code;

  if (codigo === 'ER_DUP_ENTRY') {
    res.status(409).json({
      erro: 'Registro duplicado. Verifique CPF, e-mail ou código.'
    });
    return;
  }

  if (
    codigo === 'ER_NO_REFERENCED_ROW_2' ||
    codigo === 'ER_ROW_IS_REFERENCED_2'
  ) {
    res.status(409).json({
      erro: 'Operação incompatível com os relacionamentos do banco.'
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
      erro: 'Dados incompatíveis com as regras do banco.'
    });
    return;
  }

  console.error('Erro interno:', erro);

  res.status(500).json({
    erro: 'Erro interno do servidor.'
  });
});

async function iniciar(): Promise<void> {
  if (!process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32) {
    throw new Error(
      'Configure JWT_SECRET no arquivo .env.'
    );
  }

  await testarConexao();

  const servidor = app.listen(porta, () => {
    console.log(
      `MS² Vestuário em http://localhost:${porta}/api/status`
    );
  });

  servidor.on('error', erro => {
    console.error('Erro ao iniciar o servidor:', erro);
    process.exitCode = 1;
  });
}

iniciar().catch(async erro => {
  console.error('Falha na inicialização:', erro);
  await db.end();
  process.exitCode = 1;
});
