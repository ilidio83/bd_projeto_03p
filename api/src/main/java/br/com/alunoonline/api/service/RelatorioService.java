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
import java.util.stream.Collectors;

@Service
public class RelatorioService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // CRÍTICO PARA SEGURANÇA: Mapeamento de quais tabelas e colunas reais do PostgreSQL são permitidas.
    private static final Map<String, List<String>> WHITELIST_TREATMENT = Map.of(
            "aluno", List.of("id", "nome", "cpf", "email"),
            "professor", List.of("id", "nome", "cpf", "email", "formacao_academica"),
            "disciplina", List.of("id", "nome", "carga_horaria", "professor_id"),
            "matricula_aluno", List.of("id", "aluno_id", "disciplina_id", "nota1", "nota2", "status"),
            "tabela_boletim", List.of("matricula_id", "nome_aluno", "nome_disciplina", "nota1", "nota2", "media_final", "status"),
            "vw_boletim_consolidado", List.of("id", "nome_aluno", "nome_disciplina", "nota1", "nota2", "media_final", "status")
    );

    public List<Map<String, Object>> gerarDadosRelatorio(RelatorioRequestDTO request) {
        String tabelaAlvo = request.getTabela().toLowerCase().trim();
        List<String> camposAlvo = request.getCampos();

        if (!WHITELIST_TREATMENT.containsKey(tabelaAlvo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tabela não permitida para relatórios.");
        }

        List<String> colunasValidas = WHITELIST_TREATMENT.get(tabelaAlvo);
        for (String campo : camposAlvo) {
            if (!colunasValidas.contains(campo.toLowerCase().trim())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O campo '" + campo + "' não é válido.");
            }
        }

        String colunasSql = String.join(", ", camposAlvo);
        String sql = "SELECT " + colunasSql + " FROM " + tabelaAlvo;

        return jdbcTemplate.queryForList(sql);
    }

    // Geração do arquivo Excel usando Apache POI
    public byte[] exportarParaExcel(List<Map<String, Object>> dados, List<String> colunas) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Relatório Customizado");

            CellStyle estiloCabecalho = workbook.createCellStyle();
            Font fonte = workbook.createFont();
            fonte.setBold(true);
            estiloCabecalho.setFont(fonte);

            Row linhaCabecalho = sheet.createRow(0);
            for (int i = 0; i < colunas.size(); i++) {
                Cell celula = linhaCabecalho.createCell(i);
                celula.setCellValue(colunas.get(i).toUpperCase());
                celula.setCellStyle(estiloCabecalho);
            }

            int indiceLinha = 1;
            for (Map<String, Object> registro : dados) {
                Row linha = sheet.createRow(indiceLinha++);
                for (int i = 0; i < colunas.size(); i++) {
                    Cell celula = linha.createCell(i);
                    Object valor = registro.get(colunas.get(i));
                    celula.setCellValue(valor != null ? valor.toString() : "");
                }
            }

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

        sb.append(String.join(",", colunas)).append("\n");

        for (Map<String, Object> registro : dados) {
            List<String> valoresLinha = colunas.stream()
                    .map(coluna -> {
                        Object valor = registro.get(coluna);
                        if (valor == null) return "";
                        String texto = valor.toString().replace("\"", "\"\"");
                        return "\"" + texto + "\"";
                    })
                    .collect(Collectors.toList()); // Ajustado para compatibilidade!
            sb.append(String.join(",", valoresLinha)).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }
}