package com.library.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminCreatePenaltyRequest {
    @NotNull
    private Long userId;

    private Long loanId;

    @NotNull
    private BigDecimal amount;

    @NotBlank
    private String reason;
}
