package com.library.dto;

import com.library.model.enums.BookCopyStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookCopyDto {
    private Long id;
    private Long bookId;
    private String inventoryCode;
    private BookCopyStatus status;
    private String shelfLocation;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}