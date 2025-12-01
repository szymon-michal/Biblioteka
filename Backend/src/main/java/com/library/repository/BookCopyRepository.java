package com.library.repository;

import com.library.model.entity.BookCopy;
import com.library.model.enums.BookCopyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BookCopyRepository extends JpaRepository<BookCopy, Long> {
    @Query("SELECT bc FROM BookCopy bc WHERE " +
           "(:bookId IS NULL OR bc.bookId = :bookId) AND " +
           "(:status IS NULL OR bc.status = :status)")
    Page<BookCopy> findBookCopiesWithFilters(@Param("bookId") Long bookId,
                                             @Param("status") BookCopyStatus status,
                                             Pageable pageable);

    @Query("SELECT bc FROM BookCopy bc WHERE bc.bookId = :bookId AND bc.status = :status")
    Optional<BookCopy> findFirstByBookIdAndStatus(@Param("bookId") Long bookId, @Param("status") BookCopyStatus status);

    int countByBookIdAndStatus(Long bookId, BookCopyStatus status);
    int countByBookId(Long bookId);

    boolean existsByInventoryCode(String inventoryCode);
}