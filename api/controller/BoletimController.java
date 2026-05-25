package br.com.alunoonline.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/boletins")
@CrossOrigin("*")
public class BoletimController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Rota que lê diretamente a nossa View do PostgreSQL
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<Map<String, Object>> listarBoletimGeral() {
        String sql = "SELECT * FROM vw_boletim_aluno";
        return jdbcTemplate.queryForList(sql);
    }
}