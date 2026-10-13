
import {
    NovoCliente,
    NovoProduto,
    PerfilUsuario,
    FormaPagamento
  } from '../types';
  
  import { ErroHttp } from './erros';
  
  export function objeto(
    valor: unknown
  ): Record<string, unknown> {
    if (
      !valor ||
      typeof valor !== 'object' ||
      Array.isArray(valor)
    ) {
      throw new ErroHttp(
        400,
        'Envie um objeto JSON válido.'
      );
    }
  
    return valor as Record<string, unknown>;
  }
  
  export function apenasCampos(
    d: Record<string, unknown>,
    permitidos: string[]
  ): void {
    const inesperado = Object.keys(d).find(
      chave => !permitidos.includes(chave)
    );
  
    if (inesperado) {
      throw new ErroHttp(
        400,
        `Campo não permitido: ${inesperado}.`
      );
    }
  }
  
  export function texto(
    d: Record<string, unknown>,
    campo: string,
    maximo = 120
  ): string {
    const valor = d[campo];
  
    if (
      typeof valor !== 'string' ||
      !valor.trim() ||
      valor.trim().length > maximo
    ) {
      throw new ErroHttp(
        400,
        `O campo ${campo} é obrigatório e deve ter até ${maximo} caracteres.`
      );
    }
  
    return valor.trim();
  }
  
  export function textoOpcional(
    d: Record<string, unknown>,
    campo: string,
    maximo: number
  ): string | null {
    const valor = d[campo];
  
    if (
      valor === undefined ||
      valor === null ||
      valor === ''
    ) {
      return null;
    }
  
    if (
      typeof valor !== 'string' ||
      valor.trim().length > maximo
    ) {
      throw new ErroHttp(
        400,
        `O campo ${campo} deve ter até ${maximo} caracteres.`
      );
    }
  
    return valor.trim() || null;
  }
  
  export function inteiroPositivo(
    valor: unknown,
    nome: string
  ): number {
    if (
      typeof valor !== 'number' ||
      !Number.isSafeInteger(valor) ||
      valor <= 0
    ) {
      throw new ErroHttp(
        400,
        `${nome} deve ser um inteiro positivo.`
      );
    }
  
    return valor;
  }
  
  export function idParametro(
    valor: string | string[] | undefined
  ): number {
    if (
      typeof valor !== 'string' ||
      !/^[1-9]\d*$/.test(valor)
    ) {
      throw new ErroHttp(400, 'ID inválido.');
    }
  
    const id = Number(valor);
  
    if (!Number.isSafeInteger(id)) {
      throw new ErroHttp(400, 'ID inválido.');
    }
  
    return id;
  }
  
  export function opcao<T extends string>(
    valor: unknown,
    nome: string,
    permitidas: readonly T[]
  ): T {
    if (
      typeof valor !== 'string' ||
      !permitidas.includes(valor as T)
    ) {
      throw new ErroHttp(
        400,
        `${nome} inválido. Use: ${permitidas.join(', ')}.`
      );
    }
  
    return valor as T;
  }
  
  export function centavos(
    valor: unknown,
    nome: string,
    permitirZero = false
  ): number {
    if (
      typeof valor !== 'number' &&
      typeof valor !== 'string'
    ) {
      throw new ErroHttp(
        400,
        `${nome} deve ser um valor monetário.`
      );
    }
  
    const t = String(valor);
  
    if (
      !/^(0|[1-9]\d{0,11})(\.\d{1,2})?$/.test(t)
    ) {
      throw new ErroHttp(
        400,
        `${nome} deve ter no máximo duas casas decimais (ex.: 59.90).`
      );
    }
  
    const [reais, decimais = ''] = t.split('.');
  
    const valorCentavos =
      Number(reais) * 100 +
      Number(decimais.padEnd(2, '0'));
  
    if (
      !Number.isSafeInteger(valorCentavos) ||
      (!permitirZero && valorCentavos === 0)
    ) {
      throw new ErroHttp(
        400,
        `${nome} fora do intervalo permitido.`
      );
    }
  
    return valorCentavos;
  }
  
  export function moeda(
    valorCentavos: number
  ): string {
    if (
      !Number.isSafeInteger(valorCentavos) ||
      valorCentavos < 0
    ) {
      throw new ErroHttp(
        400,
        'Valor monetário inválido.'
      );
    }
  
    return `${Math.floor(valorCentavos / 100)}.${String(valorCentavos % 100).padStart(2, '0')}`;
  }
  
  export function porcentagem(
    valor: unknown
  ): number {
    const t = valor === undefined
      ? '0'
      : String(valor);
  
    if (
      (
        typeof valor !== 'number' &&
        typeof valor !== 'string' &&
        valor !== undefined
      ) ||
      !/^(0|[1-9]\d{0,2})(\.\d{1,2})?$/.test(t) ||
      Number(t) > 100
    ) {
      throw new ErroHttp(
        400,
        'desconto_percentual deve estar entre 0 e 100, com até duas casas decimais.'
      );
    }
  
    return Number(t);
  }
  
  export function email(
    d: Record<string, unknown>
  ): string {
    const e = texto(d, 'email', 150).toLowerCase();
  
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      throw new ErroHttp(
        400,
        'E-mail inválido.'
      );
    }
  
    return e;
  }
  
  export function cpf(
    valor: unknown
  ): string {
    if (
      typeof valor !== 'string' ||
      !/^[\d.\- ]+$/.test(valor)
    ) {
      throw new ErroHttp(400, 'CPF inválido.');
    }
  
    const numeros = valor.replace(/\D/g, '');
  
    if (
      numeros.length !== 11 ||
      /^(\d)\1{10}$/.test(numeros)
    ) {
      throw new ErroHttp(400, 'CPF inválido.');
    }
  
    const digito = (tamanho: number) => {
      const soma = numeros
        .slice(0, tamanho)
        .split('')
        .reduce(
          (s, n, i) =>
            s + Number(n) * (tamanho + 1 - i),
          0
        );
  
      return (soma * 10) % 11 % 10;
    };
  
    if (
      digito(9) !== Number(numeros[9]) ||
      digito(10) !== Number(numeros[10])
    ) {
      throw new ErroHttp(400, 'CPF inválido.');
    }
  
    return numeros;
  }
  
  export function dadosCliente(
    entrada: unknown
  ): NovoCliente {
    const d = objeto(entrada);
  
    apenasCampos(d, [
      'nome',
      'cpf',
      'telefone',
      'email'
    ]);
  
    return {
      nome: texto(d, 'nome'),
      cpf: cpf(d.cpf),
      telefone: textoOpcional(d, 'telefone', 20),
      email: validarEmailOpcional(d)
    };
  }
  
  function validarEmailOpcional(
    d: Record<string, unknown>
  ): string | null {
    const e = textoOpcional(
      d,
      'email',
      150
    )?.toLowerCase() ?? null;
  
    if (
      e &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
    ) {
      throw new ErroHttp(400, 'E-mail inválido.');
    }
  
    return e;
  }
  
  export function dadosProduto(
    entrada: unknown,
    exigirEstoque = false
  ): NovoProduto {
    const d = objeto(entrada);
  
    apenasCampos(d, [
      'codigo',
      'nome',
      'descricao',
      'tamanho',
      'cor',
      'preco',
      'estoque'
    ]);
  
    if (
      exigirEstoque &&
      d.estoque === undefined
    ) {
      throw new ErroHttp(
        400,
        'Informe estoque na atualização completa.'
      );
    }
  
    const estoque = d.estoque === undefined
      ? 0
      : d.estoque;
  
    if (
      typeof estoque !== 'number' ||
      !Number.isSafeInteger(estoque) ||
      estoque < 0
    ) {
      throw new ErroHttp(
        400,
        'estoque deve ser um inteiro não negativo.'
      );
    }
  
    return {
      codigo: texto(d, 'codigo', 50).toUpperCase(),
      nome: texto(d, 'nome'),
      descricao: textoOpcional(
        d,
        'descricao',
        10000
      ),
      tamanho: textoOpcional(
        d,
        'tamanho',
        20
      ),
      cor: textoOpcional(
        d,
        'cor',
        40
      ),
      preco: moeda(
        centavos(d.preco, 'preco')
      ),
      estoque
    };
  }
  
  export function dadosUsuario(
    entrada: unknown
  ): {
    nome: string;
    email: string;
    perfil: PerfilUsuario;
    senha?: string;
  } {
    const d = objeto(entrada);
  
    apenasCampos(d, [
      'nome',
      'email',
      'perfil',
      'senha'
    ]);
  
    const resultado: {
      nome: string;
      email: string;
      perfil: PerfilUsuario;
      senha?: string;
    } = {
      nome: texto(d, 'nome'),
      email: email(d),
      perfil: opcao(
        d.perfil,
        'perfil',
        ['CAIXA', 'GERENTE'] as const
      )
    };
  
    if (d.senha !== undefined) {
      if (
        typeof d.senha !== 'string' ||
        d.senha.length < 8 ||
        d.senha.length > 128
      ) {
        throw new ErroHttp(
          400,
          'A senha deve ter entre 8 e 128 caracteres.'
        );
      }
  
      resultado.senha = d.senha;
    }
  
    return resultado;
  }
  
  export function dadosVenda(
    entrada: unknown
  ): {
    clienteId: number | null;
    desconto: number;
    formaPagamento: FormaPagamento;
    itens: {
      produtoId: number;
      quantidade: number;
    }[];
    confirmarTotalZero: boolean;
  } {
    const d = objeto(entrada);
  
    apenasCampos(d, [
      'cliente_id',
      'desconto_percentual',
      'forma_pagamento',
      'itens',
      'confirmar_total_zero'
    ]);
  
    const clienteId =
      d.cliente_id === undefined ||
      d.cliente_id === null
        ? null
        : inteiroPositivo(
            d.cliente_id,
            'cliente_id'
          );
  
    const formaPagamento = opcao(
      d.forma_pagamento,
      'forma_pagamento',
      [
        'DINHEIRO',
        'PIX',
        'DEBITO',
        'CREDITO'
      ] as const
    );
  
    if (
      !Array.isArray(d.itens) ||
      d.itens.length < 1 ||
      d.itens.length > 100
    ) {
      throw new ErroHttp(
        400,
        'A venda deve conter de 1 a 100 itens.'
      );
    }
  
    const agrupados = new Map<number, number>();
  
    for (const item of d.itens) {
      const x = objeto(item);
  
      apenasCampos(x, [
        'produto_id',
        'quantidade'
      ]);
  
      const produtoId = inteiroPositivo(
        x.produto_id,
        'produto_id'
      );
  
      const quantidade = inteiroPositivo(
        x.quantidade,
        'quantidade'
      );
  
      const soma =
        (agrupados.get(produtoId) ?? 0) +
        quantidade;
  
      if (!Number.isSafeInteger(soma)) {
        throw new ErroHttp(
          400,
          'Quantidade excessiva.'
        );
      }
  
      agrupados.set(produtoId, soma);
    }
  
    const desconto = porcentagem(
      d.desconto_percentual
    );
  
    if (
      desconto === 100 &&
      d.confirmar_total_zero !== true
    ) {
      throw new ErroHttp(
        400,
        'Para desconto de 100%, envie confirmar_total_zero: true.'
      );
    }
  
    return {
      clienteId,
      desconto,
      confirmarTotalZero:
        d.confirmar_total_zero === true,
      formaPagamento,
      itens: Array.from(
        agrupados,
        ([produtoId, quantidade]) => ({
          produtoId,
          quantidade
        })
      ).sort(
        (a, b) => a.produtoId - b.produtoId
      )
    };
  }
  