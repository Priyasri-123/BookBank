package com.bookbank.mapper;

import com.bookbank.dto.response.AuthorResponse;
import com.bookbank.entity.Author;
import org.springframework.stereotype.Component;

@Component
public class AuthorMapper {
    public AuthorResponse toResponse(Author a) {
        return AuthorResponse.builder().id(a.getId()).name(a.getName()).bio(a.getBio()).build();
    }
}
