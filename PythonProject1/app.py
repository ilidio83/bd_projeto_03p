import streamlit as st
import pandas as pd
import psycopg2
from psycopg2 import Error


# 1. Função para conectar ao banco de dados e buscar os dados da VIEW
@st.cache_data
def buscar_dados_view():
    try:

        conexao = psycopg2.connect(
            host="localhost",
            database="tb_bd",
            user="postgres",
            password="091020",
            port="5432",

        )

        # Consulta simples, jogando a complexidade para a View no banco!
        query = "SELECT * FROM vw_relatorio_analise_upgrades;"

        # O Pandas já lê a query e converte para um DataFrame (tabela)
        df = pd.read_sql_query(query, conexao)
        return df

    except Exception as e:
        st.error(f"Erro ao conectar no PostgreSQL: {e}")
        return pd.DataFrame()

    finally:
        if 'conexao' in locals() and conexao:
            conexao.close()



st.set_page_config(page_title="Dashboard - Oficina de Alta Performance", layout="wide")
st.title("⚙️ Painel de Análise de Upgrades Automotivos")
st.markdown("Consumo da modelagem dimensional (View) diretamente do PostgreSQL.")

# Carrega os dados
df_relatorio = buscar_dados_view()

if not df_relatorio.empty:
    # --- PESQUISA INTERATIVA (Filtros) ---
    st.sidebar.header("Filtros Interativos")

    # Filtro por Categoria de Peça
    categorias = ["Todas"] + df_relatorio['categoria_upgrade'].unique().tolist()
    filtro_categoria = st.sidebar.selectbox("Filtrar por Categoria", categorias)

    # Filtro de texto livre (Ex: Pesquisar por 'Polo' ou 'Lucas')
    termo_pesquisa = st.sidebar.text_input("Buscar veículo ou cliente:")

    # --- APLICANDO OS FILTROS ---
    df_filtrado = df_relatorio.copy()

    if filtro_categoria != "Todas":
        df_filtrado = df_filtrado[df_filtrado['categoria_upgrade'] == filtro_categoria]

    if termo_pesquisa:
        # Filtra se o termo existir no nome do cliente ou no veículo
        mask = df_filtrado['cliente'].str.contains(termo_pesquisa, case=False, na=False) | \
               df_filtrado['veiculo_completo'].str.contains(termo_pesquisa, case=False, na=False)
        df_filtrado = df_filtrado[mask]

    # --- EXIBIÇÃO E MÉTRICAS ---
    col1, col2 = st.columns(2)
    col1.metric("Total de Upgrades Instalados", len(df_filtrado))
    col2.metric("Faturamento Total", f"R$ {df_filtrado['valor_total_item'].sum():,.2f}")

    # Exibe a tabela na tela
    st.dataframe(df_filtrado, use_container_width=True)

    # --- BOTÃO TOP: EXPORTAR PARA CSV ---
    # O Streamlit já tem um componente nativo para isso
    csv = df_filtrado.to_csv(index=False).encode('utf-8')

    st.download_button(
        label="📥 Exportar Relatório para CSV",
        data=csv,
        file_name='relatorio_oficina.csv',
        mime='text/csv',
    )
else:
    st.warning("Nenhum dado encontrado ou erro de conexão.")