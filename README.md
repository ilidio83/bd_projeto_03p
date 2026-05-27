# 🚗 Arquitetura de Banco de Dados: OLTP e OLAP para Oficina de Performance

Projeto desenvolvido como requisito acadêmico para o curso de Engenharia de Software da **UNIESP**. 

Este repositório contém a modelagem, criação e implementação de regras de negócio avançadas em um banco de dados relacional (PostgreSQL) para gerenciar uma oficina de *tuning* e upgrades automotivos. O projeto destaca a construção simultânea de um ambiente transacional (Produção) e um ambiente analítico (Data Warehouse), demonstrando a integração entre eles através de gatilhos (Triggers).

## 🎯 Objetivos do Projeto

- **Modelagem Relacional (OLTP):** Garantir a integridade dos dados operacionais da oficina (Clientes, Veículos, Peças e Ordens de Serviço) através de chaves primárias e estrangeiras.
- **Modelagem Dimensional (OLAP):** Criar um modelo Estrela (*Star Schema*) focado em análise de dados, utilizando tabelas Fato e Dimensões.
- **Isolamento de Ambientes:** Separação lógica dos bancos de dados utilizando *Schemas* (`producao` e `dw`).
- **Regras de Negócio no SGBD:** Transferir validações complexas para o banco de dados utilizando *Stored Procedures* e *Triggers*, garantindo segurança independente da aplicação que irá consumi-lo.

## 🛠️ Tecnologias Utilizadas

- **SGBD:** PostgreSQL
- **Ferramentas:** pgAdmin / DBeaver
- **Linguagem:** SQL (DDL, DML, DQL e PL/pgSQL)

## 🏗️ Estrutura e Funcionalidades

O projeto foi dividido em duas grandes áreas lógicas:

### 1. Schema: `producao` (Sistema Transacional)
Gerencia o dia a dia da oficina.
* **Tabelas Normalizadas:** `tb_clientes`, `tb_veiculos`, `tb_pecas_upgrades`, `tb_ordem_servico`, `tb_itens_os`.
* **Auditoria Contínua:** Implementação de uma **Trigger** (`trg_audita_preco`) que monitora a tabela de peças. Qualquer alteração de preço gera automaticamente um log histórico na tabela `tb_log_precos`.
* **Validação de Processos:** Criação de uma **Stored Procedure** (`sp_finalizar_os`) responsável por mudar o status de uma Ordem de Serviço. Ela inclui uma regra de negócio estrita: a transação é abortada (Rollback) caso tente-se finalizar uma OS que não possua upgrades vinculados.
* **Camada de Visualização:** Criação de uma **View** (`vw_relatorio_analise_upgrades`) que abstrai os múltiplos `JOINs` da produção para fornecer relatórios rápidos.

### 2. Schema: `dw` (Data Warehouse / Homologação)
Estrutura otimizada para Business Intelligence.
* **Modelo Estrela:** Composto pelas dimensões (`dim_tempo`, `dim_cliente`, `dim_veiculo`, `dim_peca`) e métricas (`fato_vendas_upgrades`).
* **Integração e Sincronização:** Uma **Trigger de Integração** (`trg_sync_cliente_dw`) alocada na produção observa novos cadastros. Sempre que um cliente é registrado no sistema operacional, ele é automaticamente inserido na `dim_cliente` do Data Warehouse, gerando sua respectiva *Surrogate Key*.
* **Extração de Dados:** Uso de uma **View de Extração** (`vw_extracao_dw`) que prepara os dados transacionais para o processo de ETL (Extract, Transform, Load).

## 🚀 Como executar este projeto

1. **Pré-requisitos:** Ter o PostgreSQL instalado na sua máquina local ou em nuvem.
2. **Criação do Banco:** Crie um banco de dados vazio (ex: `db_oficina_projeto`).
3. **Execução do Script Principal:** Abra o arquivo `script_criacao.sql` (ou cole o código do repositório) no seu console SQL e execute. Ele criará os *schemas*, as tabelas, as *procedures*, *triggers*, *views* e fará a inserção dos dados de teste ("mock data").
4. **Testando as Regras:** Utilize o arquivo `queries_teste.sql` para executar as chamadas de validação e verificar os logs e as sincronizações em tempo real.
