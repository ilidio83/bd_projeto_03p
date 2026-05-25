package br.com.alunoonline.api.service;

import br.com.alunoonline.api.model.Professor;
import br.com.alunoonline.api.repository.ProfessorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service

public class ProfessorService {

    @Autowired
    ProfessorRepository professorRepository;

    public void criarProfessor(Professor professor) {
        professorRepository.save(professor);
    }

    public List<Professor> listarTodosProfessores(){
        return professorRepository.findAll();
    }

    public Optional<Professor> buscarProfessorPorId(long id){
        return professorRepository.findById(id);
    }

    public void deletarProfessorPorId(long id){
        professorRepository.deleteById(id);
    }

    public void atualizarProfessorPorId(long id, Professor professorAtualizado){
        professorAtualizado.setId(id);
        professorRepository.save(professorAtualizado);
    }
}
