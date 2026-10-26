
import { Router } from 'express';
import { VendaController } from '../controllers/VendaController';
import { ItemVendaController } from '../controllers/ItemVendaController';

import axios from 'axios';
import {
  autenticar,
  somenteGerente
} from '../middleware/authMiddleware';

export const vendaRoutes = Router();

vendaRoutes.use(autenticar);

// Exemplo de como obter o token do cabeçalho da requisição
vendaRoutes.get('/vendas', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extrai o token do cabeçalho Authorization

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  axios
    .get('/vendas', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then((response: { data: any; }) => {
      res.json(response.data);
    })
    .catch(error => {
      res.status(500).json({ error: error.message });
    });
});

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
