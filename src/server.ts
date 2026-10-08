import express from 'express';
import { db, testarConexao, mensagemConexao } from './config/database';

const app = express();
const porta = Number(process.env.PORT || 3000);

// Apenas uma rota de verificação do servidor nesta sprint.
app.get('/status', (_req, res) => {
  res.json({ projeto: 'MS² Vestuário', sprint: 2, servidor: 'em execução' });
});

async function iniciar(): Promise<void> {
  await testarConexao();
  const servidor = app.listen(porta, () => {
    console.log(`Backend Sprint 2 em http://localhost:${porta}/status`);
  });
  servidor.on('error', async (erro: NodeJS.ErrnoException) => {
    console.error(erro.code === 'EADDRINUSE' ? `A porta ${porta} já está em uso. Pare o outro servidor ou altere PORT no .env.` : erro.message);
    await db.end();
    process.exitCode = 1;
  });
}

iniciar().catch(async erro => {
  console.error(mensagemConexao(erro));
  await db.end();
  process.exitCode = 1;
});
