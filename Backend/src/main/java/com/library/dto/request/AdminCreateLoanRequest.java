package com.library.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminCreateLoanRequest {
    @NotNull
    private Long userId;

    @NotNull
    private Long bookCopyId;

    /** opcjonalnie; jak null -> +14 dni */
    private LocalDateTime dueDate;
}
