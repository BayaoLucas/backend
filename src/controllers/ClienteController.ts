
import { Request, Response } from 'express';

import { ClienteModel } from '../models/ClienteModel';
import { VendaModel } from '../models/VendaModel';
import { ItemVendaModel } from '../models/ItemVendaModel';

import { ApiError } from '../middleware/authMiddleware';

import { NovoCliente } from '../types';

function validarId(
  valor: string | string[] | undefined
): number {
  if (
    typeof valor !== 'string' ||
    !/^[1-9]\d*$/.test(valor)
  ) {
    throw new ApiError(400, 'ID inválido.');
  }

  const id = Number(valor);

  if (!Number.isSafeInteger(id)) {
    throw new ApiError(400, 'ID inválido.');
  }

  return id;
}

function validarCpf(valor: unknown): string {
  if (
    typeof valor !== 'string' ||
    !/^[\d.\-\s]+$/.test(valor)
  ) {
    throw new ApiError(400, 'CPF inválido.');
  }

  const cpf = valor.replace(/\D/g, '');

  if (
    cpf.length !== 11 ||
    /^(\d)\1{10}$/.test(cpf)
  ) {
    throw new ApiError(400, 'CPF inválido.');
  }

  function calcularDigito(tamanho: number): number {
    let soma = 0;

    for (let i = 0; i < tamanho; i++) {
      soma += Number(cpf[i]) * (tamanho + 1 - i);
    }

    const resultado = (soma * 10) % 11;

    return resultado === 10 ? 0 : resultado;
  }

  if (
    calcularDigito(9) !== Number(cpf[9]) ||
    calcularDigito(10) !== Number(cpf[10])
  ) {
    throw new ApiError(400, 'CPF inválido.');
  }

  return cpf;
}

function validarDados(valor: unknown): NovoCliente {
  if (
    !valor ||
    typeof valor !== 'object' ||
    Array.isArray(valor)
  ) {
    throw new ApiError(
      400,
      'Envie um objeto JSON válido.'
    );
  }

  const dados = valor as Record<string, unknown>;

  if (
    typeof dados.nome !== 'string' ||
    !dados.nome.trim() ||
    dados.nome.trim().length > 120
  ) {
    throw new ApiError(400, 'Nome inválido.');
  }

  const cpf = validarCpf(dados.cpf);

  let telefone: string | null = null;
  let email: string | null = null;

  if (
    dados.telefone !== undefined &&
    dados.telefone !== null &&
    dados.telefone !== ''
  ) {
    if (
      typeof dados.telefone !== 'string' ||
      dados.telefone.length > 20
    ) {
      throw new ApiError(400, 'Telefone inválido.');
    }

    telefone = dados.telefone.trim() || null;
  }

  if (
    dados.email !== undefined &&
    dados.email !== null &&
    dados.email !== ''
  ) {
    if (
      typeof dados.email !== 'string' ||
      dados.email.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)
    ) {
      throw new ApiError(400, 'E-mail inválido.');
    }

    email = dados.email.toLowerCase().trim();
  }

  return {
    nome: dados.nome.trim(),
    cpf,
    telefone,
    email
  };
}

export class ClienteController {

  static async listar(
    _req: Request,
    res: Response
  ): Promise<void> {
    const clientes = await ClienteModel.findAll();

    res.status(200).json(clientes);
  }

  static async detalhar(
    req: Request,
    res: Response
  ): Promise<void> {
    const id = validarId(req.params.id);

    const cliente = await ClienteModel.findById(id);

    if (!cliente) {
      throw new ApiError(
        404,
        'Cliente não encontrado.'
      );
    }

    res.status(200).json(cliente);
  }

  static async cadastrar(
    req: Request,
    res: Response
  ): Promise<void> {
    const dados = validarDados(req.body);

    const id = await ClienteModel.create(dados);

    const cliente = await ClienteModel.findById(id);

    res.status(201).json(cliente);
  }

  static async atualizar(
    req: Request,
    res: Response
  ): Promise<void> {
    const id = validarId(req.params.id);
    const dados = validarDados(req.body);

    const clienteAtual = await ClienteModel.findById(id);

    if (!clienteAtual) {
      throw new ApiError(
        404,
        'Cliente não encontrado.'
      );
    }

    await ClienteModel.update(id, dados);

    const clienteAtualizado =
      await ClienteModel.findById(id);

    res.status(200).json(clienteAtualizado);
  }

  static async inativar(
    req: Request,
    res: Response
  ): Promise<void> {
    const id = validarId(req.params.id);

    const alterado = await ClienteModel.setAtivo(
      id,
      false
    );

    if (!alterado) {
      throw new ApiError(
        404,
        'Cliente não encontrado.'
      );
    }

    res.status(200).json({
      mensagem: 'Cliente inativado com sucesso.'
    });
  }

  static async reativar(
    req: Request,
    res: Response
  ): Promise<void> {
    const id = validarId(req.params.id);

    const alterado = await ClienteModel.setAtivo(
      id,
      true
    );

    if (!alterado) {
      throw new ApiError(
        404,
        'Cliente não encontrado.'
      );
    }

    res.status(200).json({
      mensagem: 'Cliente reativado com sucesso.'
    });
  }

  static async historico(
    req: Request,
    res: Response
  ): Promise<void> {
    const id = validarId(req.params.id);

    const cliente = await ClienteModel.findById(id);

    if (!cliente) {
      throw new ApiError(
        404,
        'Cliente não encontrado.'
      );
    }

    const vendas = await VendaModel.findByClienteId(id);

    const historico = await Promise.all(
      vendas.map(async (venda) => {
        const itens = await ItemVendaModel.findByVendaId(
          venda.id
        );

        return {
          ...venda,
          itens
        };
      })
    );

    res.status(200).json({
      cliente,
      vendas: historico
    });
  }
}
