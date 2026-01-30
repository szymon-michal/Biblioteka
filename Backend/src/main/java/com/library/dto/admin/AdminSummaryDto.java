package com.library.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminSummaryDto {
    private long totalLoans;
    private long newUsers;     // jeżeli nie masz pola createdAt u usera -> będzie 0
    private long activeUsers;  // jeżeli nie liczysz -> będzie 0
    private long overdueLoans;

    private List<MostPopularBookDto> mostPopularBooks;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MostPopularBookDto {
        private Long bookId;
        private String title;
        private long loansCount;
    }
}
