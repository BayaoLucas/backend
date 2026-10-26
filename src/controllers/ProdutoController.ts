import { Request, Response } from 'express';
import { ProdutoModel } from '../models/ProdutoModel';
import { NovoProduto } from '../types';
import { ApiError, usuarioAutenticado } from '../middleware/authMiddleware';

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

function opcional(valor: unknown, limite: number): string | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }

  if (typeof valor !== 'string' || valor.length > limite) {
    throw new ApiError(400, 'Campo opcional inválido.');
  }

  return valor.trim() || null;
}

function validarProduto(valor: unknown): NovoProduto {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    throw new ApiError(400, 'Envie um JSON válido.');
  }

  const d = valor as Record<string, unknown>;

  let codigo = '';
  if (typeof d.codigo === 'string' && d.codigo.trim()) {
    if (d.codigo.trim().length > 50) {
      throw new ApiError(400, 'Código inválido.');
    }
    codigo = d.codigo.trim().toUpperCase();
  }

  if (typeof d.nome !== 'string' ||
      !d.nome.trim() || d.nome.trim().length > 120) {
    throw new ApiError(400, 'Nome inválido.');
  }

  const precoTexto = String(d.preco ?? '');

  if (!/^(0|[1-9]\d{0,7})(\.\d{1,2})?$/.test(precoTexto) ||
      Number(precoTexto) <= 0) {
    throw new ApiError(400, 'Preço inválido.');
  }

  const estoque = d.estoque === undefined ? 0 : d.estoque;

  if (typeof estoque !== 'number' ||
      !Number.isInteger(estoque) ||
      estoque < 0 || estoque > 2147483647) {
    throw new ApiError(400, 'Estoque inválido.');
  }

  // Validação de Gênero: 'MASCULINO', 'FEMININO', 'UNISSEX'
  let genero: string | null = null;
  if (typeof d.genero === 'string' && d.genero.trim()) {
    const gen = d.genero.trim().toUpperCase();
    if (['MASCULINO', 'FEMININO', 'UNISSEX'].includes(gen)) {
      genero = gen;
    } else {
      genero = opcional(d.genero, 20);
    }
  }

  return {
    codigo,
    nome: d.nome.trim(),
    descricao: opcional(d.descricao, 10000),
    tamanho: opcional(d.tamanho, 20),
    cor: opcional(d.cor, 40),
    genero,
    preco: Number(precoTexto).toFixed(2),
    estoque
  };
}

export class ProdutoController {
  static async proximoCodigo(_req: Request, res: Response) {
    const codigoAleatorio = await ProdutoModel.gerarCodigoAleatorioUnico();
    res.json({ codigoAleatorio, proximoCodigo: codigoAleatorio });
  }

  static async listar(req: Request, res: Response) {
    const termo = req.query.termo;
    const codigo = req.query.codigo;
    const genero = req.query.genero;
    const inativos = req.query.incluir_inativos;

    if (termo !== undefined &&
        (typeof termo !== 'string' || termo.length > 100)) {
      throw new ApiError(400, 'Pesquisa inválida.');
    }

    if (codigo !== undefined &&
        (typeof codigo !== 'string' || codigo.length > 50)) {
      throw new ApiError(400, 'Código inválido.');
    }

    if (genero !== undefined &&
        (typeof genero !== 'string' || genero.length > 30)) {
      throw new ApiError(400, 'Gênero inválido.');
    }

    if (inativos !== undefined &&
        inativos !== 'true' && inativos !== 'false') {
      throw new ApiError(400, 'Filtro inválido.');
    }

    const incluirInativos = inativos === 'true';

    if (incluirInativos &&
        usuarioAutenticado(req).perfil !== 'GERENTE') {
      throw new ApiError(403, 'Acesso restrito ao gerente.');
    }

    res.json(await ProdutoModel.findAll({
      termo: typeof termo === 'string' ? termo.trim() : undefined,
      codigo: typeof codigo === 'string'
        ? codigo.trim().toUpperCase()
        : undefined,
      genero: typeof genero === 'string'
        ? genero.trim().toUpperCase()
        : undefined,
      incluirInativos
    }));
  }

  static async detalhar(req: Request, res: Response) {
    const produto = await ProdutoModel.findById(
      idValido(req.params.id)
    );

    if (!produto) {
      throw new ApiError(404, 'Produto não encontrado.');
    }

    res.json(produto);
  }

  static async cadastrar(req: Request, res: Response) {
    const dados = validarProduto(req.body);

    if (!dados.codigo) {
      dados.codigo = await ProdutoModel.gerarCodigoAleatorioUnico();
    }

    const id = await ProdutoModel.create(dados);

    res.status(201).json(
      await ProdutoModel.findById(id)
    );
  }

  static async atualizar(req: Request, res: Response) {
    const id = idValido(req.params.id);
    const dados = validarProduto(req.body);

    // Se o código não for informado na edição, mantém o código original existente
    if (!dados.codigo) {
      const existente = await ProdutoModel.findById(id);
      if (existente) {
        dados.codigo = existente.codigo;
      }
    }

    if (!(await ProdutoModel.update(id, dados))) {
      throw new ApiError(404, 'Produto não encontrado.');
    }

    res.json(await ProdutoModel.findById(id));
  }

  static async inativar(req: Request, res: Response) {
    const id = idValido(req.params.id);

    if (!(await ProdutoModel.setAtivo(id, false))) {
      throw new ApiError(404, 'Produto não encontrado.');
    }

    res.json({ mensagem: 'Produto inativado.' });
  }

  static async reativar(req: Request, res: Response) {
    const id = idValido(req.params.id);

    if (!(await ProdutoModel.setAtivo(id, true))) {
      throw new ApiError(404, 'Produto não encontrado.');
    }

    res.json({ mensagem: 'Produto reativado.' });
  }
}
