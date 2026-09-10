package com.bookbank.service.impl;

import com.bookbank.dto.request.AuthorRequest;
import com.bookbank.dto.response.AuthorResponse;
import com.bookbank.entity.Author;
import com.bookbank.exception.ResourceNotFoundException;
import com.bookbank.mapper.AuthorMapper;
import com.bookbank.repository.AuthorRepository;
import com.bookbank.service.AuthorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthorServiceImpl implements AuthorService {

    private final AuthorRepository authorRepository;
    private final AuthorMapper authorMapper;

    @Override
    public AuthorResponse create(AuthorRequest request) {
        Author author = Author.builder().name(request.getName()).bio(request.getBio()).build();
        return authorMapper.toResponse(authorRepository.save(author));
    }

    @Override
    public AuthorResponse update(Long id, AuthorRequest request) {
        Author author = authorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Author not found with id: " + id));
        author.setName(request.getName());
        author.setBio(request.getBio());
        return authorMapper.toResponse(authorRepository.save(author));
    }

    @Override
    public void delete(Long id) {
        if (!authorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Author not found with id: " + id);
        }
        authorRepository.deleteById(id);
    }

    @Override
    public List<AuthorResponse> getAll() {
        return authorRepository.findAll().stream().map(authorMapper::toResponse).toList();
    }
}
