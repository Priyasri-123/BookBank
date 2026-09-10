package com.bookbank.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class PublisherResponse {
    private Long id;
    private String name;
    private String website;
}
