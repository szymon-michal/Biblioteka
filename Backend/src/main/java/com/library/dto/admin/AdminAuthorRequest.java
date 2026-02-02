package com.library.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminAuthorRequest {
    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;
}
