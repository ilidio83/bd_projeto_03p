-- 1. A VIEW (Gera o Boletim puxando de 3 tabelas)
CREATE OR REPLACE VIEW vw_boletim_aluno AS
SELECT
    m.aluno_id,
    a.nome AS nome_aluno,
    d.nome AS nome_disciplina,
    m.nota1,
    m.nota2,
    ((COALESCE(m.nota1, 0) + COALESCE(m.nota2, 0)) / 2.0) AS media_final,
    m.status
FROM matricula_aluno m
JOIN aluno a ON m.aluno_id = a.id
JOIN disciplina d ON m.disciplina_id = d.id^^

-- 2. A TRIGGER (Calcula a nota assim que o Java manda salvar)
CREATE OR REPLACE FUNCTION fn_calcular_status_matricula()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nota1 IS NOT NULL AND NEW.nota2 IS NOT NULL THEN
        IF ((NEW.nota1 + NEW.nota2) / 2.0) >= 7.0 THEN
            NEW.status := 'APROVADO';
        ELSE
            NEW.status := 'REPROVADO';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql^^

DROP TRIGGER IF EXISTS trg_calcular_status ON matricula_aluno^^

CREATE TRIGGER trg_calcular_status
BEFORE INSERT OR UPDATE ON matricula_aluno
FOR EACH ROW
EXECUTE FUNCTION fn_calcular_status_matricula()^^