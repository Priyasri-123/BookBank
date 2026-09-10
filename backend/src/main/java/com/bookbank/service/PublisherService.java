package com.bookbank.service;

import com.bookbank.dto.request.PublisherRequest;
import com.bookbank.dto.response.PublisherResponse;

import java.util.List;

public interface PublisherService {
    PublisherResponse create(PublisherRequest request);
    PublisherResponse update(Long id, PublisherRequest request);
    void delete(Long id);
    List<PublisherResponse> getAll();
}
