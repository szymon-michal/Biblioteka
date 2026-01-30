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
    private long newUsers;
    private long activeUsers;
    private long overdueLoans;

    private List<MostPopularBookDto> mostPopularBooks;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MostPopularBookDto {
        private Long bookId;
        private String title;
        private Long loansCount;
    }
}
