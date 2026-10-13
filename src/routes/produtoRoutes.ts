
import { Router } from 'express';
import { ProdutoController } from '../controllers/ProdutoController';

import {
  autenticar,
  somenteGerente
} from '../middleware/authMiddleware';

export const produtoRoutes = Router();

produtoRoutes.use(autenticar);

produtoRoutes.get(
  '/',
  ProdutoController.listar
);

produtoRoutes.get(
  '/:id',
  ProdutoController.detalhar
);

produtoRoutes.post(
  '/',
  somenteGerente,
  ProdutoController.cadastrar
);

produtoRoutes.put(
  '/:id',
  somenteGerente,
  ProdutoController.atualizar
);

produtoRoutes.patch(
  '/:id/inativar',
  somenteGerente,
  ProdutoController.inativar
);

produtoRoutes.patch(
  '/:id/reativar',
  somenteGerente,
  ProdutoController.reativar
);
