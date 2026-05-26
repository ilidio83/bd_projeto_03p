
# ⚙️ Dashboard Analítico - Oficina de Alta Performance

Projeto desenvolvido para a disciplina de Banco de Dados/Engenharia de Dados do curso de Engenharia de Software da **UNIESP**.

Este projeto implementa uma solução completa de dados para uma oficina de tuning automotivo. Ele abrange desde a modelagem relacional do banco de dados (PostgreSQL) até a criação de uma camada analítica utilizando Views e JOINs complexos, culminando em um painel interativo desenvolvido em Python.

## 🚀 Funcionalidades

* **Modelagem de Dados:** Estrutura relacional contendo clientes, veículos, peças de performance (upgrades) e ordens de serviço.
* **Camada Analítica (View):** Utilização de `JOINs` no banco de dados para pré-processar os dados transacionais em uma estrutura tabular otimizada para análise.
* **Dashboard Interativo:** Interface web em Streamlit permitindo filtros dinâmicos por categoria de peça e pesquisa de texto livre.
* **Exportação de Relatórios:** Geração e download nativo dos dados filtrados para o formato `.csv`.

## 🛠️ Tecnologias Utilizadas

* **Banco de Dados:** PostgreSQL (Scripts SQL, Views, JOINs).
* **Linguagem:** Python 3.x
* **Bibliotecas:**
    * `streamlit` (Interface gráfica e interatividade web)
    * `pandas` (Manipulação e estruturação dos dados)
    * `psycopg2-binary` (Driver de conexão com o PostgreSQL)

## 📋 Como rodar o projeto localmente

### 1. Pré-requisitos
* Ter o [Python](https://www.python.org/) instalado na máquina.
* Ter o [PostgreSQL](https://www.postgresql.org/) e o pgAdmin instalados.

### 2. Configuração do Banco de Dados
1. Crie um banco de dados no seu PostgreSQL.
2. Execute o script de criação de tabelas e inserção de dados (DML e DDL).
3. Execute o script de criação da View (`vw_relatorio_analise_upgrades`).

### 3. Configuração da Aplicação Python
Abra o terminal na pasta do projeto e instale as dependências:

```bash
pip install psycopg2-binary pandas streamlit
