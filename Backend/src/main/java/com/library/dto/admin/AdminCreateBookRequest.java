package com.library.dto.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class AdminCreateBookRequest {
    @NotBlank
    private String title;

    private String description;

    @NotNull
    private Integer publicationYear;

    @NotBlank
    private String isbn;

    // u Ciebie w DB może być null, ale w UI trzymamy to jako liczba
    private Long categoryId;

    // optional
    private List<Long> authorIds;

    @Min(1)
    private Integer initialCopies = 1;
}
