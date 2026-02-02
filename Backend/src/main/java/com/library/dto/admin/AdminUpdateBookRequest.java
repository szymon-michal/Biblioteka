package com.library.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class AdminUpdateBookRequest {
    @NotBlank
    private String title;

    private String description;

    @NotNull
    private Integer publicationYear;

    @NotBlank
    private String isbn;

    private Long categoryId;
    private List<Long> authorIds;
}
