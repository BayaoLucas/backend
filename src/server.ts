import express from 'express';
import {
  db,
  testarConexao,
  mensagemConexao
} from './config/database';
import { router } from './routes';

const app = express();
const porta = Number(process.env.PORT || 3000);

app.use(express.json());
app.use('/api', router);

app.get('/status', (_req, res) => {
  res.json({
    projeto: 'MS² Vestuário',
    sprint: 2,
    servidor: 'em execução'
  });
});

async function iniciar(): Promise<void> {
  await testarConexao();

  const servidor = app.listen(porta, () => {
    console.log(
      `Backend Sprint 2 em http://localhost:${porta}/status`
    );
  });

  servidor.on('error', async (erro: NodeJS.ErrnoException) => {
    if (erro.code === 'EADDRINUSE') {
      console.error(`A porta ${porta} já está em uso.`);
    } else {
      console.error(erro.message);
    }

    await db.end();
    process.exitCode = 1;
  });
}

iniciar().catch(async erro => {
  console.error(mensagemConexao(erro));
  await db.end();
  process.exitCode = 1;
});