package com.programacao.syntax.presentation.controller;

import com.programacao.syntax.application.dto.MateriaDTO;
import com.programacao.syntax.application.service.MateriaService;
import com.programacao.syntax.domain.entity.Usuario;
import com.programacao.syntax.infrastructure.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Controller BLINDADO de Matérias
 * Verifica autenticação ANTES de processar requisições
 */
@RestController
@RequestMapping("/api/materias")
@RequiredArgsConstructor
public class MateriaController {
    
    private final MateriaService materiaService;
    
    @GetMapping
    public ResponseEntity<List<MateriaDTO>> listarTodas() {
        verificarAutenticacao(); // BLINDAGEM ✅
        return ResponseEntity.ok(materiaService.listarTodas());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<MateriaDTO> buscarPorId(@PathVariable Long id) {
        verificarAutenticacao(); // BLINDAGEM ✅
        return ResponseEntity.ok(materiaService.buscarPorId(id));
    }
    
    @PostMapping
    public ResponseEntity<MateriaDTO> criar(@Valid @RequestBody MateriaDTO materiaDTO) {
        verificarAutenticacao(); // BLINDAGEM ✅
        MateriaDTO materiaCriada = materiaService.criar(materiaDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(materiaCriada);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<MateriaDTO> atualizar(@PathVariable Long id, @Valid @RequestBody MateriaDTO materiaDTO) {
        verificarAutenticacao(); // BLINDAGEM ✅
        return ResponseEntity.ok(materiaService.atualizar(id, materiaDTO));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        verificarAutenticacao(); // BLINDAGEM ✅
        materiaService.deletar(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * BLINDAGEM: Verifica se usuário está autenticado
     * Se não estiver, retorna 401 UNAUTHORIZED (em vez de 500 Internal Server Error)
     */
    private void verificarAutenticacao() {
        try {
            Usuario usuario = SecurityUtils.getUsuarioAutenticado();
            
            if (usuario == null || usuario.getId() == null) {
                throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, 
                    "Usuário não autenticado. Faça login com Firebase."
                );
            }
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, 
                "Token Firebase inválido ou ausente. Faça login novamente."
            );
        }
    }
}
