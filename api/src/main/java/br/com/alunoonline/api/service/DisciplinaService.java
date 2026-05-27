package br.com.alunoonline.api.service;

import br.com.alunoonline.api.model.Disciplina;
import br.com.alunoonline.api.repository.DisciplinaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DisciplinaService {

    @Autowired
    private DisciplinaRepository disciplinaRepository;

    public List<Disciplina> listarTodas() {
        return disciplinaRepository.findAll();
    }

    public Disciplina criar(Disciplina disciplina) {
        return disciplinaRepository.save(disciplina);
    }

    public void deletar(Long id) {
        disciplinaRepository.deleteById(id);
    }
}