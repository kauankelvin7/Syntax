package com.programacao.syntax.application.service;

import com.programacao.syntax.application.dto.ResumoDTO;
import com.programacao.syntax.application.mapper.ResumoMapper;
import com.programacao.syntax.domain.entity.Materia;
import com.programacao.syntax.domain.entity.Resumo;
import com.programacao.syntax.domain.entity.Usuario;
import com.programacao.syntax.domain.repository.MateriaRepository;
import com.programacao.syntax.domain.repository.ResumoRepository;
import com.programacao.syntax.infrastructure.exception.ResourceNotFoundException;
import com.programacao.syntax.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResumoService {
    
    private final ResumoRepository resumoRepository;
    private final MateriaRepository materiaRepository;
    private final ResumoMapper resumoMapper;
    
    @Transactional(readOnly = true)
    public List<ResumoDTO> listarTodos() {
        Long usuarioId = SecurityUtils.getUsuarioIdAutenticado();
        return resumoRepository.findByUsuarioIdOrderByAtualizadoEmDesc(usuarioId)
            .stream()
            .map(resumoMapper::toDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ResumoDTO> listarPorMateria(Long materiaId) {
        Long usuarioId = SecurityUtils.getUsuarioIdAutenticado();
        return resumoRepository.findByMateriaIdAndUsuarioIdOrderByAtualizadoEmDesc(materiaId, usuarioId)
            .stream()
            .map(resumoMapper::toDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public ResumoDTO buscarPorId(Long id) {
        Long usuarioId = SecurityUtils.getUsuarioIdAutenticado();
        Resumo resumo = resumoRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Resumo não encontrado com ID: " + id));
        return resumoMapper.toDTO(resumo);
    }
    
    @Transactional(readOnly = true)
    public List<ResumoDTO> buscarPorTitulo(String titulo) {
        Long usuarioId = SecurityUtils.getUsuarioIdAutenticado();
        return resumoRepository.findByTituloContainingIgnoreCaseAndUsuarioId(titulo, usuarioId)
            .stream()
            .map(resumoMapper::toDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public ResumoDTO criar(ResumoDTO resumoDTO) {
        Usuario usuario = SecurityUtils.getUsuarioAutenticado();
        Long usuarioId = usuario.getId();
        
        Materia materia = materiaRepository.findByIdAndUsuarioId(resumoDTO.getMateriaId(), usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com ID: " + resumoDTO.getMateriaId()));
        
        Resumo resumo = resumoMapper.toEntity(resumoDTO);
        resumo.setMateria(materia);
        resumo.setUsuario(usuario);
        
        Resumo resumoSalvo = resumoRepository.save(resumo);
        return resumoMapper.toDTO(resumoSalvo);
    }
    
    @Transactional
    public ResumoDTO atualizar(Long id, ResumoDTO resumoDTO) {
        Long usuarioId = SecurityUtils.getUsuarioIdAutenticado();
        Resumo resumo = resumoRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Resumo não encontrado com ID: " + id));
        
        if (resumoDTO.getMateriaId() != null && !resumo.getMateria().getId().equals(resumoDTO.getMateriaId())) {
            Materia novaMateria = materiaRepository.findByIdAndUsuarioId(resumoDTO.getMateriaId(), usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com ID: " + resumoDTO.getMateriaId()));
            resumo.setMateria(novaMateria);
        }
        
        resumoMapper.updateEntity(resumoDTO, resumo);
        Resumo resumoAtualizado = resumoRepository.save(resumo);
        return resumoMapper.toDTO(resumoAtualizado);
    }
    
    @Transactional
    public void deletar(Long id) {
        Long usuarioId = SecurityUtils.getUsuarioIdAutenticado();
        Resumo resumo = resumoRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Resumo não encontrado com ID: " + id));
        resumoRepository.delete(resumo);
    }
}
