export type PerfilUsuario = 'CAIXA' | 'GERENTE';
export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'DEBITO' | 'CREDITO';
export type StatusVenda = 'CONCLUIDA' | 'CANCELADA';
export type Ativo = 0 | 1;
// MySQL2 retorna DECIMAL como texto. Exemplo: '49.90'.
export type Decimal = string;

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  perfil: PerfilUsuario;
  ativo: Ativo;
  criado_em: Date;
}
// O model recebe o hash pronto. Gerar o hash e autenticar são tarefas da Sprint 3.
export interface NovoUsuario {
  nome: string;
  email: string;
  senha_hash: string;
  perfil: PerfilUsuario;
}

export interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  telefone: string | null;
  email: string | null;
  ativo: Ativo;
  criado_em: Date;
}
export interface NovoCliente {
  nome: string;
  cpf: string;
  telefone?: string | null;
  email?: string | null;
}

export interface Produto {
  id: number;
  codigo: string;
  nome: string;
  descricao: string | null;
  tamanho: string | null;
  cor: string | null;
  preco: Decimal;
  estoque: number;
  ativo: Ativo;
  criado_em: Date;
}
export interface NovoProduto {
  codigo: string;
  nome: string;
  descricao?: string | null;
  tamanho?: string | null;
  cor?: string | null;
  preco: Decimal;
  estoque?: number;
}

export interface Venda {
  id: number;
  cliente_id: number | null;
  usuario_id: number;
  autorizador_desconto_id: number | null;
  cancelado_por_id: number | null;
  subtotal: Decimal;
  desconto_percentual: Decimal;
  desconto_valor: Decimal;
  total: Decimal;
  forma_pagamento: FormaPagamento;
  status: StatusVenda;
  realizada_em: Date;
  cancelada_em: Date | null;
  motivo_cancelamento: string | null;
}
// Entrada interna de persistência; não é um corpo de requisição HTTP.
// A Sprint 3 calculará subtotal e verificará usuário/autorizador antes de chamar o model.
export interface NovaVenda {
  cliente_id?: number | null;
  usuario_id: number;
  autorizador_desconto_id?: number | null;
  subtotal: Decimal;
  desconto_percentual?: Decimal;
  forma_pagamento: FormaPagamento;
}

export interface ItemVenda {
  id: number;
  venda_id: number;
  produto_id: number;
  codigo_produto: string;
  nome_produto: string;
  quantidade: number;
  preco_unitario: Decimal;
  total_item: Decimal;
}
export interface NovoItemVenda {
  venda_id: number;
  produto_id: number;
  codigo_produto: string;
  nome_produto: string;
  quantidade: number;
  preco_unitario: Decimal;
}
