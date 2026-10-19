
import { Router } from 'express';

import { usuarioRoutes } from './usuarioRoutes';
import { clienteRoutes } from './clienteRoutes';
import { produtoRoutes } from './produtoRoutes';
import { vendaRoutes } from './vendaRoutes';
import { itemVendaRoutes } from './itemVendaRoutes';

export const router = Router();

router.use('/usuarios', usuarioRoutes);
router.use('/clientes', clienteRoutes);
router.use('/produtos', produtoRoutes);
router.use('/vendas', vendaRoutes);
router.use('/itens-venda', itemVendaRoutes);

