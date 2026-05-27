package br.com.alunoonline.api.controller;

import br.com.alunoonline.api.dtos.AtualizarNotaRequestDTO;
import br.com.alunoonline.api.dtos.HistoricoAlunoResponseDTO;
import br.com.alunoonline.api.model.MatriculaAluno;
import br.com.alunoonline.api.service.MatriculaAlunoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/matriculas")
@CrossOrigin("*")
public class MatriculaAlunoController {

    @Autowired
    private MatriculaAlunoService matriculaAlunoService;

    // Rota para o JavaScript preencher a tabela
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<MatriculaAluno> listarTodas() {
        return matriculaAlunoService.listarTodas();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void criarMatricula(@RequestBody MatriculaAluno matriculaAluno) {
        matriculaAlunoService.criarMatricula(matriculaAluno);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable Long id) {
        matriculaAlunoService.deletar(id);
    }

    @PatchMapping("/trancar/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void trancarMatricula(@PathVariable Long id) {
        matriculaAlunoService.trancarMatricula(id);
    }

    @PatchMapping("/notas/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void atualizarNotas(@PathVariable Long id, @RequestBody AtualizarNotaRequestDTO dto) {
        matriculaAlunoService.atualizarNotas(id, dto);
    }

    @GetMapping("/historico/{alunoId}")
    @ResponseStatus(HttpStatus.OK)
    public HistoricoAlunoResponseDTO emitirHistorico(@PathVariable Long alunoId) {
        return matriculaAlunoService.emitirHistorico(alunoId);
    }
}