-- ==========================================
-- 1. CRIAÇÃO DA TABELA FÍSICA DO BOLETIM
-- ==========================================
CREATE TABLE IF NOT EXISTS tabela_boletim (
    matricula_id BIGINT PRIMARY KEY,
    nome_aluno VARCHAR(255),
    nome_disciplina VARCHAR(255),
    nota1 NUMERIC(10,2),
    nota2 NUMERIC(10,2),
    media_final NUMERIC(10,2),
    status VARCHAR(50)
)^^

-- ==========================================
-- 2. FUNÇÃO DA TRIGGER (O ROBÔ DE ALIMENTAÇÃO)
-- ==========================================
CREATE OR REPLACE FUNCTION fn_alimentar_boletim()
RETURNS TRIGGER AS $$
DECLARE
    v_nome_aluno VARCHAR(255);
    v_nome_disciplina VARCHAR(255);
    v_media NUMERIC(10,2);
    v_status VARCHAR(50);
BEGIN
    -- Busca os dados mixados das tabelas originais usando os IDs da matrícula
    SELECT nome INTO v_nome_aluno FROM aluno WHERE id = NEW.aluno_id;
    SELECT nome INTO v_nome_disciplina FROM disciplina WHERE id = NEW.disciplina_id;

    -- Realiza o cálculo da média caso as notas existam
    IF NEW.nota1 IS NOT NULL AND NEW.nota2 IS NOT NULL THEN
        v_media := (NEW.nota1 + NEW.nota2) / 2.0;
    ELSE
        v_media := NULL;
    END IF;

    -- Utiliza o status definido pela regra do seu Java (NEW.status)
    v_status := NEW.status;

    -- Alimenta a tabela física de boletim de forma resiliente (UPSERT)
    INSERT INTO tabela_boletim (matricula_id, nome_aluno, nome_disciplina, nota1, nota2, media_final, status)
    VALUES (NEW.id, v_nome_aluno, v_nome_disciplina, NEW.nota1, NEW.nota2, v_media, v_status)
    ON CONFLICT (matricula_id) DO UPDATE SET
        nome_aluno = EXCLUDED.nome_aluno,
        nome_disciplina = EXCLUDED.nome_disciplina,
        nota1 = EXCLUDED.nota1,
        nota2 = EXCLUDED.nota2,
        media_final = EXCLUDED.media_final,
        status = EXCLUDED.status;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql^^

-- ==========================================
-- 3. APLICAÇÃO DA TRIGGER NA TABELA DE MATRÍCULA
-- ==========================================
DROP TRIGGER IF EXISTS trg_alimentar_boletim ON matricula_aluno^^

CREATE TRIGGER trg_alimentar_boletim
AFTER INSERT OR UPDATE ON matricula_aluno
FOR EACH ROW
EXECUTE FUNCTION fn_alimentar_boletim()^^

-
-- 4. CRIAÇÃO DA VIEW DA TABELA DE BOLETIM

CREATE OR REPLACE VIEW vw_boletim_consolidado AS
SELECT
    matricula_id AS id,
    nome_aluno,
    nome_disciplina,
    nota1,
    nota2,
    media_final,
    status
FROM tabela_boletim^^