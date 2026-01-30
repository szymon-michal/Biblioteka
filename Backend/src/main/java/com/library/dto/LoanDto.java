package com.library.dto;

import com.library.model.enums.LoanStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanDto {
    private Long id;
    private UserSummaryDto user;
    private BookCopySummaryDto bookCopy;
    private LocalDateTime loanDate;
    private LocalDateTime dueDate;
    private LocalDateTime returnDate;
    private LoanStatus status;
    private Short extensionsCount;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummaryDto {
        private Long id;
        private String firstName;
        private String lastName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookCopySummaryDto {
        private Long id;
        private String inventoryCode;
        private BookSummaryDto book;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookSummaryDto {
        private Long id;
        private String title;
        private List<AuthorDto> authors;
    }

}