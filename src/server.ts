
import express, { Request, Response } from 'express';
import { db, testarConexao, mensagemConexao } from './config/database';
import { router } from './routes';
import { tratarErro } from './utils/erros';

const app = express();
const porta = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use('/api', router);

app.get('/status', (_req, res) => {
  res.json({
    projeto: 'MS² Vestuário',
    servidor: 'em execução'
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

app.use(tratarErro);

async function iniciar(): Promise<void> {
  await testarConexao();

  const servidor = app.listen(porta, () => {
    console.log(
      `Servidor MS² Vestuário: http://localhost:${porta}/status`
    );
  });

  servidor.on('error', async (erro: NodeJS.ErrnoException) => {
    console.error(
      erro.code === 'EADDRINUSE'
        ? `A porta ${porta} já está em uso.`
        : erro.message
    );

    await db.end();
    process.exitCode = 1;
  });
}

iniciar().catch(async erro => {
  console.error(mensagemConexao(erro));
  await db.end();
  process.exitCode = 1;
});
