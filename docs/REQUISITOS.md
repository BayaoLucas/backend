# Requisitos de referência do projeto

Este backend entrega apenas a Sprint 2. A lista abaixo documenta os requisitos do projeto completo; não significa que todos estejam implementados. Os IDs e as marcações são os do PDF: E = explícito conforme classificação do documento, D = derivado, P = proposta. A revisão usa o PDF fornecido como referência, sem afirmar ter conferido o enunciado original citado nele.

As propostas, incluindo o limite de 10% de desconto, permanecem a validar com o professor. Esta entrega não implementa login, permissões, descontos, carrinho, cancelamento ou telas.

## Requisitos funcionais

### RF01 | Autenticar usuário [E/D]

Permitir login com e-mail e senha e encerrar a sessão. Aceitação: Usuário ativo entra; credenciais inválidas não concedem acesso.

### RF02 | Controlar acessos [E]

Distinguir caixa e gerente e autorizar ações na API. Aceitação: Caixa recebe recusa ao tentar cancelar venda sem autorização.

### RF03 | Cadastrar produtos [E/P]

Registrar código, nome, descrição e preço; tamanho, cor e estoque conforme proposta. Aceitação: Produto válido é salvo e pode ser encontrado pelo código.

### RF04 | Consultar catálogo [E]

Buscar por código, nome ou descrição; mostrar preço e situação. Aceitação: Código exato retorna a peça correta para o caixa.

### RF05 | Manter produtos [D/P]

Editar cadastro e inativar produtos sem apagar o histórico. Aceitação: Novo preço vale para novas vendas; venda antiga mantém seu preço.

### RF06 | Cadastrar clientes [E/P]

Registrar nome e CPF; telefone e e-mail são opcionais na proposta. Aceitação: Cliente válido é salvo uma única vez por CPF.

### RF07 | Consultar e manter clientes [D/P]

Buscar por nome/CPF, corrigir dados e inativar cadastros. Aceitação: Busca encontra o cliente e edição respeita CPF único.

### RF08 | Consultar histórico do cliente [E]

Exibir vendas, datas, peças, quantidades, totais e cancelamentos do cliente selecionado. Aceitação: Duas vendas vinculadas aparecem no perfil correto.

### RF09 | Montar carrinho [E/D]

Adicionar e remover produtos e alterar quantidades antes da finalização. Aceitação: Duas unidades alteram subtotal corretamente.

### RF10 | Identificar a venda [E/P]

Associar operador autenticado e cliente selecionado, se houver. Aceitação: Operador vem da sessão; cliente escolhido fica vinculado.

### RF11 | Calcular valores [E]

Calcular subtotal, desconto e total automaticamente. Aceitação: Subtotal R$ 200,00 com 10% resulta em R$ 180,00.

### RF12 | Aplicar descontos [E/P]

Validar a alçada do operador e registrar autorização gerencial para desconto acima do limite. Aceitação: Caixa com 15% exige gerente; limite exato é configurável.

### RF13 | Finalizar venda [E/P]

Salvar venda e itens, forma de pagamento e data; atualizar estoque em uma transação. Aceitação: Sucesso persiste tudo; falha não deixa venda parcial.

### RF14 | Consultar vendas [D]

Listar vendas por período e permitir visualizar itens e situação. Aceitação: Consulta recupera venda completa sem recalcular pelo preço atual.

### RF15 | Cancelar venda [E/P]

Permitir cancelamento integral somente por gerente; guardar motivo e responsável. Aceitação: Venda cancelada permanece registrada e não pode ser cancelada novamente.

### RF16 | Controlar estoque básico [P]

Informar estoque no cadastro, baixar na venda e devolver no cancelamento integral. Aceitação: Venda de 2 peças muda estoque de 5 para 3; cancelamento restaura 5.

### RF17 | Manter usuários [D/P]

Gerente cadastra/inativa operadores e atribui perfis; primeiro gerente criado no setup. Aceitação: Caixa não altera seu próprio perfil para gerente.

### RF18 | Exibir resumo diário [D/P]

Mostrar vendas concluídas, canceladas e totais por pagamento para conferência. Aceitação: Canceladas ficam separadas e não entram no faturamento líquido.

## Requisitos não funcionais

### RNF01 | Aplicação web [E]

Acesso pelo navegador dos computadores dos caixas. Verificação: Executar fluxo completo nos navegadores disponíveis na escola.

### RNF02 | Centralização [E]

Banco único acessado pelo backend; evitar dados isolados por computador. Verificação: Cadastro feito no caixa A é recuperado no caixa B após atualização.

### RNF03 | Atualização [E/P]

Confirmar operações somente após persistência; reconsultar dados nas buscas e na finalização. Verificação: Segundo caixa lê o estoque persistido antes de vender; não usa cache como verdade.

### RNF04 | Usabilidade [E]

Telas claras, mensagens compreensíveis e campos identificados. Verificação: Operador percorre login, cliente e venda sem manipular código.

### RNF05 | Desempenho [E/P]

Meta proposta: 95% das buscas em até 1 s, com 1.000 produtos e 2 caixas na rede local. Verificação: Medir 100 buscas nesse ambiente; pelo menos 95 atendem à meta.

### RNF06 | Segurança [D]

Guardar hash de senha, validar sessão/perfil no servidor e parametrizar SQL. Verificação: Banco não contém senha legível; endpoint protegido recusa usuário sem sessão.

### RNF07 | Integridade [E/D]

Aplicar PK, FK, UNIQUE, CHECK e transações aos registros relacionados. Verificação: CPF duplicado é recusado e referência inexistente não é salva.

### RNF08 | Configuração [E]

Credenciais do banco em .env; repositório com .env.example sem segredos. Verificação: Repositório não expõe senhas nem inclui node_modules.

### RNF09 | Manutenibilidade [E]

Separar types, models, controllers e routes; frontend por páginas e componentes. Verificação: Estrutura segue as entregas das Sprints 2 a 4.

### RNF10 | Confiabilidade [D]

Tratar indisponibilidade sem confirmar venda não persistida; permitir correção e nova tentativa. Verificação: Erro no banco apresenta falha e transação é revertida.

### RNF11 | Rastreabilidade [D/P]

Guardar operador, horário e responsáveis por autorização/cancelamento. Verificação: Detalhe de venda permite identificar quem executou cada ação.

### RNF12 | Reprodução e recuperação [E/P]

Documentar execução local e propor backup diário com teste de restauração. Verificação: Outra máquina configura pelo README; backup é restaurado em banco de teste.

## Regras de negócio

### RN01 | CPF único [E/D]

Normalizar CPF para 11 dígitos; validar dígitos verificadores na API e impedir duplicação no banco. Na edição, desconsiderar o próprio registro. Onde garantir: clientes.cpf UNIQUE + validação da API.

### RN02 | Código único [D/P]

Remover espaços externos e normalizar código; cada variação vendável tem código próprio. Não cadastrar dois produtos com o mesmo código. Onde garantir: produtos.codigo UNIQUE + API.

### RN03 | Campos obrigatórios [D/P]

Produto exige código, nome e preço positivo; cliente exige nome e CPF na proposta; usuário exige nome, e-mail, senha e perfil válido. Onde garantir: NOT NULL/CHECK + API.

### RN04 | Quantidades e estoque [P]

Quantidade deve ser inteira positiva; estoque inteiro não negativo; impedir venda acima da disponibilidade. Onde garantir: CHECK + validação transacional da API.

### RN05 | Produto elegível [D/P]

Apenas produto ativo pode entrar/finalizar carrinho. Ao finalizar, revalidar disponibilidade e preço vigente. Se o preço mudou, informar e pedir confirmação antes de concluir. Onde garantir: API.

### RN06 | Cliente e operador [E/P]

Venda pertence ao operador autenticado e ativo. Cliente selecionado deve estar ativo; venda sem identificação é permitida como proposta. Onde garantir: FK + API.

### RN07 | Venda não vazia [D/P]

Finalizar somente com ao menos um item válido e forma de pagamento aceita. Unificar linhas do mesmo produto, somando quantidades. Onde garantir: UNIQUE dos itens + API.

### RN08 | Subtotal [E/D]

Subtotal = soma de quantidade × preço unitário de cada item; preço deve vir do banco e ser congelado no item. Nunca confiar no total enviado pelo navegador. Onde garantir: Coluna gerada por item + API.

### RN09 | Desconto e arredondamento [E/P]

Um desconto percentual por venda, de 0 a 100. Desconto em reais = subtotal × percentual / 100, arredondado em centavos; total = subtotal - desconto. Onde garantir: CHECK e colunas geradas + API.

### RN10 | Alçada de desconto [E/P]

Proposta: caixa aplica até 10%, inclusive; acima disso exige gerente ativo autenticado. Gerente pode aplicar até 100%, com confirmação explícita para total zero. O limite deve ser validado com o professor. Onde garantir: Configuração do backend + API.

### RN11 | Autorização verificável [D/P]

Registrar autorizador nos descontos acima da alçada. Se o operador for gerente, registrar o próprio usuário. Não aceitar um ID de gerente enviado pelo caixa como prova de autorização. Onde garantir: FK + autenticação gerencial na API.

### RN12 | Finalização atômica [D/P]

Gravar cabeçalho, itens e baixa de estoque na mesma conexão e transação. Validar estoque com bloqueio das linhas de produto em ordem de ID; qualquer falha causa rollback. Onde garantir: Transação InnoDB + API.

### RN13 | Imutabilidade financeira [D/P]

Depois da conclusão, não editar itens, preços, cliente ou desconto. Corrigir venda por cancelamento autorizado e nova venda. Onde garantir: API.

### RN14 | Cancelamento gerencial [E/P]

Somente gerente ativo pode cancelar venda concluída; motivo obrigatório. Registrar gerente/data e preservar venda e itens. Onde garantir: FK + API.

### RN15 | Reversão única [P]

Cancelamento integral devolve quantidades ao estoque uma única vez, na mesma transação da mudança de status. Bloquear a venda durante a operação. Devolução parcial fica fora da versão inicial. Onde garantir: Transação + API.

### RN16 | Histórico preservado [D/P]

Não excluir fisicamente cadastros referenciados por vendas. Inativar cadastros e manter CPF/código reservados; reativar em vez de duplicar. Onde garantir: FK sem cascata + API.

### RN17 | Resumo financeiro [D/P]

Contabilizar apenas vendas concluídas no faturamento. Exibir canceladas separadamente; resumo diário não equivale a módulo de abertura/sangria/fechamento de caixa. Onde garantir: Consulta filtrada na API.

### RN18 | Permissões de manutenção [E/P]

Proposta: gerente altera catálogo, estoque e usuários; caixa cadastra/consulta clientes e registra vendas. Cliente inativo só pode ser reativado pelo gerente. Onde garantir: API por perfil.

## Aplicação nesta Sprint 2

| Entrega | Relação com o PDF | Situação |
|---|---|---|
| Conexão MySQL única no backend | RNF02, RNF08 | Implementada em config/database.ts e configurada por .env. Exige credenciais locais válidas. |
| Types para cinco entidades | RNF09 e dicionário de dados | Implementados em types/index.ts. |
| Models de usuários, clientes e produtos | Base para RF03-RF07 e RF17 | create, findById, findAll, update e inactivate. Validações da aplicação e permissões ficam para outra etapa. |
| Models de vendas e itens | Base para RF08, RF10-RF14 | Métodos de persistência e consulta, sem fluxo HTTP de finalização. |
| Restrições e colunas geradas | RNF07; partes de RN01-RN04 e RN09 | Definidas no SQL fornecido. Seu funcionamento deve ser conferido no MySQL instalado. CPF com dígitos verificadores ainda não é validado na aplicação. |
| Conexão compartilhada para transações | Base para RN12 | withTransaction disponível; o fluxo completo de venda com validações e estoque não foi implementado. |
| Inativação e preço histórico | Base para RN13/RN16 e RF05/RF08 | Cadastros podem ser inativados; itens armazenam nome/código/preço; não há update/delete de venda ou item. |
| Documentação e configuração | RNF08, parte de RNF12 | README, .env.example e .gitignore incluídos. Backup/restauração não executados. |
| GitHub | Checklist da imagem | Instruções incluídas. Nenhum repositório remoto foi criado ou atualizado nesta entrega. |

Tipos não validam requisições em tempo de execução. Os models são uma camada interna: eles recebem dados preparados pelo código chamador. Os campos usuario_id, autorizador_desconto_id, subtotal e senha_hash não devem futuramente ser aceitos de um navegador sem validação apropriada.

As demais funcionalidades e regras estão apenas documentadas como referência, conforme o pedido de fazer a Sprint 3 depois.
