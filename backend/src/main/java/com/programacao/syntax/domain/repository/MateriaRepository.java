package com.programacao.syntax.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.programacao.syntax.domain.entity.Materia;

import java.util.List;
import java.util.Optional;

@Repository
public interface MateriaRepository extends JpaRepository<Materia, Long> {
    
    List<Materia> findByUsuarioIdOrderByNomeAsc(Long usuarioId);
    
    Optional<Materia> findByIdAndUsuarioId(Long id, Long usuarioId);
    
    boolean existsByNomeAndUsuarioId(String nome, Long usuarioId);
}
