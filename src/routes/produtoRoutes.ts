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
  '/proximo-codigo',
  ProdutoController.proximoCodigo
);

produtoRoutes.get(
  '/catalogo',
  ProdutoController.listarCatalogo
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

produtoRoutes.patch(
  '/:id/ocultar-catalogo',
  somenteGerente,
  ProdutoController.ocultarCatalogo
);

produtoRoutes.patch(
  '/:id/exibir-catalogo',
  somenteGerente,
  ProdutoController.exibirCatalogo
);

produtoRoutes.delete(
  '/:id',
  somenteGerente,
  ProdutoController.excluir
);
