package com.library.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBookRequest {
    @NotBlank
    private String title;

    private String description;

    private Short publicationYear;

    private String isbn;

    @NotNull
    private Long categoryId;

    @NotNull
    private List<Long> authorIds;

    private Boolean isActive = true;
}
