package com.bookbank.service.impl;

import com.bookbank.dto.request.PublisherRequest;
import com.bookbank.dto.response.PublisherResponse;
import com.bookbank.entity.Publisher;
import com.bookbank.exception.ResourceNotFoundException;
import com.bookbank.mapper.PublisherMapper;
import com.bookbank.repository.PublisherRepository;
import com.bookbank.service.PublisherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PublisherServiceImpl implements PublisherService {

    private final PublisherRepository publisherRepository;
    private final PublisherMapper publisherMapper;

    @Override
    public PublisherResponse create(PublisherRequest request) {
        Publisher publisher = Publisher.builder().name(request.getName()).website(request.getWebsite()).build();
        return publisherMapper.toResponse(publisherRepository.save(publisher));
    }

    @Override
    public PublisherResponse update(Long id, PublisherRequest request) {
        Publisher publisher = publisherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Publisher not found with id: " + id));
        publisher.setName(request.getName());
        publisher.setWebsite(request.getWebsite());
        return publisherMapper.toResponse(publisherRepository.save(publisher));
    }

    @Override
    public void delete(Long id) {
        if (!publisherRepository.existsById(id)) {
            throw new ResourceNotFoundException("Publisher not found with id: " + id);
        }
        publisherRepository.deleteById(id);
    }

    @Override
    public List<PublisherResponse> getAll() {
        return publisherRepository.findAll().stream().map(publisherMapper::toResponse).toList();
    }
}
