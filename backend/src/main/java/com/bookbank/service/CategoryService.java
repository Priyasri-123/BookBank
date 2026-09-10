package com.bookbank.service;

import com.bookbank.dto.request.CategoryRequest;
import com.bookbank.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {
    CategoryResponse create(CategoryRequest request);
    CategoryResponse update(Long id, CategoryRequest request);
    void delete(Long id);
    List<CategoryResponse> getAll();
}
