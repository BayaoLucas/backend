
import { Router } from 'express';
import { ClienteController } from '../controllers/ClienteController';

import {
  autenticar,
  somenteGerente
} from '../middleware/authMiddleware';

export const clienteRoutes = Router();

clienteRoutes.use(autenticar);

clienteRoutes.get(
  '/',
  ClienteController.listar
);

clienteRoutes.get(
  '/:id',
  ClienteController.detalhar
);

clienteRoutes.get(
  '/:id/historico',
  ClienteController.historico
);

clienteRoutes.post(
  '/',
  ClienteController.cadastrar
);

clienteRoutes.put(
  '/:id',
  ClienteController.atualizar
);

clienteRoutes.patch(
  '/:id/inativar',
  somenteGerente,
  ClienteController.inativar
);

clienteRoutes.patch(
  '/:id/reativar',
  somenteGerente,
  ClienteController.reativar
);
