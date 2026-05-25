package br.com.alunoonline.api.service;

import br.com.alunoonline.api.dtos.RelatorioRequestDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

    @Service
    public class RelatorioService {

        @Autowired
        private JdbcTemplate jdbcTemplate;

        // CRÍTICO PARA SEGURANÇA: Mapeamento de quais tabelas e colunas reais do PostgreSQL são permitidas.
        // Isso impede que um usuário mal-intencionado passe comandos SQL maliciosos ou acesse tabelas internas.
        private static final Map<String, List<String>> WHITELIST_TREATMENT = Map.of(
                "aluno", List.of("id", "nome", "cpf", "email"),
                "professor", List.of("id", "nome", "cpf", "email", "formacao_academica"),
                "disciplina", List.of("id", "nome", "carga_horaria", "professor_id"),
                "matricula_aluno", List.of("id", "aluno_id", "disciplina_id", "nota1", "nota2", "status"),
                "vw_boletim_aluno", List.of("aluno_id", "nome_aluno", "nome_disciplina", "nota1", "nota2", "media_final", "status")
        );

        public List<Map<String, Object>> gerarDadosRelatorio(RelatorioRequestDTO request) {
            String tabelaAlvo = request.getTabela().toLowerCase().trim();
            List<String> camposAlvo = request.getCampos();

            // 1. Valida se a tabela existe na nossa lista de permissões
            if (!WHITELIST_TREATMENT.containsKey(tabelaAlvo)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tabela não permitida para relatórios.");
            }

            // 2. Valida se todos os campos selecionados pertencem àquela tabela
            List<String> colunasValidas = WHITELIST_TREATMENT.get(tabelaAlvo);
            for (String campo : camposAlvo) {
                if (!colunasValidas.contains(campo.toLowerCase().trim())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O campo '" + campo + "' não é válido para a tabela " + tabelaAlvo);
                }
            }

            // 3. Monta a Query de forma limpa e segura (já sanitizada pela Whitelist)
            String colunasSql = String.join(", ", camposAlvo);
            String sql = "SELECT " + colunasSql + " FROM " + tabelaAlvo;

            // O queryForList mapeia cada linha do banco em um Map<NomeDaColuna, ValorDoDado>
            return jdbcTemplate.queryForList(sql);
        }

        // Geração do arquivo Excel usando Apache POI
        public byte[] exportarParaExcel(List<Map<String, Object>> dados, List<String> colunas) throws IOException {
            try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
                Sheet sheet = workbook.createSheet("Relatório Customizado");

                // Customização estilística do cabeçalho
                CellStyle estiloCabecalho = workbook.createCellStyle();
                Font fonte = workbook.createFont();
                fonte.setBold(true);
                estiloCabecalho.setFont(fonte);

                // Criação da linha de Cabeçalho
                Row linhaCabecalho = sheet.createRow(0);
                for (int i = 0; i < colunas.size(); i++) {
                    Cell celula = linhaCabecalho.createCell(i);
                    celula.setCellValue(colunas.get(i).toUpperCase());
                    celula.setCellStyle(estiloCabecalho);
                }

                // Preenchimento dos registros nas linhas subsequentes
                int indiceLinha = 1;
                for (Map<String, Object> registro : dados) {
                    Row linha = sheet.createRow(indiceLinha++);
                    for (int i = 0; i < colunas.size(); i++) {
                        Cell celula = linha.createCell(i);
                        Object valor = registro.get(colunas.get(i));
                        celula.setCellValue(valor != null ? valor.toString() : "");
                    }
                }

                // Auto-ajuste da largura das colunas baseado no conteúdo
                for (int i = 0; i < colunas.size(); i++) {
                    sheet.autoSizeColumn(i);
                }

                workbook.write(bos);
                return bos.toByteArray();
            }
        }

        // Geração do arquivo CSV nativo
        public byte[] exportarParaCsv(List<Map<String, Object>> dados, List<String> colunas) {
            StringBuilder sb = new StringBuilder();

            // Escreve o cabeçalho separado por vírgulas
            sb.append(String.join(",", colunas)).append("\n");

            // Escreve as linhas de dados tratando possíveis aspas
            for (Map<String, Object> registro : dados) {
                List<String> valoresLinha = colunas.stream()
                        .map(coluna -> {
                            Object valor = registro.get(coluna);
                            if (valor == null) return "";
                            // Trata valores com aspas para não quebrar a estrutura do CSV
                            String texto = valor.toString().replace("\"", "\"\"");
                            return "\"" + texto + "\"";
                        })
                        .toList();
                sb.append(String.join(",", valoresLinha)).append("\n");
            }

            return sb.toString().getBytes(StandardCharsets.UTF_8);
        }
    }
