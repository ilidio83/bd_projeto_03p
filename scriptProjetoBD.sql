
-- 1. CRIAÇÃO DOS AMBIENTES (SCHEMAS)
CREATE SCHEMA producao;
CREATE SCHEMA dw;


-- 2. AMBIENTE DE PRODUÇÃO (Tabelas e Dados)

SET search_path TO producao;

CREATE TABLE tb_clientes (
    id_cliente SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(15)
);

CREATE TABLE tb_veiculos (
    id_veiculo SERIAL PRIMARY KEY,
    id_cliente INT REFERENCES tb_clientes(id_cliente),
    marca VARCHAR(50),
    modelo VARCHAR(50),
    ano INT,
    motorizacao VARCHAR(20)
);

CREATE TABLE tb_pecas_upgrades (
    id_peca SERIAL PRIMARY KEY,
    nome_peca VARCHAR(100),
    categoria VARCHAR(50),
    preco DECIMAL(10,2)
);

CREATE TABLE tb_ordem_servico (
    id_os SERIAL PRIMARY KEY,
    id_veiculo INT REFERENCES tb_veiculos(id_veiculo),
    data_servico DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'Em Andamento'
);

CREATE TABLE tb_itens_os (
    id_item SERIAL PRIMARY KEY,
    id_os INT REFERENCES tb_ordem_servico(id_os),
    id_peca INT REFERENCES tb_pecas_upgrades(id_peca),
    quantidade INT
);

CREATE TABLE tb_log_precos (
    id_log SERIAL PRIMARY KEY,
    id_peca INT REFERENCES tb_pecas_upgrades(id_peca),
    preco_antigo DECIMAL(10,2),
    preco_novo DECIMAL(10,2),
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_banco VARCHAR(50) DEFAULT CURRENT_USER
);

-- Inserindo dados iniciais para testes
INSERT INTO tb_clientes (nome, telefone) VALUES ('Ilidio Neto', '83999999999');
INSERT INTO tb_veiculos (id_cliente, marca, modelo, ano, motorizacao) VALUES (1, 'Volkswagen', 'Polo', 2008, '1.6');
INSERT INTO tb_pecas_upgrades (nome_peca, categoria, preco) VALUES ('Filtro Esportivo Inflow', 'Intake', 350.00), ('Remap Stage 2', 'Eletrônica', 1200.00), ('Downpipe Inox', 'Escapamento', 900.00);
INSERT INTO tb_ordem_servico (id_veiculo, status) VALUES (1, 'Em Andamento');

-- OS 2 criada sem itens para testarmos o erro na Procedure depois
INSERT INTO tb_ordem_servico (id_veiculo, status) VALUES (1, 'Em Andamento'); 
INSERT INTO tb_itens_os (id_os, id_peca, quantidade) VALUES (1, 1, 1), (1, 2, 1);

-- 3. REGRAS DE NEGÓCIO DA PRODUÇÃO (View, Procedure e Trigger)
-- VIEW: Relatório analítico de vendas e instalações
CREATE OR REPLACE VIEW vw_relatorio_analise_upgrades AS
SELECT 
    os.id_os AS numero_ordem, os.data_servico, c.nome AS cliente,
    v.marca || ' ' || v.modelo || ' (' || v.ano || ')' AS veiculo_completo,
    p.nome_peca AS upgrade_instalado, p.categoria AS categoria_upgrade,
    i.quantidade, p.preco AS valor_unitario, (i.quantidade * p.preco) AS valor_total_item
FROM tb_ordem_servico os
INNER JOIN tb_veiculos v ON os.id_veiculo = v.id_veiculo
INNER JOIN tb_clientes c ON v.id_cliente = c.id_cliente
INNER JOIN tb_itens_os i ON os.id_os = i.id_os
INNER JOIN tb_pecas_upgrades p ON i.id_peca = p.id_peca;

-- PROCEDURE: Finalizar OS garantindo que ela não está vazia
CREATE OR REPLACE PROCEDURE sp_finalizar_os(p_id_os INT)
LANGUAGE plpgsql AS $$
DECLARE v_total_itens INT;
BEGIN
    SELECT COUNT(*) INTO v_total_itens FROM producao.tb_itens_os WHERE id_os = p_id_os;
    IF v_total_itens = 0 THEN
        RAISE EXCEPTION 'BLOQUEADO: A Ordem de Serviço % está vazia. Adicione um upgrade antes de finalizar.', p_id_os;
    END IF;
    UPDATE producao.tb_ordem_servico SET status = 'Finalizado' WHERE id_os = p_id_os;
END;
$$;

-- TRIGGER 1: Auditoria de mudança de preços
CREATE OR REPLACE FUNCTION fn_auditoria_preco() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.preco <> OLD.preco THEN
        INSERT INTO producao.tb_log_precos (id_peca, preco_antigo, preco_novo)
        VALUES (OLD.id_peca, OLD.preco, NEW.preco);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audita_preco
AFTER UPDATE OF preco ON producao.tb_pecas_upgrades
FOR EACH ROW EXECUTE FUNCTION fn_auditoria_preco();



-- 4. AMBIENTE DE HOMOLOGAÇÃO (Modelagem Dimensional - DW)
SET search_path TO dw;

CREATE TABLE dim_tempo (sk_tempo INT PRIMARY KEY, data_completa DATE);
CREATE TABLE dim_cliente (sk_cliente SERIAL PRIMARY KEY, id_cliente_nk INT, nome VARCHAR(100));
CREATE TABLE dim_veiculo (sk_veiculo SERIAL PRIMARY KEY, id_veiculo_nk INT, marca VARCHAR(50), modelo VARCHAR(50));
CREATE TABLE dim_peca (sk_peca SERIAL PRIMARY KEY, id_peca_nk INT, nome_peca VARCHAR(100), categoria VARCHAR(50));

CREATE TABLE fato_vendas_upgrades (
    id_fato SERIAL PRIMARY KEY,
    sk_tempo INT REFERENCES dim_tempo(sk_tempo),
    sk_cliente INT REFERENCES dim_cliente(sk_cliente),
    sk_veiculo INT REFERENCES dim_veiculo(sk_veiculo),
    sk_peca INT REFERENCES dim_peca(sk_peca),
    quantidade INT,
    valor_total DECIMAL(10,2)
);


-- 5. INTEGRAÇÃO (Trigger de Sincronização DW)
-- TRIGGER 2: Alimenta a dimensão Cliente automaticamente
CREATE OR REPLACE FUNCTION producao.fn_sincroniza_cliente_dw() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO dw.dim_cliente (id_cliente_nk, nome) VALUES (NEW.id_cliente, NEW.nome);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_cliente_dw
AFTER INSERT ON producao.tb_clientes
FOR EACH ROW EXECUTE FUNCTION producao.fn_sincroniza_cliente_dw();

-- VIEW DE EXTRAÇÃO PARA O DW
CREATE OR REPLACE VIEW producao.vw_extracao_dw AS
SELECT 
    c.id_cliente AS id_cliente_nk, v.id_veiculo AS id_veiculo_nk, p.id_peca AS id_peca_nk,
    i.quantidade, (i.quantidade * p.preco) AS valor_total
FROM producao.tb_ordem_servico os
INNER JOIN producao.tb_veiculos v ON os.id_veiculo = v.id_veiculo
INNER JOIN producao.tb_clientes c ON v.id_cliente = c.id_cliente
INNER JOIN producao.tb_itens_os i ON os.id_os = i.id_os
INNER JOIN producao.tb_pecas_upgrades p ON i.id_peca = p.id_peca;

SELECT * FROM producao.vw_relatorio_analise_upgrades;

-- Altera o preço do Filtro Esportivo na produção
UPDATE producao.tb_pecas_upgrades SET preco = 380.00 WHERE id_peca = 1;

-- Verifica a tabela de log
SELECT * FROM producao.tb_log_precos;

-- Insere na Produção
INSERT INTO producao.tb_clientes (nome, telefone) VALUES ('Lucas Almeida', '83988887777');

-- Verifica se a Trigger jogou para o DW
SELECT * FROM dw.dim_cliente;

-- Vai dar ERRO proposital A OS 2 está vazia
CALL producao.sp_finalizar_os(2);

-- Vai dar SUCESSO A OS 1 tem o remap e o filtro instalados
CALL producao.sp_finalizar_os(1);

-- Verifica se o status da OS 1 mudou para Finalizado
SELECT * FROM producao.tb_ordem_servico ORDER BY id_os;