package com.library.dto;

import com.library.model.enums.PenaltyStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PenaltyDto {
    private Long id;
    private UserSummaryDto user;
    private Long loanId;
    private BigDecimal amount;
    private String reason;
    private PenaltyStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private Long userId;
    private LocalDateTime issuedAt;
    private boolean paid;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummaryDto {
        private Long id;
        private String firstName;
        private String lastName;
    }
}