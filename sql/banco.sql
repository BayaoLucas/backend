-- Estrutura fornecida pelo usuário. Execute somente na primeira criação.
CREATE DATABASE ms2_vestuario CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ms2_vestuario;

CREATE TABLE usuarios (
 id INT AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(120) NOT NULL,
 email VARCHAR(150) NOT NULL,
 senha_hash VARCHAR(255) NOT NULL,
 perfil VARCHAR(10) NOT NULL,
 ativo BOOLEAN NOT NULL DEFAULT TRUE,
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT uq_usuarios_email UNIQUE (email),
 CONSTRAINT ck_usuarios_nome CHECK (CHAR_LENGTH(TRIM(nome)) > 0),
 CONSTRAINT ck_usuarios_perfil CHECK (perfil IN ('CAIXA','GERENTE')),
 CONSTRAINT ck_usuarios_ativo CHECK (ativo IN (0,1))
) ENGINE=InnoDB;

CREATE TABLE clientes (
 id INT AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(120) NOT NULL,
 cpf CHAR(11) NOT NULL,
 telefone VARCHAR(20),
 email VARCHAR(150),
 ativo BOOLEAN NOT NULL DEFAULT TRUE,
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT uq_clientes_cpf UNIQUE (cpf),
 CONSTRAINT ck_clientes_nome CHECK (CHAR_LENGTH(TRIM(nome)) > 0),
 CONSTRAINT ck_clientes_cpf CHECK (cpf REGEXP '^[0-9]{11}$'),
 CONSTRAINT ck_clientes_ativo CHECK (ativo IN (0,1)),
 INDEX ix_clientes_nome (nome)
) ENGINE=InnoDB;

CREATE TABLE produtos (
 id INT AUTO_INCREMENT PRIMARY KEY,
 codigo VARCHAR(50) NOT NULL,
 nome VARCHAR(120) NOT NULL,
 descricao TEXT,
 tamanho VARCHAR(20),
 cor VARCHAR(40),
 preco DECIMAL(10,2) NOT NULL,
 estoque INT NOT NULL DEFAULT 0,
 ativo BOOLEAN NOT NULL DEFAULT TRUE,
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT uq_produtos_codigo UNIQUE (codigo),
 CONSTRAINT ck_produtos_codigo CHECK (CHAR_LENGTH(TRIM(codigo)) > 0),
 CONSTRAINT ck_produtos_nome CHECK (CHAR_LENGTH(TRIM(nome)) > 0),
 CONSTRAINT ck_produtos_preco CHECK (preco > 0),
 CONSTRAINT ck_produtos_estoque CHECK (estoque >= 0),
 CONSTRAINT ck_produtos_ativo CHECK (ativo IN (0,1)),
 INDEX ix_produtos_nome (nome)
) ENGINE=InnoDB;

CREATE TABLE vendas (
 id INT AUTO_INCREMENT PRIMARY KEY,
 cliente_id INT,
 usuario_id INT NOT NULL,
 autorizador_desconto_id INT,
 cancelado_por_id INT,
 subtotal DECIMAL(12,2) NOT NULL,
 desconto_percentual DECIMAL(5,2) NOT NULL DEFAULT 0,
 desconto_valor DECIMAL(12,2) GENERATED ALWAYS AS (ROUND(subtotal * desconto_percentual / 100, 2)) STORED,
 total DECIMAL(12,2) GENERATED ALWAYS AS (subtotal - ROUND(subtotal * desconto_percentual / 100, 2)) STORED,
 forma_pagamento VARCHAR(10) NOT NULL,
 status VARCHAR(10) NOT NULL DEFAULT 'CONCLUIDA',
 realizada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 cancelada_em DATETIME,
 motivo_cancelamento VARCHAR(255),
 CONSTRAINT fk_vendas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
 CONSTRAINT fk_vendas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
 CONSTRAINT fk_vendas_autorizador FOREIGN KEY (autorizador_desconto_id) REFERENCES usuarios(id),
 CONSTRAINT fk_vendas_cancelador FOREIGN KEY (cancelado_por_id) REFERENCES usuarios(id),
 CONSTRAINT ck_vendas_subtotal CHECK (subtotal > 0),
 CONSTRAINT ck_vendas_desconto CHECK (desconto_percentual BETWEEN 0 AND 100),
 CONSTRAINT ck_vendas_pagamento CHECK (forma_pagamento IN ('DINHEIRO','PIX','DEBITO','CREDITO')),
 CONSTRAINT ck_vendas_status CHECK (status IN ('CONCLUIDA','CANCELADA')),
 INDEX ix_vendas_cliente_data (cliente_id, realizada_em),
 INDEX ix_vendas_usuario_data (usuario_id, realizada_em),
 INDEX ix_vendas_status_data (status, realizada_em)
) ENGINE=InnoDB;

CREATE TABLE itens_venda (
 id INT AUTO_INCREMENT PRIMARY KEY,
 venda_id INT NOT NULL,
 produto_id INT NOT NULL,
 codigo_produto VARCHAR(50) NOT NULL,
 nome_produto VARCHAR(120) NOT NULL,
 quantidade INT NOT NULL,
 preco_unitario DECIMAL(10,2) NOT NULL,
 total_item DECIMAL(12,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
 CONSTRAINT fk_itens_venda FOREIGN KEY (venda_id) REFERENCES vendas(id),
 CONSTRAINT fk_itens_produto FOREIGN KEY (produto_id) REFERENCES produtos(id),
 CONSTRAINT uq_itens_produto UNIQUE (venda_id, produto_id),
 CONSTRAINT ck_itens_quantidade CHECK (quantidade > 0),
 CONSTRAINT ck_itens_preco CHECK (preco_unitario > 0),
 CONSTRAINT ck_itens_codigo CHECK (CHAR_LENGTH(TRIM(codigo_produto)) > 0),
 CONSTRAINT ck_itens_nome CHECK (CHAR_LENGTH(TRIM(nome_produto)) > 0)
) ENGINE=InnoDB;
