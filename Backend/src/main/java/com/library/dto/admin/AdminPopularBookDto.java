package com.library.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminPopularBookDto {
    private Long bookId;
    private String title;
    private Long loansCount;
}
