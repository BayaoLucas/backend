# MS² Vestuário

Dupla: Lucas Bayão e Pedro Henrique.

Backend desenvolvido para o sistema de gerenciamento da loja MS² Vestuário. O projeto permite administrar usuários, clientes, produtos, estoque e vendas por meio de uma API construída com Node.js, Express, TypeScript e MySQL.

O sistema possui autenticação com JWT, senhas protegidas com bcrypt, controle de acesso por perfil, validação dos dados recebidos e processamento de vendas utilizando transações no banco de dados.

## Funcionalidades

O backend possui as seguintes funcionalidades:

- Autenticação de usuários.
- Controle de acesso entre caixa e gerente.
- Cadastro e consulta de usuários.
- Cadastro e consulta de clientes.
- Validação de CPF.
- Histórico de compras do cliente.
- Cadastro e consulta de produtos.
- Controle de produtos ativos e inativos.
- Controle de estoque.
- Simulação de vendas.
- Finalização de vendas.
- Aplicação de descontos.
- Autorização gerencial para descontos acima do limite.
- Cancelamento de vendas.
- Reposição do estoque após cancelamento.
- Resumo diário das vendas.
- Tratamento centralizado de erros.

## Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| Node.js | Execução do backend |
| Express | Criação do servidor e das rotas |
| TypeScript | Tipagem e organização do código |
| MySQL | Armazenamento dos dados |
| MySQL2 | Conexão entre o backend e o MySQL |
| dotenv | Leitura das configurações do `.env` |
| bcrypt | Proteção das senhas |
| JSON Web Token | Autenticação dos usuários |
| tsx | Execução do TypeScript em desenvolvimento |

## Estrutura do projeto

| Caminho | Responsabilidade |
|---|---|
| `src/config/database.ts` | Configura a conexão com o MySQL e as transações |
| `src/types/index.ts` | Contém as Interfaces e Types do sistema |
| `src/models` | Realiza as operações de acesso ao banco de dados |
| `src/controllers` | Valida os dados e executa as regras do sistema |
| `src/routes` | Define as rotas disponíveis na API |
| `src/middleware/authMiddleware.ts` | Realiza a autenticação e o controle de permissões |
| `src/server.ts` | Configura e inicia o servidor Express |
| `sql/banco.sql` | Contém a criação do banco de dados e das tabelas |
| `docs/REQUISITOS.md` | Contém os requisitos do projeto |

## Banco de dados

O projeto utiliza o banco de dados:

```text
ms2_vestuario
```

As tabelas utilizadas são:

| Tabela | Responsabilidade |
|---|---|
| `usuarios` | Armazena caixas e gerentes |
| `clientes` | Armazena os clientes da loja |
| `produtos` | Armazena produtos, preços e estoque |
| `vendas` | Armazena os dados principais das vendas |
| `itens_venda` | Armazena os produtos de cada venda |

Caso o banco ainda não exista, execute o arquivo:

```text
sql/banco.sql
```

O arquivo deve ser executado no MySQL Workbench.

## Instalação

Clone o repositório:

```bash
git clone https://github.com/BayaoLucas/backend.git
```

Entre na pasta do projeto:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

## Configuração do `.env`

Na raiz do projeto, crie um arquivo chamado `.env`:

```env
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=SUA_SENHA_DO_MYSQL
DB_NAME=ms2_vestuario
PORT=3000
JWT_SECRET=uma_chave_secreta_com_pelo_menos_32_caracteres
```

Altere os valores conforme a configuração do MySQL da sua máquina.

| Variável | Explicação |
|---|---|
| `DB_HOST` | Endereço do servidor MySQL |
| `DB_PORT` | Porta utilizada pelo MySQL |
| `DB_USER` | Usuário do MySQL |
| `DB_PASSWORD` | Senha do MySQL |
| `DB_NAME` | Nome do banco de dados |
| `PORT` | Porta utilizada pelo backend |
| `JWT_SECRET` | Chave utilizada para gerar os tokens |

O `JWT_SECRET` deve possuir pelo menos 32 caracteres.

O arquivo `.env` não deve ser enviado ao GitHub, pois pode conter senhas e outras informações particulares.

## Executando o projeto

Para iniciar o servidor durante o desenvolvimento:

```bash
npm run dev
```

Quando a conexão funcionar, o terminal deverá mostrar:

```text
MySQL conectado com sucesso!
MS² Vestuário em http://localhost:3000/api/status
```

Para verificar o funcionamento do servidor, acesse:

```text
http://localhost:3000/api/status
```

A resposta esperada é:

```json
{
  "projeto": "MS² Vestuário",
  "servidor": "em execução"
}
```

Para compilar o TypeScript:

```bash
npm run build
```

Para executar a versão compilada:

```bash
npm start
```

## Primeiro gerente

Para acessar as rotas protegidas, é necessário criar o primeiro usuário gerente.

No Thunder Client, crie uma requisição:

```http
POST http://localhost:3000/api/usuarios/primeiro-gerente
```

Selecione `Body`, depois `JSON` e envie:

```json
{
  "nome": "Gerente Principal",
  "email": "gerente@ms2.com",
  "senha": "SenhaSegura123"
}
```

Essa rota é utilizada somente para criar o primeiro gerente e deve ser acessada localmente.

## Login

Para entrar no sistema, utilize:

```http
POST http://localhost:3000/api/auth/login
```

Body:

```json
{
  "email": "gerente@ms2.com",
  "senha": "SenhaSegura123"
}
```

A resposta apresentará os dados do usuário e um token:

```json
{
  "token": "TOKEN_JWT",
  "usuario": {
    "id": 1,
    "nome": "Gerente Principal",
    "email": "gerente@ms2.com",
    "perfil": "GERENTE",
    "ativo": 1
  }
}
```

Copie o token recebido. Nas próximas requisições do Thunder Client:

1. Abra a aba `Auth`.
2. Escolha `Bearer Token`.
3. Cole o token recebido no login.

O token também pode ser enviado pelo cabeçalho:

```text
Authorization: Bearer SEU_TOKEN
```

## Perfis de usuário

O sistema possui dois perfis:

| Perfil | Permissões |
|---|---|
| `CAIXA` | Consulta cadastros, cadastra clientes e realiza vendas |
| `GERENTE` | Possui as permissões do caixa e também administra usuários, produtos, cancelamentos e outras funções restritas |

## Rotas de autenticação

| Método | Rota | Acesso | Função |
|---|---|---|---|
| GET | `/status` | Público | Verifica o servidor |
| GET | `/api/status` | Público | Verifica o servidor |
| POST | `/api/auth/login` | Público | Realiza o login |
| GET | `/api/auth/me` | Autenticado | Consulta o usuário conectado |
| POST | `/api/auth/logout` | Autenticado | Encerra a sessão |
| POST | `/api/usuarios/primeiro-gerente` | Local | Cria o primeiro gerente |

Também estão disponíveis as rotas:

```text
POST /api/usuarios/login
GET /api/usuarios/me
POST /api/usuarios/logout
```

## Rotas de usuários

| Método | Rota | Acesso | Função |
|---|---|---|---|
| GET | `/api/usuarios` | Gerente | Lista os usuários |
| GET | `/api/usuarios/:id` | Gerente | Consulta um usuário |
| POST | `/api/usuarios` | Gerente | Cadastra um usuário |
| PUT | `/api/usuarios/:id` | Gerente | Atualiza um usuário |
| PATCH | `/api/usuarios/:id/inativar` | Gerente | Inativa um usuário |
| PATCH | `/api/usuarios/:id/reativar` | Gerente | Reativa um usuário |

Exemplo de cadastro:

```http
POST http://localhost:3000/api/usuarios
```

```json
{
  "nome": "Operador do Caixa",
  "email": "caixa@ms2.com",
  "senha": "SenhaSegura123",
  "perfil": "CAIXA"
}
```

## Rotas de clientes

| Método | Rota | Acesso | Função |
|---|---|---|---|
| GET | `/api/clientes` | Autenticado | Lista os clientes |
| GET | `/api/clientes/:id` | Autenticado | Consulta um cliente |
| GET | `/api/clientes/:id/historico` | Autenticado | Consulta o histórico do cliente |
| POST | `/api/clientes` | Autenticado | Cadastra um cliente |
| PUT | `/api/clientes/:id` | Autenticado | Atualiza um cliente |
| PATCH | `/api/clientes/:id/inativar` | Gerente | Inativa um cliente |
| PATCH | `/api/clientes/:id/reativar` | Gerente | Reativa um cliente |

Exemplo de cadastro:

```http
POST http://localhost:3000/api/clientes
```

```json
{
  "nome": "Maria da Silva",
  "cpf": "52998224725",
  "telefone": "11999999999",
  "email": "maria@email.com"
}
```

O CPF precisa ser válido e não pode estar cadastrado para outro cliente.

## Rotas de produtos

| Método | Rota | Acesso | Função |
|---|---|---|---|
| GET | `/api/produtos` | Autenticado | Lista e pesquisa produtos |
| GET | `/api/produtos/:id` | Autenticado | Consulta um produto |
| POST | `/api/produtos` | Gerente | Cadastra um produto |
| PUT | `/api/produtos/:id` | Gerente | Atualiza um produto |
| PATCH | `/api/produtos/:id/inativar` | Gerente | Inativa um produto |
| PATCH | `/api/produtos/:id/reativar` | Gerente | Reativa um produto |

Exemplo de cadastro:

```http
POST http://localhost:3000/api/produtos
```

```json
{
  "codigo": "CAM-PRETA-M",
  "nome": "Camiseta preta",
  "descricao": "Camiseta básica de algodão",
  "tamanho": "M",
  "cor": "Preta",
  "preco": "50.00",
  "estoque": 10
}
```

O código do produto deve ser único. O preço deve ser maior que zero e o estoque não pode ser negativo.

## Rotas de vendas

| Método | Rota | Acesso | Função |
|---|---|---|---|
| POST | `/api/vendas/simular` | Autenticado | Simula uma venda |
| GET | `/api/vendas/resumo-diario` | Gerente | Consulta o resumo diário |
| GET | `/api/vendas` | Autenticado | Lista as vendas |
| POST | `/api/vendas` | Autenticado | Finaliza uma venda |
| GET | `/api/vendas/:id` | Autenticado | Consulta uma venda |
| GET | `/api/vendas/:id/itens` | Autenticado | Consulta os itens da venda |
| PATCH | `/api/vendas/:id/cancelar` | Gerente | Cancela uma venda |

## Simulação de venda

A simulação calcula os valores sem registrar a venda e sem alterar o estoque.

```http
POST http://localhost:3000/api/vendas/simular
```

```json
{
  "cliente_id": 1,
  "forma_pagamento": "PIX",
  "desconto_percentual": 5,
  "itens": [
    {
      "produto_id": 1,
      "quantidade": 2,
      "preco_esperado": "50.00"
    }
  ]
}
```

## Finalização de venda

```http
POST http://localhost:3000/api/vendas
```

```json
{
  "cliente_id": 1,
  "forma_pagamento": "PIX",
  "desconto_percentual": 5,
  "itens": [
    {
      "produto_id": 1,
      "quantidade": 2,
      "preco_esperado": "50.00"
    }
  ]
}
```

O campo `cliente_id` é opcional.

As formas de pagamento aceitas são:

```text
DINHEIRO
PIX
DEBITO
CREDITO
```

A venda é processada em uma transação. O sistema registra a venda, registra os itens e reduz o estoque. Se alguma etapa falhar, nenhuma alteração é confirmada.

## Cancelamento de venda

Somente um gerente pode cancelar uma venda.

```http
PATCH http://localhost:3000/api/vendas/1/cancelar
```

Body:

```json
{
  "motivo": "Venda registrada incorretamente"
}
```

O cancelamento mantém o histórico da venda e devolve as quantidades dos produtos ao estoque.

## Rotas dos itens de venda

| Método | Rota | Acesso | Função |
|---|---|---|---|
| GET | `/api/itens-venda` | Autenticado | Lista os itens das vendas |
| GET | `/api/itens-venda/:id` | Autenticado | Consulta um item |

Os itens são criados durante a finalização da venda. Não existem rotas para alterar ou excluir diretamente um item de venda.

## Regras implementadas

| Regra | Funcionamento |
|---|---|
| Autenticação | Rotas protegidas exigem JWT |
| Senhas | São protegidas com bcrypt |
| Usuário ativo | Usuários inativos não podem utilizar o sistema |
| Permissões | Determinadas pelos perfis `CAIXA` e `GERENTE` |
| CPF | Deve ser válido e único |
| Código do produto | Deve ser único |
| Preço | Deve ser maior que zero |
| Estoque | Não pode ser negativo |
| Produto ativo | Produto inativo não pode entrar em uma venda |
| Estoque disponível | Não é permitido vender acima da quantidade disponível |
| Venda | Deve possuir pelo menos um item |
| Cliente | Pode ser opcional na venda |
| Desconto | Deve ficar entre 0% e 100% |
| Desconto acima de 10% | Exige autorização gerencial para vendas realizadas por caixa |
| Desconto de 100% | Exige confirmação explícita |
| Cancelamento | Somente gerente pode cancelar |
| Motivo | O cancelamento exige uma justificativa |
| Reposição | O cancelamento devolve os produtos ao estoque |
| Histórico | Cadastros são inativados em vez de excluídos |
| Transação | Venda, itens e estoque são processados em conjunto |

## Códigos de resposta

| Código | Significado |
|---|---|
| `200` | Operação realizada com sucesso |
| `201` | Cadastro criado com sucesso |
| `400` | Dados enviados incorretamente |
| `401` | Token ausente ou inválido |
| `403` | Usuário sem permissão |
| `404` | Registro ou rota não encontrada |
| `409` | Conflito de dados |
| `422` | Dados incompatíveis com as regras |
| `500` | Erro interno do servidor |

## Erros comuns

| Erro | Possível solução |
|---|---|
| `tsx não encontrado` | Execute `npm install` |
| `package.json não encontrado` | Entre na pasta do projeto |
| `Access denied` | Confira usuário e senha no `.env` |
| `Unknown database` | Crie o banco `ms2_vestuario` |
| `ECONNREFUSED` | Confira se o MySQL está iniciado |
| `JWT_SECRET ausente` | Configure uma chave de pelo menos 32 caracteres |
| `Token não informado` | Configure o Bearer Token |
| `EADDRINUSE` | Encerre o servidor anterior ou altere `PORT` |
| `Registro duplicado` | Utilize outro CPF, e-mail ou código |
| `403 Forbidden` | Utilize um usuário gerente |
| `Rota não encontrada` | Confira o método e o endereço da requisição |

Depois de alterar o `.env`, salve o arquivo, encerre o servidor com `Ctrl+C` e execute novamente:

```bash
npm run dev
```

## Enviando alterações para o GitHub

Confira os arquivos modificados:

```bash
git status
```

Adicione as alterações:

```bash
git add .
```

Crie o commit:

```bash
git commit -m "Atualiza backend do MS2 Vestuario"
```

Envie para o GitHub:

```bash
git push origin master
```

Não envie o arquivo `.env`, a pasta `node_modules` ou a pasta `dist`.
