package br.com.alunoonline.api.model;


import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.annotations.Immutable;

@Data
@Entity
@Immutable // Diz ao Spring: "Isto é apenas para leitura!"
@Table(name = "vw_boletim_aluno")
public class BoletimAlunoView {

    @Id
    private Long alunoId; // O JPA exige um @Id mesmo em Views
    private String nomeAluno;
    private String nomeDisciplina;
    private Double nota1;
    private Double nota2;
    private Double mediaFinal;
    private String status;
}
