package br.com.alunoonline.api.service;

import br.com.alunoonline.api.MatriculaAlunoStatusEnum;
import br.com.alunoonline.api.dtos.AtualizarNotaRequestDTO;
import br.com.alunoonline.api.dtos.DisciplinasAlunoResponseDTO;
import br.com.alunoonline.api.dtos.HistoricoAlunoResponseDTO;
import br.com.alunoonline.api.model.Aluno;
import br.com.alunoonline.api.model.MatriculaAluno;
import br.com.alunoonline.api.repository.MatriculaAlunoRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.List;

@Data
@Service
public class MatriculaAlunoService {

    private static final Double MEDIA_PARA_APROVACAO = 7.0;

    @Autowired
    MatriculaAlunoRepository matriculaAlunoRepository;

    public List<MatriculaAluno> listarTodas() {
        return matriculaAlunoRepository.findAll();
    }

    public void deletar(Long id) {
        matriculaAlunoRepository.deleteById(id);
    }

    public void criarMatricula(MatriculaAluno matriculaAluno) {
        matriculaAluno.setStatus(MatriculaAlunoStatusEnum.MATRICULADO);
        matriculaAlunoRepository.save(matriculaAluno);
    }

    public void trancarMatricula(Long id) {
        MatriculaAluno matricula = matriculaAlunoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Matricula não encontrada"));

        if (matricula.getStatus().equals(MatriculaAlunoStatusEnum.MATRICULADO)) {
            matricula.setStatus(MatriculaAlunoStatusEnum.TRANCADO);
            matriculaAlunoRepository.save(matricula);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Só é possível trancar com status MATRICULADO");
        }
    }

    public void atualizarNotas(Long id, AtualizarNotaRequestDTO dto) {
        MatriculaAluno matricula = matriculaAlunoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Matricula não encontrada"));

        if (dto.getNota1() != null) matricula.setNota1(dto.getNota1());
        if (dto.getNota2() != null) matricula.setNota2(dto.getNota2());

        // Apagamos a lógica de média daqui! O Java apenas salva as notas.
        // A Trigger do PostgreSQL vai interceptar esse 'save' e preencher o Status sozinha!
        matriculaAlunoRepository.save(matricula);
    }

    public HistoricoAlunoResponseDTO emitirHistorico(Long alunoId) {
        List<MatriculaAluno> matriculas =
                matriculaAlunoRepository.findByAlunoId(alunoId);

        if (matriculas.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Nenhuma matrícula encontrada para esse aluno");
        }

        Aluno aluno = matriculas.get(0).getAluno();
        List<DisciplinasAlunoResponseDTO> disciplinas = new ArrayList<>();

        for (MatriculaAluno matricula : matriculas) {
            DisciplinasAlunoResponseDTO disc = new DisciplinasAlunoResponseDTO();
            disc.setNomeDisciplina(matricula.getDisciplina().getNome());
            disc.setNomeProfessor(matricula.getDisciplina().getProfessor().getNome());
            disc.setNota1(matricula.getNota1());
            disc.setNota2(matricula.getNota2());
            if (matricula.getNota1() != null && matricula.getNota2() != null) {
                disc.setMedia((matricula.getNota1() + matricula.getNota2()) / 2);
            }
            disc.setStatus(matricula.getStatus());
            disciplinas.add(disc);
        }

        HistoricoAlunoResponseDTO historico = new HistoricoAlunoResponseDTO();
        historico.setNomeAluno(aluno.getNome());
        historico.setEmailAluno(aluno.getEmail());
        historico.setCpfAluno(aluno.getCpf());
        historico.setDisciplinas(disciplinas);
        return historico;
    }
}