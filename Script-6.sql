-- 1. Tabela de Clientes
CREATE TABLE tb_clientes (
    id_cliente SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20)
);

-- 2. Tabela de Veículos
CREATE TABLE tb_veiculos (
    id_veiculo SERIAL PRIMARY KEY,
    id_cliente INT REFERENCES tb_clientes(id_cliente),
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    ano INT NOT NULL,
    motorizacao VARCHAR(20)
);

-- 3. Tabela de Catálogo de Peças/Upgrades
CREATE TABLE tb_pecas_upgrades (
    id_peca SERIAL PRIMARY KEY,
    nome_peca VARCHAR(100) NOT NULL,
    categoria VARCHAR(50),
    preco DECIMAL(10, 2) NOT NULL
);

-- 4. Tabela de Ordens de Serviço 
CREATE TABLE tb_ordem_servico (
    id_os SERIAL PRIMARY KEY,
    id_veiculo INT REFERENCES tb_veiculos(id_veiculo),
    data_servico DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Concluído'
);

-- 5. Tabela Associativa (Itens da Ordem de Serviço)
CREATE TABLE tb_itens_os (
    id_item SERIAL PRIMARY KEY,
    id_os INT REFERENCES tb_ordem_servico(id_os),
    id_peca INT REFERENCES tb_pecas_upgrades(id_peca),
    quantidade INT DEFAULT 1
);
-- Inserindo Clientes
INSERT INTO tb_clientes (nome, telefone) VALUES 
('Lucas Mendes', '83999991111'),
('Mariana Costa', '83988882222');

-- Inserindo Veículos
INSERT INTO tb_veiculos (id_cliente, marca, modelo, ano, motorizacao) VALUES 
(1, 'Volkswagen', 'Polo Sedan', 2008, '1.6'),
(2, 'Honda', 'Civic', 2015, '2.0');

-- Inserindo Peças de Performance
INSERT INTO tb_pecas_upgrades (nome_peca, categoria, preco) VALUES 
('Filtro de Ar Esportivo (Intake)', 'Admissão', 850.00),
('Downpipe em Inox', 'Escapamento', 1200.00),
('Difusor de Escapamento com Controle', 'Escapamento', 900.00),
('Remap Stage 2', 'Eletrônica', 1500.00),
('Kit Turbocompressor Padaria', 'Sobrealimentação', 4500.00);

-- Criando uma Ordem de Serviço para o Polo 2008
INSERT INTO tb_ordem_servico (id_veiculo, data_servico) VALUES (1, '2026-05-20');

-- Adicionando os upgrades na OS do Polo (Intake, Downpipe, Difusor e Stage 2)
INSERT INTO tb_itens_os (id_os, id_peca, quantidade) VALUES 
(1, 1, 1), -- Filtro
(1, 2, 1), -- Downpipe
(1, 3, 1), -- Difusor
(1, 4, 1); -- Stage 2

CREATE OR REPLACE VIEW vw_relatorio_analise_upgrades AS
SELECT 
    os.id_os AS numero_ordem,
    os.data_servico,
    c.nome AS cliente,
    v.marca || ' ' || v.modelo || ' (' || v.ano || ')' AS veiculo_completo,
    v.motorizacao,
    p.nome_peca AS upgrade_instalado,
    p.categoria AS categoria_upgrade,
    i.quantidade,
    p.preco AS valor_unitario,
    (i.quantidade * p.preco) AS valor_total_item
FROM tb_ordem_servico os
INNER JOIN tb_clientes c ON id_cliente = c.id_cliente
INNER JOIN tb_veiculos v ON os.id_veiculo = v.id_veiculo
INNER JOIN tb_itens_os i ON os.id_os = i.id_os
INNER JOIN tb_pecas_upgrades p ON i.id_peca = p.id_peca;

SELECT * FROM vw_relatorio_analise_upgrades 
WHERE veiculo_completo LIKE '%Polo Sedan (2008)%';