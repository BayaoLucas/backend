import { Router, Request, Response } from 'express';
import { ClienteModel } from '../models/ClienteModel';
import { ProdutoModel } from '../models/ProdutoModel';
import { UsuarioModel } from '../models/UsuarioModel';
import { VendaModel } from '../models/VendaModel';
import { ItemVendaModel } from '../models/ItemVendaModel';
import { withTransaction } from '../config/database';

export const router = Router();

function obterId(req: Request): number {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('ID inválido.');
  }

  return id;
}

function erro(res: Response, e: unknown): void {
  const mensagem = e instanceof Error ? e.message : 'Erro interno.';
  const codigo = (e as { code?: string })?.code;

  res.status(codigo === 'ER_DUP_ENTRY' ? 409 : 400).json({
    erro: mensagem
  });
}

/* USUÁRIOS */

router.get('/usuarios', async (_req, res) => {
  try {
    res.json(await UsuarioModel.findAll());
  } catch (e) {
    erro(res, e);
  }
});

router.get('/usuarios/:id', async (req, res) => {
  try {
    const usuario = await UsuarioModel.findById(obterId(req));

    if (!usuario) {
      res.status(404).json({ erro: 'Usuário não encontrado.' });
      return;
    }

    res.json(usuario);
  } catch (e) {
    erro(res, e);
  }
});

router.post('/usuarios', async (req, res) => {
  try {
    const id = await UsuarioModel.create(req.body);
    res.status(201).json(await UsuarioModel.findById(id));
  } catch (e) {
    erro(res, e);
  }
});

router.put('/usuarios/:id', async (req, res) => {
  try {
    const id = obterId(req);
    const atualizado = await UsuarioModel.update(id, req.body);

    if (!atualizado) {
      res.status(404).json({ erro: 'Usuário não encontrado.' });
      return;
    }

    res.json(await UsuarioModel.findById(id));
  } catch (e) {
    erro(res, e);
  }
});

router.patch('/usuarios/:id/inativar', async (req, res) => {
  try {
    const atualizado = await UsuarioModel.inactivate(obterId(req));

    if (!atualizado) {
      res.status(404).json({ erro: 'Usuário não encontrado.' });
      return;
    }

    res.json({ mensagem: 'Usuário inativado.' });
  } catch (e) {
    erro(res, e);
  }
});

/* CLIENTES */

router.get('/clientes', async (_req, res) => {
  try {
    res.json(await ClienteModel.findAll());
  } catch (e) {
    erro(res, e);
  }
});

router.get('/clientes/:id', async (req, res) => {
  try {
    const cliente = await ClienteModel.findById(obterId(req));

    if (!cliente) {
      res.status(404).json({ erro: 'Cliente não encontrado.' });
      return;
    }

    res.json(cliente);
  } catch (e) {
    erro(res, e);
  }
});

router.post('/clientes', async (req, res) => {
  try {
    const id = await ClienteModel.create(req.body);
    res.status(201).json(await ClienteModel.findById(id));
  } catch (e) {
    erro(res, e);
  }
});

router.put('/clientes/:id', async (req, res) => {
  try {
    const id = obterId(req);
    const atualizado = await ClienteModel.update(id, req.body);

    if (!atualizado) {
      res.status(404).json({ erro: 'Cliente não encontrado.' });
      return;
    }

    res.json(await ClienteModel.findById(id));
  } catch (e) {
    erro(res, e);
  }
});

router.patch('/clientes/:id/inativar', async (req, res) => {
  try {
    const atualizado = await ClienteModel.inactivate(obterId(req));

    if (!atualizado) {
      res.status(404).json({ erro: 'Cliente não encontrado.' });
      return;
    }

    res.json({ mensagem: 'Cliente inativado.' });
  } catch (e) {
    erro(res, e);
  }
});

/* PRODUTOS */

router.get('/produtos', async (_req, res) => {
  try {
    res.json(await ProdutoModel.findAll());
  } catch (e) {
    erro(res, e);
  }
});

router.get('/produtos/:id', async (req, res) => {
  try {
    const produto = await ProdutoModel.findById(obterId(req));

    if (!produto) {
      res.status(404).json({ erro: 'Produto não encontrado.' });
      return;
    }

    res.json(produto);
  } catch (e) {
    erro(res, e);
  }
});

router.post('/produtos', async (req, res) => {
  try {
    const id = await ProdutoModel.create(req.body);
    res.status(201).json(await ProdutoModel.findById(id));
  } catch (e) {
    erro(res, e);
  }
});

router.put('/produtos/:id', async (req, res) => {
  try {
    const id = obterId(req);
    const atualizado = await ProdutoModel.update(id, req.body);

    if (!atualizado) {
      res.status(404).json({ erro: 'Produto não encontrado.' });
      return;
    }

    res.json(await ProdutoModel.findById(id));
  } catch (e) {
    erro(res, e);
  }
});

router.patch('/produtos/:id/inativar', async (req, res) => {
  try {
    const atualizado = await ProdutoModel.inactivate(obterId(req));

    if (!atualizado) {
      res.status(404).json({ erro: 'Produto não encontrado.' });
      return;
    }

    res.json({ mensagem: 'Produto inativado.' });
  } catch (e) {
    erro(res, e);
  }
});

/* VENDAS */

router.get('/vendas', async (_req, res) => {
  try {
    res.json(await VendaModel.findAll());
  } catch (e) {
    erro(res, e);
  }
});

router.get('/vendas/:id', async (req, res) => {
  try {
    const venda = await VendaModel.findById(obterId(req));

    if (!venda) {
      res.status(404).json({ erro: 'Venda não encontrada.' });
      return;
    }

    res.json(venda);
  } catch (e) {
    erro(res, e);
  }
});

router.post('/vendas', async (req, res) => {
  try {
    const id = await withTransaction((conexao) =>
      VendaModel.create(req.body, conexao)
    );

    res.status(201).json(await VendaModel.findById(id));
  } catch (e) {
    erro(res, e);
  }
});

/* ITENS DA VENDA */

router.get('/itens-venda', async (_req, res) => {
  try {
    res.json(await ItemVendaModel.findAll());
  } catch (e) {
    erro(res, e);
  }
});

router.get('/itens-venda/:id', async (req, res) => {
  try {
    const item = await ItemVendaModel.findById(obterId(req));

    if (!item) {
      res.status(404).json({ erro: 'Item não encontrado.' });
      return;
    }

    res.json(item);
  } catch (e) {
    erro(res, e);
  }
});

router.get('/vendas/:id/itens', async (req, res) => {
  try {
    res.json(await ItemVendaModel.findByVendaId(obterId(req)));
  } catch (e) {
    erro(res, e);
  }
});

router.post('/itens-venda', async (req, res) => {
  try {
    const id = await withTransaction((conexao) =>
      ItemVendaModel.create(req.body, conexao)
    );

    res.status(201).json(await ItemVendaModel.findById(id));
  } catch (e) {
    erro(res, e);
  }
});