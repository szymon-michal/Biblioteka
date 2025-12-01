package com.library.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookRequest {
    @NotBlank
    private String title;

    private String description;

    private Short publicationYear;

    private String isbn;

    @NotNull
    private Long categoryId;

    @NotNull
    private List<Long> authorIds;

    @Positive
    private Integer initialCopies;
}