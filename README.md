# MS² Vestuário: Sprint 2

Dupla: Lucas Bayão e Pedro Henrique.

Entrega restrita a setup do servidor, configuração MySQL, Interfaces/Types e Models com create, findById e findAll, conforme a imagem enviada. Requisitos funcionais, não funcionais e regras de negócio do PDF estão em docs/REQUISITOS.md como referência do projeto. As funcionalidades da próxima sprint serão desenvolvidas depois.

## 1. Instalar e configurar

Extraia este ZIP em uma pasta nova, para não misturar os arquivos com o backend anterior. Abra a pasta backend no terminal.

```bash
npm ci --include=dev
```

Este comando instala Express, MySQL2, dotenv, TypeScript e tsx. O pacote inclui package-lock.json; node_modules é criada na instalação. A verificação desta entrega usou Node.js 24.19.0.

Abra o arquivo .env incluído e configure os MESMOS dados da conexão do MySQL Workbench:

```env
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD="SUA_SENHA_REAL_DO_MYSQL"
DB_NAME=ms2_vestuario
PORT=3000
```

A senha no arquivo entregue está vazia porque a senha real da sua máquina não foi informada. Preencha-a se seu MySQL exige senha. Não é a senha do GitHub nem uma senha de funcionário. Só deixe vazio se a conexão aceitar senha vazia. Este projeto não precisa de JWT_SECRET.

Se o banco e as cinco tabelas já existem, use-os. Caso ainda não existam, execute sql/banco.sql no Workbench. O SQL preserva a estrutura que você forneceu e é de primeira criação: não execute novamente sobre tabelas existentes. Não há DROP nem limpeza de dados.

## 2. Verificar banco e iniciar

```bash
npm run check:db
npm run dev
```

O primeiro comando é somente leitura: verifica conexão e presença das cinco tabelas. Se houver erro, corrija antes de iniciar. O segundo inicia o servidor. A saída esperada quando a conexão funciona é:

```text
MySQL conectado com sucesso!
Backend Sprint 2 em http://localhost:3000/status
```

Abra http://localhost:3000/status no navegador. Essa rota confirma que o servidor responde; a conexão com MySQL é verificada na inicialização. Não há rotas de cadastro/login nesta entrega.

Erros comuns:

| Erro | Correção |
|---|---|
| tsx não encontrado | Execute npm ci --include=dev dentro de backend. |
| package.json não encontrado | Entre na pasta backend antes de executar npm. |
| Access denied / using password: NO | A senha está vazia ou não está sendo carregada. Confira backend/.env. |
| Access denied / using password: YES | Confira usuário/senha e se host/porta são os mesmos do Workbench. |
| Unknown database | Confira DB_NAME e se o banco existe naquela conexão. |
| ECONNREFUSED | Confira serviço MySQL, host e porta. |
| Porta 3000 ocupada | Encerre o servidor anterior ou altere PORT. |

Depois de alterar .env, salve, pressione Ctrl+C no terminal e execute npm run dev novamente.

## 3. Arquivos e métodos

| Arquivo | Responsabilidade |
|---|---|
| src/config/database.ts | Pool MySQL, teste de conexão e suporte a transações na mesma conexão. |
| src/types/index.ts | Tipos das cinco tabelas e tipos dos dados de entrada dos models. |
| src/models/UsuarioModel.ts | create, findById, findAll, update, inactivate, findByEmail. |
| src/models/ClienteModel.ts | create, findById, findAll, update, inactivate, findByCpf. |
| src/models/ProdutoModel.ts | create, findById, findAll, update, inactivate, findByCodigo. |
| src/models/VendaModel.ts | create, findById, findAll, findByClienteId. |
| src/models/ItemVendaModel.ts | create, findById, findAll, findByVendaId. |
| src/server.ts | Inicialização e rota de verificação /status. |
| src/scripts/verificarBanco.ts | Teste somente leitura da conexão e das tabelas. |
| sql/banco.sql | SQL fornecido, para primeira criação do banco. |
| docs/REQUISITOS.md | 18 RF, 12 RNF e 18 RN extraídos do PDF, com indicação do escopo entregue. |
| tests/models.test.cjs | Testes isolados da camada de dados e da gestão de transações. |

Cada model tem seus próprios métodos explícitos. O nome de tabela e os campos são fixos no código, e os valores são passados com placeholders SQL (?).

create retorna o ID criado; findById retorna um registro ou null; findAll retorna uma lista. update exige todos os campos obrigatórios do tipo de entrada, não é atualização parcial. inactivate preserva histórico. Não existem exclusões físicas de cadastros nem edição/exclusão financeira de vendas e itens.

DECIMAL retorna string, como '50.00', e BOOLEAN retorna 0 ou 1. senha_hash recebe um hash pronto, nunca uma senha legível. O desenvolvimento da autenticação, geração do hash, validação de CPF, permissões e cálculos completos não integra esta entrega.

## 4. Como usar os models em código TypeScript

Os métodos são chamados por código, não diretamente no navegador. Exemplo somente leitura, dentro de uma função async:

```ts
import { ProdutoModel } from './models/ProdutoModel';

const produtos = await ProdutoModel.findAll();
const produto = await ProdutoModel.findById(1);
```

Exemplo de cadastro em uma base de teste, também dentro de uma função async:

```ts
const id = await ProdutoModel.create({
  codigo: 'CAM-PRETA-M',
  nome: 'Camiseta preta',
  tamanho: 'M',
  cor: 'Preta',
  preco: '50.00',
  estoque: 5
});
```

O código acima é exemplo de chamada interna, não um comando de terminal. Não execute repetidamente sem trocar o código do produto, pois ele é único.

VendaModel.create e ItemVendaModel.create exigem um argumento conexao (PoolConnection). Essa decisão permite que o fluxo posterior use withTransaction e compartilhe a mesma conexão entre cabeçalho, itens e estoque. A função withTransaction não valida o conteúdo de uma venda nem implementa sua finalização sozinha.

## 5. GitHub

O repositório remoto deve ser o da dupla. Nenhuma conta foi acessada por esta entrega. Para usar um repositório já existente, coloque esta pasta backend nele, mantendo o .gitignore, e revise as mudanças:

```bash
git status
git add backend
git commit -m "Implementa setup, types e models da Sprint 2"
git push
```

Execute esses comandos na raiz do repositório existente, um nível acima de backend. Se .env já estiver sendo rastreado naquele repositório, o .gitignore não remove o rastreamento anterior. Confira o que será enviado. A pasta node_modules e o .env local não devem estar no GitHub.

Se ainda não tiver repositório, crie um vazio no GitHub e faça o clone usando a URL exibida na sua página; depois copie backend para o clone e use os comandos acima. Não há uma URL de repositório inventada neste pacote.

## 6. Validação

```bash
npm run build
npm test
```

A compilação e os testes isolados foram executados no ambiente de revisão. Os testes usam conexões simuladas: comprovam o contrato dos métodos e chamadas de transação, mas não comprovam execução SQL, autenticação MySQL ou locks reais. A conexão funcional com seu MySQL precisa ser demonstrada com npm run check:db e npm run dev na sua máquina.

Para executar a versão compilada:

```bash
npm run build
npm start
```

## 7. O que mostrar na entrega

Repositório da dupla no GitHub; dependências instaladas; configuração do .env sem expor a senha; saída de npm run check:db; servidor respondendo em /status; interfaces das cinco entidades; métodos create, findById e findAll nos cinco models.

A presença de um método create em VendaModel não significa que o fluxo de venda esteja pronto. A entrega atual é a camada de acesso aos dados solicitada pela Sprint 2.
