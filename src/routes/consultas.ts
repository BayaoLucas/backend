
import { Router } from 'express';
import { buscarProdutos } from '../services/catalogo';
import {
  historicoCliente,
  resumoDiario,
  vendasPorPeriodo
} from '../services/relatorios';
import { ErroHttp } from '../utils/erros';
import { idParametro } from '../utils/validacao';

export const consultasRouter = Router();

function parametroOpcional(
  valor: unknown,
  nome: string
): string | undefined {
  if (valor === undefined) return undefined;

  if (
    typeof valor !== 'string' ||
    valor.length > 100
  ) {
    throw new ErroHttp(
      400,
      `Parâmetro ${nome} inválido.`
    );
  }

  return valor.trim();
}

function dataValida(
  valor: unknown,
  nome: string
): string {
  if (
    typeof valor !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(valor)
  ) {
    throw new ErroHttp(
      400,
      `Informe ${nome} no formato AAAA-MM-DD.`
    );
  }

  const data = new Date(`${valor}T00:00:00Z`);

  if (
    Number.isNaN(data.getTime()) ||
    data.toISOString().slice(0, 10) !== valor
  ) {
    throw new ErroHttp(
      400,
      `A data ${nome} é inválida.`
    );
  }

  return valor;
}

// CONSULTAR CATÁLOGO

consultasRouter.get('/produtos', async (req, res) => {
  const codigo = parametroOpcional(
    req.query.codigo,
    'codigo'
  );

  const termo = parametroOpcional(
    req.query.termo,
    'termo'
  );

  if (
    req.query.incluir_inativos !== undefined &&
    req.query.incluir_inativos !== 'true' &&
    req.query.incluir_inativos !== 'false'
  ) {
    throw new ErroHttp(
      400,
      'incluir_inativos deve ser true ou false.'
    );
  }

  const incluirInativos =
    req.query.incluir_inativos === 'true';

  const produtos = await buscarProdutos({
    codigo,
    termo,
    incluirInativos
  });

  res.json(produtos);
});

// CONSULTAR VENDAS POR PERÍODO

consultasRouter.get('/vendas', async (req, res) => {
  const inicio = dataValida(
    req.query.inicio,
    'inicio'
  );

  const fim = dataValida(
    req.query.fim,
    'fim'
  );

  if (inicio > fim) {
    throw new ErroHttp(
      400,
      'A data inicial não pode ser posterior à final.'
    );
  }

  const vendas = await vendasPorPeriodo(
    inicio,
    fim
  );

  res.json(vendas);
});

// CONSULTAR HISTÓRICO DO CLIENTE

consultasRouter.get(
  '/clientes/:id/historico',
  async (req, res) => {
    const id = idParametro(req.params.id);

    res.json(await historicoCliente(id));
  }
);

// RESUMO FINANCEIRO DIÁRIO

consultasRouter.get(
  '/resumo-diario',
  async (req, res) => {
    const data = dataValida(
      req.query.data,
      'data'
    );

    res.json(await resumoDiario(data));
  }
);
