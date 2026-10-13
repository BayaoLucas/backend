
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { scrypt, timingSafeEqual } from 'node:crypto';

import { UsuarioModel } from '../models/UsuarioModel';
import { Usuario, PerfilUsuario } from '../types';

import {
  ApiError,
  gerarToken,
  revogarToken,
  usuarioAutenticado
} from '../middleware/authMiddleware';

function objeto(valor: unknown): Record<string, unknown> {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    throw new ApiError(400, 'Envie um objeto JSON válido.');
  }
  return valor as Record<string, unknown>;
}

function texto(valor: unknown, campo: string, limite = 120): string {
  if (typeof valor !== 'string' || !valor.trim() ||
      valor.trim().length > limite) {
    throw new ApiError(400, `Campo ${campo} inválido.`);
  }
  return valor.trim();
}

function emailValido(valor: unknown): string {
  const email = texto(valor, 'email', 150).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, 'E-mail inválido.');
  }

  return email;
}

function senhaValida(valor: unknown): string {
  if (typeof valor !== 'string' ||
      valor.length < 8 || valor.length > 128) {
    throw new ApiError(
      400,
      'A senha deve conter entre 8 e 128 caracteres.'
    );
  }

  return valor;
}

function idValido(valor: string | string[] | undefined): number {
  if (typeof valor !== 'string' || !/^[1-9]\d*$/.test(valor)) {
    throw new ApiError(400, 'ID inválido.');
  }

  const id = Number(valor);

  if (!Number.isSafeInteger(id)) {
    throw new ApiError(400, 'ID inválido.');
  }

  return id;
}

function perfilValido(valor: unknown): PerfilUsuario {
  if (valor !== 'CAIXA' && valor !== 'GERENTE') {
    throw new ApiError(400, 'Perfil deve ser CAIXA ou GERENTE.');
  }
  return valor;
}

function publico(usuario: Usuario) {
  const { senha_hash: _senha, ...dados } = usuario;
  return dados;
}

async function verificarScryptAntigo(
  senha: string,
  armazenado: string
): Promise<boolean> {
  const partes = armazenado.split('$');

  if (partes.length !== 6 ||
      partes[0] !== 'scrypt' ||
      partes[1] !== '16384' ||
      partes[2] !== '8' ||
      partes[3] !== '1' ||
      !/^[a-f0-9]{32}$/.test(partes[4]) ||
      !/^[a-f0-9]{128}$/.test(partes[5])) {
    return false;
  }

  const calculado = await new Promise<Buffer>((resolve, reject) => {
    scrypt(senha, partes[4], 64, {
      N: 16384, r: 8, p: 1
    }, (erro, chave) => {
      if (erro) reject(erro);
      else resolve(chave);
    });
  });

  return timingSafeEqual(
    calculado,
    Buffer.from(partes[5], 'hex')
  );
}

export async function conferirSenhaUsuario(
  usuario: Usuario,
  senha: string
): Promise<boolean> {
  let correto = false;

  if (usuario.senha_hash.startsWith('$2')) {
    correto = await bcrypt.compare(senha, usuario.senha_hash);
  } else if (usuario.senha_hash.startsWith('scrypt$')) {
    correto = await verificarScryptAntigo(
      senha,
      usuario.senha_hash
    );

    if (correto) {
      const novoHash = await bcrypt.hash(senha, 12);
      await UsuarioModel.atualizarSenha(usuario.id, novoHash);
    }
  }

  return correto;
}

export class UsuarioController {
  static async primeiroGerente(req: Request, res: Response) {
    const origem = req.socket.remoteAddress;

    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1']
      .includes(origem ?? '')) {
      throw new ApiError(403, 'Cadastro inicial somente local.');
    }

    const dados = objeto(req.body);

    const nome = texto(dados.nome, 'nome');
    const email = emailValido(dados.email);
    const senha = senhaValida(dados.senha);
    const senha_hash = await bcrypt.hash(senha, 12);

    const id = await UsuarioModel.criarPrimeiroGerente({
      nome,
      email,
      senha_hash,
      perfil: 'GERENTE'
    });

    res.status(201).json({
      mensagem: 'Primeiro gerente cadastrado.',
      id
    });
  }

  static async login(req: Request, res: Response) {
    const dados = objeto(req.body);

    const email = emailValido(dados.email);

    if (typeof dados.senha !== 'string') {
      throw new ApiError(400, 'Informe a senha.');
    }

    const usuario = await UsuarioModel.findByEmail(email);

    if (!usuario || Number(usuario.ativo) !== 1 ||
        !(await conferirSenhaUsuario(usuario, dados.senha))) {
      throw new ApiError(401, 'Credenciais inválidas.');
    }

    const token = gerarToken(usuario.id);

    res.status(200).json({
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario: publico(usuario)
    });
  }

  static async logout(req: Request, res: Response) {
    const token = req.headers.authorization?.slice(7);

    if (token) revogarToken(token);

    res.status(200).json({
      mensagem: 'Sessão encerrada.'
    });
  }

  static async meuPerfil(req: Request, res: Response) {
    res.json(publico(usuarioAutenticado(req)));
  }

  static async listar(_req: Request, res: Response) {
    const usuarios = await UsuarioModel.findAll();
    res.json(usuarios.map(publico));
  }

  static async detalhar(req: Request, res: Response) {
    const id = idValido(req.params.id);
    const usuario = await UsuarioModel.findById(id);

    if (!usuario) {
      throw new ApiError(404, 'Usuário não encontrado.');
    }

    res.json(publico(usuario));
  }

  static async cadastrar(req: Request, res: Response) {
    const dados = objeto(req.body);

    const nome = texto(dados.nome, 'nome');
    const email = emailValido(dados.email);
    const senha = senhaValida(dados.senha);
    const perfil = perfilValido(dados.perfil);

    const senha_hash = await bcrypt.hash(senha, 12);

    const id = await UsuarioModel.create({
      nome,
      email,
      senha_hash,
      perfil
    });

    res.status(201).json(publico(
      (await UsuarioModel.findById(id))!
    ));
  }

  static async atualizar(req: Request, res: Response) {
    const id = idValido(req.params.id);
    const atual = await UsuarioModel.findById(id);

    if (!atual) {
      throw new ApiError(404, 'Usuário não encontrado.');
    }

    const dados = objeto(req.body);
    const nome = texto(dados.nome, 'nome');
    const email = emailValido(dados.email);
    const perfil = perfilValido(dados.perfil);

    if (id === usuarioAutenticado(req).id &&
        perfil !== 'GERENTE') {
      throw new ApiError(
        409,
        'Não é possível retirar seu próprio acesso gerencial.'
      );
    }

    const senha_hash = dados.senha === undefined
      ? atual.senha_hash
      : await bcrypt.hash(senhaValida(dados.senha), 12);

    await UsuarioModel.update(id, {
      nome,
      email,
      perfil,
      senha_hash
    });

    res.json(publico(
      (await UsuarioModel.findById(id))!
    ));
  }

  static async inativar(req: Request, res: Response) {
    const id = idValido(req.params.id);

    if (id === usuarioAutenticado(req).id) {
      throw new ApiError(
        409,
        'Não é permitido inativar sua própria conta.'
      );
    }

    if (!(await UsuarioModel.setAtivo(id, false))) {
      throw new ApiError(404, 'Usuário não encontrado.');
    }

    res.json({ mensagem: 'Usuário inativado.' });
  }

  static async reativar(req: Request, res: Response) {
    const id = idValido(req.params.id);

    if (!(await UsuarioModel.setAtivo(id, true))) {
      throw new ApiError(404, 'Usuário não encontrado.');
    }

    res.json({ mensagem: 'Usuário reativado.' });
  }
}
