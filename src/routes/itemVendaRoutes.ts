
import { Router } from 'express';
import { ItemVendaController } from '../controllers/ItemVendaController';
import { autenticar } from '../middleware/authMiddleware';

export const itemVendaRoutes = Router();

itemVendaRoutes.use(autenticar);

itemVendaRoutes.get(
  '/',
  ItemVendaController.listar
);

itemVendaRoutes.get(
  '/:id',
  ItemVendaController.detalhar
);
