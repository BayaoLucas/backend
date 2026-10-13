
import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';

import {
  autenticar,
  somenteGerente
} from '../middleware/authMiddleware';

export const usuarioRoutes = Router();

usuarioRoutes.post(
  '/primeiro-gerente',
  UsuarioController.primeiroGerente
);

usuarioRoutes.post(
  '/login',
  UsuarioController.login
);

usuarioRoutes.use(autenticar);

usuarioRoutes.get(
  '/me',
  UsuarioController.meuPerfil
);

usuarioRoutes.post(
  '/logout',
  UsuarioController.logout
);

usuarioRoutes.use(somenteGerente);

usuarioRoutes.get(
  '/',
  UsuarioController.listar
);

usuarioRoutes.get(
  '/:id',
  UsuarioController.detalhar
);

usuarioRoutes.post(
  '/',
  UsuarioController.cadastrar
);

usuarioRoutes.put(
  '/:id',
  UsuarioController.atualizar
);

usuarioRoutes.patch(
  '/:id/inativar',
  UsuarioController.inativar
);

usuarioRoutes.patch(
  '/:id/reativar',
  UsuarioController.reativar
);
