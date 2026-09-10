package com.bookbank.mapper;

import com.bookbank.dto.response.CategoryResponse;
import com.bookbank.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {
    public CategoryResponse toResponse(Category c) {
        return CategoryResponse.builder().id(c.getId()).name(c.getName()).description(c.getDescription()).build();
    }
}
