package com.library.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookDto {
    private Long id;
    private String title;
    private String description;
    private Short publicationYear;
    private String isbn;
    private CategoryDto category;
    private List<AuthorDto> authors;
    private Boolean isActive;
    private Integer totalCopies;
    private Integer availableCopies;
}