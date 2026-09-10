package com.bookbank.mapper;

import com.bookbank.dto.response.PublisherResponse;
import com.bookbank.entity.Publisher;
import org.springframework.stereotype.Component;

@Component
public class PublisherMapper {
    public PublisherResponse toResponse(Publisher p) {
        return PublisherResponse.builder().id(p.getId()).name(p.getName()).website(p.getWebsite()).build();
    }
}
