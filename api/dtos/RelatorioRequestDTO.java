package br.com.alunoonline.api.dtos;

import lombok.Data;
import java.util.List;

@Data
public class RelatorioRequestDTO {
    private String tabela;       // Ex: "aluno", "professor", "disciplina"
    private List<String> campos;
}
