import express from 'express';
import cors from 'cors';

import {
  db,
  testarConexao,
  mensagemConexao
} from './config/database';

import { router } from './routes';

const app = express();
const porta = Number(process.env.PORT || 3000);

// Autoriza o frontend
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Permite receber JSON
app.use(express.json());

// ROTA PÚBLICA
// Precisa ficar antes de app.use('/api', router)
app.get('/api/status', (_req, res) => {
  res.status(200).json({
    projeto: 'MS² Vestuário',
    servidor: 'em execução'
  });
});

// Demais rotas da aplicação
app.use('/api', router);

async function iniciar(): Promise<void> {
  await testarConexao();

  const servidor = app.listen(porta, () => {
    console.log(
      `MS² Vestuário em http://localhost:${porta}/api/status`
    );
  });

  servidor.on(
    'error',
    async (erro: NodeJS.ErrnoException) => {
      if (erro.code === 'EADDRINUSE') {
        console.error(
          `A porta ${porta} já está em uso. Pare o outro servidor ou altere PORT no .env.`
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
  console.error(`Falha na inicialização: ${mensagemConexao(erro)}`);
  await db.end();
  process.exitCode = 1;
});