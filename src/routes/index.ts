
import { Router } from 'express';
import { ClienteModel } from '../models/ClienteModel';
import { ProdutoModel } from '../models/ProdutoModel';
import { UsuarioModel } from '../models/UsuarioModel';
import { VendaModel } from '../models/VendaModel';
import { ItemVendaModel } from '../models/ItemVendaModel';
import { encerrarSessao, iniciarSessao } from '../services/sessao';
import { cancelarVenda, finalizarVenda } from '../services/vendas';
import {
  exigirGerente,
  exigirLogin,
  tokenAtual,
  usuarioAtual,
  usuarioPublico
} from '../middleware/autenticacao';
import { ErroHttp } from '../utils/erros';
import { gerarHashSenha, verificarSenha } from '../utils/senha';
import {
  apenasCampos,
  dadosCliente,
  dadosProduto,
  dadosUsuario,
  email,
  idParametro,
  objeto,
  texto
} from '../utils/validacao';

export const router = Router();

// AUTENTICAÇÃO

router.post('/auth/login', async (req, res) => {
  const d = objeto(req.body);
  apenasCampos(d, ['email', 'senha']);

  const endereco = email(d);

  if (typeof d.senha !== 'string') {
    throw new ErroHttp(400, 'Informe a senha.');
  }

  const usuario = await UsuarioModel.findByEmail(endereco);

  if (
    !usuario ||
    Number(usuario.ativo) !== 1 ||
    !(await verificarSenha(d.senha, usuario.senha_hash))
  ) {
    throw new ErroHttp(401, 'E-mail ou senha incorretos.');
  }

  const sessao = iniciarSessao(usuario.id);

  res.json({
    ...sessao,
    usuario: usuarioPublico(usuario)
  });
});

router.use(exigirLogin);

router.get('/auth/me', (req, res) => {
  res.json(usuarioPublico(usuarioAtual(req)));
});

router.post('/auth/logout', (req, res) => {
  encerrarSessao(tokenAtual(req));
  res.json({ mensagem: 'Sessão encerrada.' });
});

// USUÁRIOS

router.get('/usuarios', exigirGerente, async (_req, res) => {
  const usuarios = await UsuarioModel.findAll();
  res.json(usuarios.map(usuarioPublico));
});

router.get('/usuarios/:id', exigirGerente, async (req, res) => {
  const usuario = await UsuarioModel.findById(
    idParametro(req.params.id)
  );

  if (!usuario) {
    throw new ErroHttp(404, 'Usuário não encontrado.');
  }

  res.json(usuarioPublico(usuario));
});

router.post('/usuarios', exigirGerente, async (req, res) => {
  const entrada = dadosUsuario(req.body);

  if (!entrada.senha) {
    throw new ErroHttp(400, 'Informe uma senha para o usuário.');
  }

  const senha_hash = await gerarHashSenha(entrada.senha);

  const id = await UsuarioModel.create({
    nome: entrada.nome,
    email: entrada.email,
    perfil: entrada.perfil,
    senha_hash
  });

  const criado = await UsuarioModel.findById(id);

  res.status(201).json(
    criado ? usuarioPublico(criado) : { id }
  );
});

router.put('/usuarios/:id', exigirGerente, async (req, res) => {
  const id = idParametro(req.params.id);
  const atual = await UsuarioModel.findById(id);

  if (!atual) {
    throw new ErroHttp(404, 'Usuário não encontrado.');
  }

  const entrada = dadosUsuario(req.body);

  const senha_hash = entrada.senha === undefined
    ? atual.senha_hash
    : await gerarHashSenha(entrada.senha);

  await UsuarioModel.update(id, {
    nome: entrada.nome,
    email: entrada.email,
    perfil: entrada.perfil,
    senha_hash
  });

  const atualizado = await UsuarioModel.findById(id);

  res.json(
    atualizado ? usuarioPublico(atualizado) : { id }
  );
});

router.patch('/usuarios/:id/inativar', exigirGerente, async (req, res) => {
  const id = idParametro(req.params.id);

  if (id === usuarioAtual(req).id) {
    throw new ErroHttp(
      409,
      'Não é permitido inativar sua própria conta.'
    );
  }

  const alterado = await UsuarioModel.inactivate(id);

  if (!alterado) {
    throw new ErroHttp(404, 'Usuário não encontrado.');
  }

  res.json({ mensagem: 'Usuário inativado.' });
});

// CLIENTES

router.get('/clientes', async (_req, res) => {
  res.json(await ClienteModel.findAll());
});

router.get('/clientes/:id', async (req, res) => {
  const cliente = await ClienteModel.findById(
    idParametro(req.params.id)
  );

  if (!cliente) {
    throw new ErroHttp(404, 'Cliente não encontrado.');
  }

  res.json(cliente);
});

router.get('/clientes/:id/vendas', async (req, res) => {
  const id = idParametro(req.params.id);

  if (!(await ClienteModel.findById(id))) {
    throw new ErroHttp(404, 'Cliente não encontrado.');
  }

  res.json(await VendaModel.findByClienteId(id));
});

router.post('/clientes', async (req, res) => {
  const id = await ClienteModel.create(
    dadosCliente(req.body)
  );

  res.status(201).json(
    await ClienteModel.findById(id)
  );
});

router.put('/clientes/:id', async (req, res) => {
  const id = idParametro(req.params.id);

  const alterado = await ClienteModel.update(
    id,
    dadosCliente(req.body)
  );

  if (!alterado) {
    throw new ErroHttp(404, 'Cliente não encontrado.');
  }

  res.json(await ClienteModel.findById(id));
});

router.patch('/clientes/:id/inativar', exigirGerente, async (req, res) => {
  const alterado = await ClienteModel.inactivate(
    idParametro(req.params.id)
  );

  if (!alterado) {
    throw new ErroHttp(404, 'Cliente não encontrado.');
  }

  res.json({ mensagem: 'Cliente inativado.' });
});

// PRODUTOS

router.get('/produtos', async (_req, res) => {
  res.json(await ProdutoModel.findAll());
});

router.get('/produtos/:id', async (req, res) => {
  const produto = await ProdutoModel.findById(
    idParametro(req.params.id)
  );

  if (!produto) {
    throw new ErroHttp(404, 'Produto não encontrado.');
  }

  res.json(produto);
});

router.post('/produtos', exigirGerente, async (req, res) => {
  const id = await ProdutoModel.create(
    dadosProduto(req.body)
  );

  res.status(201).json(
    await ProdutoModel.findById(id)
  );
});

router.put('/produtos/:id', exigirGerente, async (req, res) => {
  const id = idParametro(req.params.id);

  const alterado = await ProdutoModel.update(
    id,
    dadosProduto(req.body, true)
  );

  if (!alterado) {
    throw new ErroHttp(404, 'Produto não encontrado.');
  }

  res.json(await ProdutoModel.findById(id));
});

router.patch('/produtos/:id/inativar', exigirGerente, async (req, res) => {
  const alterado = await ProdutoModel.inactivate(
    idParametro(req.params.id)
  );

  if (!alterado) {
    throw new ErroHttp(404, 'Produto não encontrado.');
  }

  res.json({ mensagem: 'Produto inativado.' });
});

// VENDAS

router.get('/vendas', async (_req, res) => {
  res.json(await VendaModel.findAll());
});

router.get('/vendas/:id', async (req, res) => {
  const venda = await VendaModel.findById(
    idParametro(req.params.id)
  );

  if (!venda) {
    throw new ErroHttp(404, 'Venda não encontrada.');
  }

  res.json(venda);
});

router.get('/vendas/:id/itens', async (req, res) => {
  const id = idParametro(req.params.id);

  if (!(await VendaModel.findById(id))) {
    throw new ErroHttp(404, 'Venda não encontrada.');
  }

  res.json(await ItemVendaModel.findByVendaId(id));
});

router.post('/vendas', async (req, res) => {
  const operador = usuarioAtual(req);

  const id = await finalizarVenda(req.body, {
    id: operador.id,
    perfil: operador.perfil
  });

  res.status(201).json({
    venda: await VendaModel.findById(id),
    itens: await ItemVendaModel.findByVendaId(id)
  });
});

router.patch('/vendas/:id/cancelar', exigirGerente, async (req, res) => {
  const id = idParametro(req.params.id);
  const d = objeto(req.body);

  apenasCampos(d, ['motivo']);

  const motivo = texto(d, 'motivo', 255);

  await cancelarVenda(
    id,
    usuarioAtual(req).id,
    motivo
  );

  res.json({
    mensagem: 'Venda cancelada. Estoque restaurado.',
    venda: await VendaModel.findById(id)
  });
});

// ITENS DE VENDA

router.get('/itens-venda', async (_req, res) => {
  res.json(await ItemVendaModel.findAll());
});

router.get('/itens-venda/:id', async (req, res) => {
  const item = await ItemVendaModel.findById(
    idParametro(req.params.id)
  );

  if (!item) {
    throw new ErroHttp(404, 'Item não encontrado.');
  }

  res.json(item);
});

router.post('/itens-venda', (_req, _res) => {
  throw new ErroHttp(
    405,
    'Envie itens junto com POST /api/vendas.'
  );
});
