
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';

import {
  db,
  mensagemConexao
} from '../config/database';

import { UsuarioModel } from '../models/UsuarioModel';
import { gerarHashSenha } from '../utils/senha';
import { email, texto } from '../utils/validacao';

async function configurar(): Promise<void> {
  let ocultar = false;

  const saida = new Writable({
    write(parte, _codificacao, terminar) {
      if (!ocultar) {
        process.stdout.write(parte);
      }

      terminar();
    }
  });

  const consoleInterativo = createInterface({
    input: process.stdin,
    output: saida,
    terminal: true
  });

  try {
    console.log(
      'CONFIGURAR GERENTE LOCAL (nenhum endpoint público é criado)'
    );

    const nome = texto(
      {
        nome: await consoleInterativo.question('Nome: ')
      },
      'nome'
    );

    const endereco = email({
      email: await consoleInterativo.question('E-mail: ')
    });

    process.stdout.write(
      'Senha (mínimo 8 caracteres): '
    );

    ocultar = true;
    const senha = await consoleInterativo.question('');
    ocultar = false;

    console.log();

    const hash = await gerarHashSenha(senha);
    const existente =
      await UsuarioModel.findByEmail(endereco);

    if (existente) {
      if (existente.perfil !== 'GERENTE') {
        throw new Error(
          'E-mail já associado a um CAIXA. Use outro e-mail de gerente.'
        );
      }

      await db.execute(
        `UPDATE usuarios
         SET nome = ?, senha_hash = ?, ativo = TRUE
         WHERE id = ?`,
        [nome, hash, existente.id]
      );

      console.log(
        'Senha do gerente existente redefinida com sucesso.'
      );
    } else {
      const id = await UsuarioModel.create({
        nome,
        email: endereco,
        perfil: 'GERENTE',
        senha_hash: hash
      });

      console.log(
        `Gerente criado com ID ${id}.`
      );
    }
  } finally {
    ocultar = false;
    consoleInterativo.close();
    await db.end();
  }
}

configurar().catch(erro => {
  console.error(
    erro instanceof Error &&
    erro.name === 'ErroHttp'
      ? erro.message
      : mensagemConexao(erro)
  );

  process.exitCode = 1;
});
