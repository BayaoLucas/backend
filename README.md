# MS² Vestuário: Sprints 2 e 3

Dupla: Lucas Bayão e Pedro Henrique.

Backend desenvolvido em Node.js, Express, TypeScript e MySQL para o sistema MS² Vestuário.

A Sprint 2 contempla a configuração do servidor e do banco de dados, criação das Interfaces/Types e desenvolvimento dos Models.

A Sprint 3 acrescenta Controllers, rotas HTTP, autenticação com JWT, criptografia de senhas, controle de permissões, validações e regras de negócio relacionadas a usuários, clientes, produtos e vendas.

Os requisitos funcionais, não funcionais e regras de negócio utilizados como referência estão documentados em `docs/REQUISITOS.md`.

## 1. Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| Node.js | Execução do backend |
| Express | Criação do servidor e das rotas HTTP |
| TypeScript | Tipagem e organização do código |
| MySQL | Armazenamento dos dados |
| MySQL2 | Comunicação entre Node.js e MySQL |
| dotenv | Leitura das variáveis do arquivo `.env` |
| bcrypt | Criptografia das senhas |
| JSON Web Token | Autenticação dos usuários |
| CORS | Controle de acesso ao backend |
| tsx | Execução do TypeScript durante o desenvolvimento |

## 2. Instalação

Clone o repositório e entre na pasta do projeto:

```bash
git clone URL_DO_REPOSITORIO
cd backend
```

Instale as dependências:

```bash
npm ci --include=dev
```

Também é possível usar:

```bash
npm install
```

O comando instala as dependências definidas no `package.json`, incluindo Express, MySQL2, dotenv, bcrypt, JSON Web Token, CORS, TypeScript e tsx.

A pasta `node_modules` será criada automaticamente e não deve ser enviada ao GitHub.

## 3. Configuração do ambiente

Na raiz do projeto, crie um arquivo chamado `.env`:

```env
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=SUA_SENHA_REAL_DO_MYSQL
DB_NAME=ms2_vestuario
PORT=3000
JWT_SECRET=coloque_aqui_uma_chave_com_pelo_menos_32_caracteres
```

Altere os valores conforme a configuração do MySQL da sua máquina.

| Variável | Explicação |
|---|---|
| `DB_HOST` | Endereço do servidor MySQL |
| `DB_PORT` | Porta utilizada pelo MySQL |
| `DB_USER` | Usuário do MySQL |
| `DB_PASSWORD` | Senha do usuário MySQL |
| `DB_NAME` | Nome do banco de dados |
| `PORT` | Porta utilizada pelo backend |
| `JWT_SECRET` | Chave utilizada para criar e validar os tokens de autenticação |

O `JWT_SECRET` deve possuir pelo menos 32 caracteres.

O arquivo `.env` contém informações particulares e não deve ser enviado ao GitHub. Ele precisa estar incluído no `.gitignore`.

## 4. Banco de dados

O banco utilizado pelo projeto é:

```text
ms2_vestuario
```

As tabelas principais são:

| Tabela | Responsabilidade |
|---|---|
| `usuarios` | Funcionários do sistema, como caixas e gerentes |
| `clientes` | Clientes cadastrados |
| `produtos` | Produtos, preços e estoque |
| `vendas` | Informações gerais das vendas |
| `itens_venda` | Produtos incluídos em cada venda |

Caso o banco ainda não exista, execute o arquivo abaixo no MySQL Workbench:

```text
sql/banco.sql
```

Esse arquivo cria o banco e as cinco tabelas utilizadas pelo sistema.

Se as tabelas já existirem e possuírem dados, não execute novamente o script de primeira criação sem conferir seu conteúdo.

Para verificar a conexão e a existência das tabelas, execute:

```bash
npm run check:db
```

## 5. Executando o projeto

Para iniciar o servidor em modo de desenvolvimento:

```bash
npm run dev
```

Quando a configuração estiver correta, o terminal deverá apresentar uma mensagem semelhante a:

```text
MySQL conectado com sucesso!
MS² Vestuário em http://localhost:3000/api/status
```

Para testar se o servidor está respondendo, acesse:

```text
http://localhost:3000/status
```

ou:

```text
http://localhost:3000/api/status
```

Essas rotas não exigem autenticação.

## 6. Primeiro gerente

Antes de utilizar as rotas protegidas, é necessário possuir pelo menos um usuário gerente.

O primeiro gerente pode ser cadastrado localmente pela rota:

```http
POST http://localhost:3000/api/usuarios/primeiro-gerente
```

Body em formato JSON:

```json
{
  "nome": "Gerente Principal",
  "email": "gerente@ms2.com",
  "senha": "SenhaSegura123"
}
```

Essa rota deve ser utilizada somente para criar o primeiro gerente e aceita requisições realizadas localmente.

Depois da criação do primeiro gerente, os demais usuários devem ser cadastrados por um gerente autenticado.

## 7. Autenticação

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

Quando o login for realizado com sucesso, a resposta apresentará um token JWT e os dados públicos do usuário.

Exemplo:

```json
{
  "token": "TOKEN_JWT_RECEBIDO",
  "usuario": {
    "id": 1,
    "nome": "Gerente Principal",
    "email": "gerente@ms2.com",
    "perfil": "GERENTE",
    "ativo": 1
  }
}
```

As senhas são armazenadas como hash, utilizando bcrypt. A propriedade `senha_hash` nunca deve ser devolvida pela API.

Para acessar uma rota protegida no Thunder Client, abra a aba `Auth`, escolha `Bearer Token` e informe o token retornado no login.

Também é possível adicionar manualmente o cabeçalho:

```text
Authorization: Bearer SEU_TOKEN
```

Para consultar o usuário autenticado:

```http
GET http://localhost:3000/api/auth/me
```

Para encerrar a sessão:

```http
POST http://localhost:3000/api/auth/logout
```

As rotas `/api/usuarios/login`, `/api/usuarios/me` e `/api/usuarios/logout` também estão disponíveis para compatibilidade.

## 8. Rotas disponíveis

### Autenticação

| Método | Rota | Acesso | Função |
|---|---|---|---|
| POST | `/api/auth/login` | Público | Realiza o login |
| GET | `/api/auth/me` | Autenticado | Retorna o usuário autenticado |
| POST | `/api/auth/logout` | Autenticado | Encerra a sessão |
| POST | `/api/usuarios/primeiro-gerente` | Local | Cria o primeiro gerente |

### Usuários

| Método | Rota | Acesso | Função |
|---|---|---|---|
| GET | `/api/usuarios` | Gerente | Lista os usuários |
| GET | `/api/usuarios/:id` | Gerente | Busca um usuário pelo ID |
| POST | `/api/usuarios` | Gerente | Cadastra um usuário |
| PUT | `/api/usuarios/:id` | Gerente | Atualiza um usuário |
| PATCH | `/api/usuarios/:id/inativar` | Gerente | Inativa um usuário |
| PATCH | `/api/usuarios/:id/reativar` | Gerente | Reativa um usuário |

### Clientes

| Método | Rota | Acesso | Função |
|---|---|---|---|
| GET | `/api/clientes` | Autenticado | Lista os clientes |
| GET | `/api/clientes/:id` | Autenticado | Busca um cliente |
| GET | `/api/clientes/:id/historico` | Autenticado | Consulta o histórico de compras |
| POST | `/api/clientes` | Autenticado | Cadastra um cliente |
| PUT | `/api/clientes/:id` | Autenticado | Atualiza um cliente |
| PATCH | `/api/clientes/:id/inativar` | Gerente | Inativa um cliente |
| PATCH | `/api/clientes/:id/reativar` | Gerente | Reativa um cliente |

### Produtos

| Método | Rota | Acesso | Função |
|---|---|---|---|
| GET | `/api/produtos` | Autenticado | Lista e pesquisa produtos |
| GET | `/api/produtos/:id` | Autenticado | Busca um produto |
| POST | `/api/produtos` | Gerente | Cadastra um produto |
| PUT | `/api/produtos/:id` | Gerente | Atualiza um produto |
| PATCH | `/api/produtos/:id/inativar` | Gerente | Inativa um produto |
| PATCH | `/api/produtos/:id/reativar` | Gerente | Reativa um produto |

### Vendas

| Método | Rota | Acesso | Função |
|---|---|---|---|
| POST | `/api/vendas/simular` | Autenticado | Simula o cálculo de uma venda |
| GET | `/api/vendas` | Autenticado | Lista as vendas |
| GET | `/api/vendas/:id` | Autenticado | Busca uma venda |
| GET | `/api/vendas/:id/itens` | Autenticado | Lista os itens de uma venda |
| POST | `/api/vendas` | Autenticado | Finaliza uma venda |
| PATCH | `/api/vendas/:id/cancelar` | Gerente | Cancela uma venda |
| GET | `/api/vendas/resumo-diario` | Gerente | Retorna o resumo diário |

### Itens de venda

| Método | Rota | Acesso | Função |
|---|---|---|---|
| GET | `/api/itens-venda` | Autenticado | Lista os itens registrados |
| GET | `/api/itens-venda/:id` | Autenticado | Busca um item pelo ID |

Os itens de venda são gerados durante a finalização da venda. Não existem rotas públicas para alterar ou excluir diretamente um item financeiro.

## 9. Exemplos para o Thunder Client

### Cadastrar um cliente

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

### Cadastrar um produto

Essa rota exige um usuário com perfil `GERENTE`.

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

### Simular uma venda

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

A simulação calcula os valores, mas não registra a venda e não altera o estoque.

### Finalizar uma venda

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

A venda é registrada em uma transação do banco de dados. O sistema cria a venda, registra os itens e diminui o estoque. Se alguma operação falhar, todas as alterações são canceladas.

## 10. Regras de negócio implementadas

| Regra | Funcionamento |
|---|---|
| Autenticação | As rotas protegidas exigem um token JWT válido |
| Usuário ativo | Usuários inativos não podem entrar no sistema |
| Perfis | O sistema possui os perfis `CAIXA` e `GERENTE` |
| Permissões | Operações administrativas são restritas ao gerente |
| Proteção da senha | A senha é transformada em hash com bcrypt |
| CPF | O CPF do cliente tem formato e dígitos verificadores validados |
| Código do produto | O código é obrigatório e não pode ser repetido |
| Preço | O preço deve ser maior que zero |
| Estoque | O estoque não pode ser negativo |
| Produto ativo | Produtos inativos não podem ser utilizados em novas vendas |
| Preço esperado | O preço enviado deve corresponder ao preço atual do produto |
| Estoque suficiente | A quantidade vendida não pode superar o estoque disponível |
| Cliente opcional | Uma venda pode ser realizada sem cliente cadastrado |
| Desconto | O percentual deve estar entre 0% e 100% |
| Desconto acima de 10% | Exige autorização de gerente quando a venda é realizada por um caixa |
| Desconto de 100% | Exige confirmação explícita do total igual a zero |
| Transação | Venda, itens e alteração do estoque são processados em conjunto |
| Cancelamento | Somente um gerente pode cancelar uma venda |
| Motivo | O cancelamento exige uma justificativa |
| Reposição | O cancelamento devolve ao estoque as quantidades vendidas |
| Preservação do histórico | Cadastros são inativados em vez de excluídos fisicamente |
| Registros financeiros | Vendas e itens não podem ser editados ou apagados diretamente |

## 11. Organização dos arquivos

| Caminho | Responsabilidade |
|---|---|
| `src/config/database.ts` | Configuração do pool MySQL e suporte às transações |
| `src/types/index.ts` | Interfaces e tipos utilizados pelo sistema |
| `src/models` | Métodos responsáveis pelo acesso ao banco de dados |
| `src/controllers` | Validações, respostas HTTP e regras de negócio |
| `src/routes` | Definição das rotas e permissões |
| `src/middleware/authMiddleware.ts` | Autenticação JWT e controle de acesso |
| `src/scripts/verificarBanco.ts` | Verificação da conexão e das tabelas |
| `src/scripts/criarGerente.ts` | Criação inicial de um gerente |
| `src/server.ts` | Configuração e inicialização do servidor |
| `sql/banco.sql` | Script de criação do banco de dados |
| `docs/REQUISITOS.md` | Requisitos funcionais, não funcionais e regras de negócio |
| `tests` | Testes automatizados do projeto |

## 12. Models

Os Models realizam a comunicação direta com o MySQL.

Entre os métodos implementados estão:

| Método | Função |
|---|---|
| `create` | Cadastra um novo registro |
| `findById` | Busca um registro pelo ID |
| `findAll` | Retorna uma lista de registros |
| `update` | Atualiza um cadastro |
| `setAtivo` | Inativa ou reativa um cadastro |
| `findByEmail` | Busca um usuário pelo e-mail |
| `findByCpf` | Busca um cliente pelo CPF |
| `findByCodigo` | Busca um produto pelo código |
| `findByClienteId` | Busca vendas de um cliente |
| `findByVendaId` | Busca itens de uma venda |

Os valores recebidos são enviados ao MySQL com placeholders `?`, reduzindo o risco de injeção de SQL.

Campos `DECIMAL` podem ser retornados pelo MySQL2 como texto, por exemplo `"50.00"`. Campos `BOOLEAN` podem ser retornados como `0` ou `1`.

## 13. Códigos de resposta HTTP

| Status | Significado |
|---|---|
| `200 OK` | Consulta ou alteração realizada |
| `201 Created` | Cadastro criado |
| `400 Bad Request` | Dados inválidos ou JSON incorreto |
| `401 Unauthorized` | Token ausente, inválido ou expirado |
| `403 Forbidden` | Usuário sem permissão |
| `404 Not Found` | Registro ou rota não encontrada |
| `409 Conflict` | Conflito de dados, estoque ou registro duplicado |
| `422 Unprocessable Entity` | Regra de negócio não atendida |
| `500 Internal Server Error` | Erro interno não esperado |

## 14. Erros comuns

| Erro | Correção |
|---|---|
| `tsx não encontrado` | Execute `npm ci --include=dev` |
| `package.json não encontrado` | Entre na pasta correta do projeto |
| `Access denied / using password: NO` | Preencha `DB_PASSWORD` no `.env` |
| `Access denied / using password: YES` | Confira usuário, senha, host e porta |
| `Unknown database` | Crie o banco e confira `DB_NAME` |
| `ECONNREFUSED` | Confira se o serviço MySQL está iniciado |
| `JWT_SECRET ausente` | Adicione uma chave de pelo menos 32 caracteres ao `.env` |
| `Token não informado` | Configure o Bearer Token no Thunder Client |
| `EADDRINUSE` | Encerre o servidor anterior ou altere `PORT` |
| `Cannot read properties of undefined` | Confira se `express.json()` está configurado e se o Body está em JSON |
| `Duplicate entry` | Utilize outro CPF, e-mail ou código |
| `403 Forbidden` | Entre com um usuário gerente para acessar a operação |
| `409 Conflict` | Confira preço, estoque ou dados duplicados |

Depois de alterar o `.env`, salve o arquivo, encerre o servidor com `Ctrl+C` e execute novamente:

```bash
npm run dev
```

## 15. Compilação e testes

Para verificar a compilação TypeScript:

```bash
npm run build
```

Para executar os testes automatizados:

```bash
npm test
```

Para executar a versão compilada:

```bash
npm run build
npm start
```

Os testes automatizados não substituem os testes de integração com o banco de dados. A conexão real deve ser verificada com:

```bash
npm run check:db
npm run dev
```

Também é necessário testar as rotas pelo Thunder Client.

## 16. Envio para o GitHub

Antes de enviar, confira os arquivos modificados:

```bash
git status
```

Adicione os arquivos do projeto:

```bash
git add .
```

Crie o commit:

```bash
git commit -m "Implementa controllers, rotas e regras da Sprint 3"
```

Envie para o GitHub:

```bash
git push origin master
```

Caso a branch principal do seu repositório seja `main`, utilize:

```bash
git push origin main
```

Não envie:

- `.env`
- `node_modules`
- senhas reais
- tokens JWT
- arquivos temporários do editor
