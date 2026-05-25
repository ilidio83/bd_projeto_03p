package br.com.alunoonline.api.repository;

import br.com.alunoonline.api.model.BoletimAlunoView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoletimAlunoViewRepository extends JpaRepository<BoletimAlunoView, Long> {
    List<BoletimAlunoView> findByStatus(String status);
}
