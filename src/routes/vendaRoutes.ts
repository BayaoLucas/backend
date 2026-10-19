
import { Router } from 'express';
import { VendaController } from '../controllers/VendaController';
import { ItemVendaController } from '../controllers/ItemVendaController';

import {
  autenticar,
  somenteGerente
} from '../middleware/AuthMiddleware';

export const vendaRoutes = Router();

vendaRoutes.use(autenticar);

vendaRoutes.post(
  '/simular',
  VendaController.simular
);

vendaRoutes.get(
  '/resumo-diario',
  somenteGerente,
  VendaController.resumoDiario
);

vendaRoutes.get(
  '/',
  VendaController.listar
);

vendaRoutes.post(
  '/',
  VendaController.finalizar
);

vendaRoutes.get(
  '/:id',
  VendaController.detalhar
);

vendaRoutes.get(
  '/:id/itens',
  ItemVendaController.porVenda
);

vendaRoutes.patch(
  '/:id/cancelar',
  somenteGerente,
  VendaController.cancelar
);
