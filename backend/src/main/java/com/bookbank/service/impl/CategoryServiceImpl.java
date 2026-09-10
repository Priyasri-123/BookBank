package com.bookbank.service.impl;

import com.bookbank.dto.request.CategoryRequest;
import com.bookbank.dto.response.CategoryResponse;
import com.bookbank.entity.Category;
import com.bookbank.exception.InvalidRequestException;
import com.bookbank.exception.ResourceNotFoundException;
import com.bookbank.mapper.CategoryMapper;
import com.bookbank.repository.CategoryRepository;
import com.bookbank.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Override
    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.getName())) {
            throw new InvalidRequestException("Category '" + request.getName() + "' already exists");
        }
        Category category = Category.builder().name(request.getName()).description(request.getDescription()).build();
        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Override
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Override
    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category not found with id: " + id);
        }
        categoryRepository.deleteById(id);
    }

    @Override
    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll().stream().map(categoryMapper::toResponse).toList();
    }
}
