package com.bookbank.service;

import com.bookbank.dto.request.AuthorRequest;
import com.bookbank.dto.response.AuthorResponse;

import java.util.List;

public interface AuthorService {
    AuthorResponse create(AuthorRequest request);
    AuthorResponse update(Long id, AuthorRequest request);
    void delete(Long id);
    List<AuthorResponse> getAll();
}
