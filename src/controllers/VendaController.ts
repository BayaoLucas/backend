
import { Request, Response } from 'express';
import { PoolConnection } from 'mysql2/promise';

import { withTransaction } from '../config/database';
import { ClienteModel } from '../models/ClienteModel';
import { ProdutoModel } from '../models/ProdutoModel';
import { UsuarioModel } from '../models/UsuarioModel';
import { VendaModel } from '../models/VendaModel';
import { ItemVendaModel } from '../models/ItemVendaModel';

import { conferirSenhaUsuario } from './UsuarioController';
import { ApiError, usuarioAutenticado } from '../middleware/authMiddleware';

import { FormaPagamento } from '../types';

interface ItemPedido {
  produtoId: number;
  quantidade: number;
  precoEsperado: string;
}

interface Pedido {
  clienteId: number | null;
  pagamento: FormaPagamento;
  descontoBps: number;
  itens: ItemPedido[];
  confirmarTotalZero: boolean;
  autorizacao?: {
    email: string;
    senha: string;
  };
}

interface ItemCalculado {
  produtoId: number;
  codigo: string;
  nome: string;
  quantidade: number;
  preco: string;
  total: string;
}

function objeto(valor: unknown): Record<string, unknown> {
  if (!valor || typeof valor !== 'object' ||
      Array.isArray(valor)) {
    throw new ApiError(400, 'Envie um JSON válido.');
  }
  return valor as Record<string, unknown>;
}

function positivo(valor: unknown, campo: string): number {
  if (typeof valor !== 'number' ||
      !Number.isSafeInteger(valor) ||
      valor <= 0 || valor > 2147483647) {
    throw new ApiError(400, `${campo} inválido.`);
  }
  return valor;
}

function validarId(valor: string | string[] | undefined): number {
  if (typeof valor !== 'string' || !/^[1-9]\d*$/.test(valor)) {
    throw new ApiError(400, 'ID inválido.');
  }
  return positivo(Number(valor), 'ID');
}

function centavos(valor: unknown): bigint {
  if (typeof valor !== 'string' &&
      typeof valor !== 'number') {
    throw new ApiError(400, 'Valor monetário inválido.');
  }

  const texto = String(valor);

  if (!/^(0|[1-9]\d{0,11})(\.\d{1,2})?$/.test(texto)) {
    throw new ApiError(400, 'Valor monetário inválido.');
  }

  const [inteiro, decimal = ''] = texto.split('.');

  return BigInt(inteiro) * 100n +
    BigInt(decimal.padEnd(2, '0'));
}

function moeda(valor: bigint): string {
  if (valor < 0n) {
    throw new ApiError(400, 'Valor negativo inválido.');
  }

  return `${valor / 100n}.${String(valor % 100n).padStart(2, '0')}`;
}

function validarDesconto(valor: unknown): number {
  const texto = valor === undefined ? '0' : String(valor);

  if (
    (typeof valor !== 'string' &&
     typeof valor !== 'number' &&
     valor !== undefined) ||
    !/^(0|[1-9]\d{0,2})(\.\d{1,2})?$/.test(texto)
  ) {
    throw new ApiError(400, 'Desconto inválido.');
  }

  const [inteiro, decimal = ''] = texto.split('.');

  const bps = Number(inteiro) * 100 +
    Number(decimal.padEnd(2, '0'));

  if (bps > 10000) {
    throw new ApiError(400, 'Desconto deve ser de 0% a 100%.');
  }

  return bps;
}

function validarData(valor: unknown): string {
  if (typeof valor !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new ApiError(400, 'Data deve usar AAAA-MM-DD.');
  }

  const data = new Date(`${valor}T00:00:00.000Z`);

  if (Number.isNaN(data.getTime()) ||
      data.toISOString().slice(0, 10) !== valor) {
    throw new ApiError(400, 'Data inválida.');
  }

  return valor;
}

function prepararPedido(valor: unknown): Pedido {
  const d = objeto(valor);

  const permitidos = [
    'cliente_id',
    'forma_pagamento',
    'desconto_percentual',
    'itens',
    'confirmar_total_zero',
    'autorizacao_gerente'
  ];

  if (Object.keys(d).some(campo => !permitidos.includes(campo))) {
    throw new ApiError(400, 'O pedido contém campos não permitidos.');
  }

  const pagamentos: FormaPagamento[] = [
    'DINHEIRO', 'PIX', 'DEBITO', 'CREDITO'
  ];

  if (!pagamentos.includes(d.forma_pagamento as FormaPagamento)) {
    throw new ApiError(400, 'Forma de pagamento inválida.');
  }

  const clienteId = d.cliente_id == null
    ? null
    : positivo(d.cliente_id, 'cliente_id');

  if (!Array.isArray(d.itens) ||
      d.itens.length < 1 || d.itens.length > 100) {
    throw new ApiError(400, 'Informe de 1 a 100 itens.');
  }

  const agrupados = new Map<number, ItemPedido>();

  for (const entrada of d.itens) {
    const item = objeto(entrada);

    const produtoId = positivo(item.produto_id, 'produto_id');
    const quantidade = positivo(item.quantidade, 'quantidade');
    const precoEsperado = moeda(centavos(item.preco_esperado));

    const anterior = agrupados.get(produtoId);

    if (anterior) {
      if (anterior.precoEsperado !== precoEsperado) {
        throw new ApiError(
          400,
          'Produto repetido com preços esperados diferentes.'
        );
      }

      anterior.quantidade = positivo(
        anterior.quantidade + quantidade,
        'quantidade'
      );
    } else {
      agrupados.set(produtoId, {
        produtoId,
        quantidade,
        precoEsperado
      });
    }
  }

  const descontoBps = validarDesconto(d.desconto_percentual);

  if (descontoBps === 10000 && d.confirmar_total_zero !== true) {
    throw new ApiError(
      400,
      'Confirme explicitamente a venda com total zero.'
    );
  }

  let autorizacao: Pedido['autorizacao'];

  if (d.autorizacao_gerente !== undefined) {
    const a = objeto(d.autorizacao_gerente);

    if (typeof a.email !== 'string' ||
        typeof a.senha !== 'string') {
      throw new ApiError(400, 'Autorização gerencial inválida.');
    }

    autorizacao = {
      email: a.email.trim().toLowerCase(),
      senha: a.senha
    };
  }

  return {
    clienteId,
    pagamento: d.forma_pagamento as FormaPagamento,
    descontoBps,
    itens: [...agrupados.values()]
      .sort((a, b) => a.produtoId - b.produtoId),
    confirmarTotalZero: d.confirmar_total_zero === true,
    autorizacao
  };
}

async function calcular(
  pedido: Pedido,
  conexao?: PoolConnection
) {
  let subtotal = 0n;
  const itens: ItemCalculado[] = [];

  for (const item of pedido.itens) {
    const produto = conexao
      ? await ProdutoModel.findByIdParaVenda(
          item.produtoId, conexao
        )
      : await ProdutoModel.findById(item.produtoId);

    if (!produto || Number(produto.ativo) !== 1) {
      throw new ApiError(
        400,
        `Produto ${item.produtoId} inexistente ou inativo.`
      );
    }

    if (produto.estoque < item.quantidade) {
      throw new ApiError(
        409,
        `Estoque insuficiente para ${produto.nome}.`
      );
    }

    const preco = centavos(produto.preco);

    if (preco !== centavos(item.precoEsperado)) {
      throw new ApiError(
        409,
        `O preço de ${produto.nome} mudou. Consulte o novo preço e confirme novamente.`
      );
    }

    const totalItem = preco * BigInt(item.quantidade);

    if (totalItem > 999999999999n) {
      throw new ApiError(400, 'Valor do item acima do limite.');
    }

    subtotal += totalItem;

    if (subtotal > 99999999999999n) {
      throw new ApiError(400, 'Subtotal acima do limite.');
    }

    itens.push({
      produtoId: produto.id,
      codigo: produto.codigo,
      nome: produto.nome,
      quantidade: item.quantidade,
      preco: moeda(preco),
      total: moeda(totalItem)
    });
  }

  const desconto = (
    subtotal * BigInt(pedido.descontoBps) + 5000n
  ) / 10000n;

  const total = subtotal - desconto;

  return {
    itens,
    subtotal: moeda(subtotal),
    descontoValor: moeda(desconto),
    descontoPercentual: (
      pedido.descontoBps / 100
    ).toFixed(2),
    total: moeda(total)
  };
}

async function verificarAutorizacao(
  req: Request,
  pedido: Pedido
): Promise<number | null> {
  if (pedido.descontoBps <= 1000) {
    return null;
  }

  const operador = usuarioAutenticado(req);

  if (operador.perfil === 'GERENTE') {
    return operador.id;
  }

  if (!pedido.autorizacao) {
    throw new ApiError(
      403,
      'Desconto acima de 10% exige autorização gerencial.'
    );
  }

  const gerente = await UsuarioModel.findByEmail(
    pedido.autorizacao.email
  );

  if (!gerente ||
      gerente.perfil !== 'GERENTE' ||
      Number(gerente.ativo) !== 1 ||
      !(await conferirSenhaUsuario(
        gerente,
        pedido.autorizacao.senha
      ))) {
    throw new ApiError(403, 'Autorização gerencial inválida.');
  }

  return gerente.id;
}

export class VendaController {
  static async simular(req: Request, res: Response) {
    const pedido = prepararPedido(req.body);

    const valores = await calcular(pedido);

    res.json({
      ...valores,
      necessita_autorizacao:
        pedido.descontoBps > 1000 &&
        usuarioAutenticado(req).perfil !== 'GERENTE'
    });
  }

  static async finalizar(req: Request, res: Response) {
    const pedido = prepararPedido(req.body);
    const operador = usuarioAutenticado(req);

    const autorizadorId = await verificarAutorizacao(
      req,
      pedido
    );

    const vendaId = await withTransaction(async conexao => {
      if (pedido.clienteId !== null) {
        const cliente = await ClienteModel.findById(
          pedido.clienteId,
          conexao
        );

        if (!cliente || Number(cliente.ativo) !== 1) {
          throw new ApiError(
            400,
            'Cliente inexistente ou inativo.'
          );
        }
      }

      const calculo = await calcular(pedido, conexao);

      const id = await VendaModel.create({
        cliente_id: pedido.clienteId,
        usuario_id: operador.id,
        autorizador_desconto_id: autorizadorId,
        subtotal: calculo.subtotal,
        desconto_percentual: calculo.descontoPercentual,
        forma_pagamento: pedido.pagamento
      }, conexao);

      for (const item of calculo.itens) {
        await ItemVendaModel.create({
          venda_id: id,
          produto_id: item.produtoId,
          codigo_produto: item.codigo,
          nome_produto: item.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco
        }, conexao);

        const baixou = await ProdutoModel.baixarEstoque(
          item.produtoId,
          item.quantidade,
          conexao
        );

        if (!baixou) {
          throw new ApiError(
            409,
            'Estoque insuficiente durante a finalização.'
          );
        }
      }

      return id;
    });

    res.status(201).json({
      mensagem: 'Venda concluída.',
      venda: await VendaModel.findById(vendaId),
      itens: await ItemVendaModel.findByVendaId(vendaId)
    });
  }

  static async listar(req: Request, res: Response) {
    const inicio = req.query.inicio === undefined
      ? undefined : validarData(req.query.inicio);

    const fim = req.query.fim === undefined
      ? undefined : validarData(req.query.fim);

    if (inicio && fim && inicio > fim) {
      throw new ApiError(400, 'Período inválido.');
    }

    const status = req.query.status;

    if (status !== undefined &&
        status !== 'CONCLUIDA' &&
        status !== 'CANCELADA') {
      throw new ApiError(400, 'Status inválido.');
    }

    res.json(await VendaModel.findAll({
      inicio,
      fim,
      status: status as 'CONCLUIDA' | 'CANCELADA' | undefined
    }));
  }

  static async detalhar(req: Request, res: Response) {
    const id = validarId(req.params.id);
    const venda = await VendaModel.findById(id);

    if (!venda) {
      throw new ApiError(404, 'Venda não encontrada.');
    }

    const itens = await ItemVendaModel.findByVendaId(id);

    res.json({ venda, itens });
  }

  static async cancelar(req: Request, res: Response) {
    const id = validarId(req.params.id);
    const dados = objeto(req.body) as { motivo: string };
const motivo = dados.motivo;

if (
  typeof motivo !== 'string' ||
  !motivo.trim() ||
  motivo.trim().length > 255
) {
  throw new ApiError(
    400,
    'Informe o motivo do cancelamento.'
  );
}

const motivoValidado = motivo.trim();

    const gerente = usuarioAutenticado(req);

    await withTransaction(async conexao => {
      const venda = await VendaModel.findByIdParaCancelamento(
        id,
        conexao
      );

      if (!venda) {
        throw new ApiError(404, 'Venda não encontrada.');
      }

      if (venda.status !== 'CONCLUIDA') {
        throw new ApiError(409, 'Venda já cancelada.');
      }

      const itens = await ItemVendaModel.findByVendaId(
        id,
        conexao
      );

      if (itens.length === 0) {
        throw new ApiError(
          409,
          'Venda sem itens. Verifique os registros.'
        );
      }

      const cancelou = await VendaModel.cancelar(
        id,
        gerente.id,
        dados.motivo.trim(),
        conexao
      );

      if (!cancelou) {
        throw new ApiError(409, 'Venda não pôde ser cancelada.');
      }

      for (const item of itens.sort(
        (a, b) => a.produto_id - b.produto_id
      )) {
        await ProdutoModel.devolverEstoque(
          item.produto_id,
          item.quantidade,
          conexao
        );
      }
    });

    res.json({
      mensagem: 'Venda cancelada e estoque restaurado.',
      venda: await VendaModel.findById(id)
    });
  }

  static async resumoDiario(req: Request, res: Response) {
    const data = validarData(req.query.data);

    res.json(await VendaModel.resumoDiario(data));
  }
}
