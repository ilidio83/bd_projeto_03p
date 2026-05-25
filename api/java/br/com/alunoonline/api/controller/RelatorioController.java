package br.com.alunoonline.api.controller;
import br.com.alunoonline.api.dtos.RelatorioRequestDTO;
import br.com.alunoonline.api.service.RelatorioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/relatorios")
@CrossOrigin(origins = "*")
public class RelatorioController {
    @Autowired
    private RelatorioService relatorioService;

    // Endpoint 1: Retorna JSON para montar a tabela dinâmica diretamente no Frontend
    @PostMapping("/visualizar")
    public ResponseEntity<?> visualizarRelatorio(@RequestBody RelatorioRequestDTO request) {
        try {
            // Imprime no console do Java o que chegou do navegador
            System.out.println("=> RECEBIDO DO FRONTEND | Tabela: " + request.getTabela() + " | Campos: " + request.getCampos());

            List<Map<String, Object>> dados = relatorioService.gerarDadosRelatorio(request);
            return ResponseEntity.ok(dados);

        } catch (Exception e) {
            // Se der qualquer erro, imprime a causa real no console e devolve para o navegador
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro real do Java: " + e.getMessage());
        }
    }

    // Endpoint 2: Dispara o download do arquivo .xlsx (Excel)
    @PostMapping("/exportar/excel")
    public ResponseEntity<byte[]> exportarParaExcel(@RequestBody RelatorioRequestDTO request) throws IOException {
        List<Map<String, Object>> dados = relatorioService.gerarDadosRelatorio(request);
        byte[] arquivoExcel = relatorioService.exportarParaExcel(dados, request.getCampos());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio_" + request.getTabela() + ".xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(arquivoExcel);
    }

    // Endpoint 3: Dispara o download do arquivo .csv
    @PostMapping("/exportar/csv")
    public ResponseEntity<byte[]> exportarParaCsv(@RequestBody RelatorioRequestDTO request) {
        List<Map<String, Object>> dados = relatorioService.gerarDadosRelatorio(request);
        byte[] arquivoCsv = relatorioService.exportarParaCsv(dados, request.getCampos());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio_" + request.getTabela() + ".csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(arquivoCsv);
    }
}
