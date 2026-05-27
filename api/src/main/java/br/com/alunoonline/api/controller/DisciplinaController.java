package br.com.alunoonline.api.controller;

import br.com.alunoonline.api.model.Disciplina;
import br.com.alunoonline.api.service.DisciplinaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/disciplinas")
@CrossOrigin("*")
public class DisciplinaController {

    // Agora o Controller conversa com o Service, e não mais direto com o Banco de Dados
    @Autowired
    private DisciplinaService disciplinaService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<Disciplina> listarTodas() {
        return disciplinaService.listarTodas();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Disciplina criar(@RequestBody Disciplina disciplina) {
        return disciplinaService.criar(disciplina);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable Long id) {
        disciplinaService.deletar(id);
    }
}