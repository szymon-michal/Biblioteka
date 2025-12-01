package com.library.repository;

import com.library.model.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookRepository extends JpaRepository<Book, Long> {
    
    @Query("SELECT DISTINCT b FROM Book b " +
           "LEFT JOIN b.authors a " +
           "WHERE (:title IS NULL OR LOWER(b.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
           "AND (:author IS NULL OR LOWER(a.firstName) LIKE LOWER(CONCAT('%', :author, '%')) OR " +
           "     LOWER(a.lastName) LIKE LOWER(CONCAT('%', :author, '%'))) " +
           "AND (:categoryId IS NULL OR b.categoryId = :categoryId) " +
           "AND (:yearFrom IS NULL OR b.publicationYear >= :yearFrom) " +
           "AND (:yearTo IS NULL OR b.publicationYear <= :yearTo) " +
           "AND (:activeOnly = false OR b.isActive = true)")
    Page<Book> findBooksWithFilters(@Param("title") String title,
                                    @Param("author") String author,
                                    @Param("categoryId") Long categoryId,
                                    @Param("yearFrom") Short publicationYearFrom,
                                    @Param("yearTo") Short publicationYearTo,
                                    @Param("activeOnly") boolean activeOnly,
                                    Pageable pageable);

    boolean existsByIsbn(String isbn);
}