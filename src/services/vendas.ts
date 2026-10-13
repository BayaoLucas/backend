
import {
    ResultSetHeader,
    RowDataPacket
  } from 'mysql2';
  
  import { PoolConnection } from 'mysql2/promise';
  
  import { withTransaction } from '../config/database';
  import { ClienteModel } from '../models/ClienteModel';
  import { ItemVendaModel } from '../models/ItemVendaModel';
  import { VendaModel } from '../models/VendaModel';
  import { PerfilUsuario } from '../types';
  import { ErroHttp } from '../utils/erros';
  
  import {
    centavos,
    dadosVenda,
    moeda
  } from '../utils/validacao';
  
  interface LinhaProduto extends RowDataPacket {
    id: number;
    codigo: string;
    nome: string;
    preco: string;
    estoque: number;
    ativo: number;
  }
  
  interface LinhaVenda extends RowDataPacket {
    id: number;
    status: 'CONCLUIDA' | 'CANCELADA';
  }
  
  export async function finalizarVenda(
    entrada: unknown,
    operador: {
      id: number;
      perfil: PerfilUsuario;
    }
  ): Promise<number> {
    const dados = dadosVenda(entrada);
  
    if (
      dados.desconto > 10 &&
      operador.perfil !== 'GERENTE'
    ) {
      throw new ErroHttp(
        403,
        'Desconto acima de 10% exige gerente autenticado.'
      );
    }
  
    return withTransaction(
      async (conexao: PoolConnection) => {
        if (dados.clienteId !== null) {
          const cliente = await ClienteModel.findById(
            dados.clienteId,
            conexao
          );
  
          if (
            !cliente ||
            Number(cliente.ativo) !== 1
          ) {
            throw new ErroHttp(
              400,
              'Cliente inexistente ou inativo.'
            );
          }
        }
  
        const itensComPreco: {
          id: number;
          codigo: string;
          nome: string;
          quantidade: number;
          preco: string;
        }[] = [];
  
        let subtotalCentavos = 0;
  
        for (const item of dados.itens) {
          const [linhas] = await conexao.execute<
            LinhaProduto[]
          >(
            `SELECT id, codigo, nome, preco, estoque, ativo
             FROM produtos
             WHERE id = ?
             FOR UPDATE`,
            [item.produtoId]
          );
  
          const produto = linhas[0];
  
          if (
            !produto ||
            Number(produto.ativo) !== 1
          ) {
            throw new ErroHttp(
              400,
              `Produto ${item.produtoId} inexistente ou inativo.`
            );
          }
  
          if (produto.estoque < item.quantidade) {
            throw new ErroHttp(
              409,
              `Estoque insuficiente para ${produto.nome}.`
            );
          }
  
          const precoCentavos = centavos(
            produto.preco,
            'preco do produto'
          );
  
          const totalItem =
            precoCentavos * item.quantidade;
  
          if (
            !Number.isSafeInteger(totalItem) ||
            totalItem > 999999999999
          ) {
            throw new ErroHttp(
              400,
              'Valor total excessivo.'
            );
          }
  
          subtotalCentavos += totalItem;
  
          if (
            !Number.isSafeInteger(subtotalCentavos) ||
            subtotalCentavos > 999999999999
          ) {
            throw new ErroHttp(
              400,
              'Subtotal acima do limite do banco.'
            );
          }
  
          itensComPreco.push({
            id: produto.id,
            codigo: produto.codigo,
            nome: produto.nome,
            quantidade: item.quantidade,
            preco: moeda(precoCentavos)
          });
        }
  
        const id = await VendaModel.create(
          {
            cliente_id: dados.clienteId,
            usuario_id: operador.id,
            autorizador_desconto_id:
              dados.desconto > 10
                ? operador.id
                : null,
            subtotal: moeda(subtotalCentavos),
            desconto_percentual:
              dados.desconto.toFixed(2),
            forma_pagamento:
              dados.formaPagamento
          },
          conexao
        );
  
        for (const item of itensComPreco) {
          await ItemVendaModel.create(
            {
              venda_id: id,
              produto_id: item.id,
              codigo_produto: item.codigo,
              nome_produto: item.nome,
              quantidade: item.quantidade,
              preco_unitario: item.preco
            },
            conexao
          );
  
          const [resultado] =
            await conexao.execute<ResultSetHeader>(
              `UPDATE produtos
               SET estoque = estoque - ?
               WHERE id = ? AND estoque >= ?`,
              [
                item.quantidade,
                item.id,
                item.quantidade
              ]
            );
  
          if (resultado.affectedRows !== 1) {
            throw new ErroHttp(
              409,
              `Estoque insuficiente para ${item.nome}.`
            );
          }
        }
  
        return id;
      }
    );
  }
  
  export async function cancelarVenda(
    vendaId: number,
    gerenteId: number,
    motivo: string
  ): Promise<void> {
    await withTransaction(
      async (conexao: PoolConnection) => {
        const [linhas] = await conexao.execute<
          LinhaVenda[]
        >(
          `SELECT id, status
           FROM vendas
           WHERE id = ?
           FOR UPDATE`,
          [vendaId]
        );
  
        const venda = linhas[0];
  
        if (!venda) {
          throw new ErroHttp(
            404,
            'Venda não encontrada.'
          );
        }
  
        if (venda.status !== 'CONCLUIDA') {
          throw new ErroHttp(
            409,
            'Venda já cancelada.'
          );
        }
  
        const itens =
          await ItemVendaModel.findByVendaId(
            vendaId,
            conexao
          );
  
        if (itens.length === 0) {
          throw new ErroHttp(
            409,
            'Venda sem itens. Verifique o histórico.'
          );
        }
  
        const [resultado] =
          await conexao.execute<ResultSetHeader>(
            `UPDATE vendas
             SET status = 'CANCELADA',
                 cancelado_por_id = ?,
                 cancelada_em = NOW(),
                 motivo_cancelamento = ?
             WHERE id = ?
               AND status = 'CONCLUIDA'`,
            [
              gerenteId,
              motivo,
              vendaId
            ]
          );
  
        if (resultado.affectedRows !== 1) {
          throw new ErroHttp(
            409,
            'Venda não pôde ser cancelada.'
          );
        }
  
        for (const item of itens) {
          await conexao.execute(
            `UPDATE produtos
             SET estoque = estoque + ?
             WHERE id = ?`,
            [
              item.quantidade,
              item.produto_id
            ]
          );
        }
      }
    );
  }
  