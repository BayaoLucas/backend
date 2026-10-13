
import { Request, Response } from 'express';
import { ItemVendaModel } from '../models/ItemVendaModel';
import { VendaModel } from '../models/VendaModel';
import { ApiError } from '../middleware/authMiddleware';

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

export class ItemVendaController {
  static async listar(_req: Request, res: Response) {
    res.json(await ItemVendaModel.findAll());
  }

  static async detalhar(req: Request, res: Response) {
    const id = idValido(req.params.id);
    const item = await ItemVendaModel.findById(id);

    if (!item) {
      throw new ApiError(404, 'Item não encontrado.');
    }

    res.json(item);
  }

  static async porVenda(req: Request, res: Response) {
    const id = idValido(req.params.id);
    const venda = await VendaModel.findById(id);

    if (!venda) {
      throw new ApiError(404, 'Venda não encontrada.');
    }

    res.json(await ItemVendaModel.findByVendaId(id));
  }
}
