package com.library.repository;

import com.library.model.entity.Loan;
import com.library.model.enums.LoanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    // ====== USER / ME ======

    @Query("SELECT l FROM Loan l WHERE l.userId = :userId")
    Page<Loan> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT l FROM Loan l WHERE l.id = :id AND l.userId = :userId")
    Optional<Loan> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT l FROM Loan l WHERE l.userId = :userId AND l.status IN :statuses")
    Page<Loan> findByUserIdAndStatusIn(@Param("userId") Long userId,
                                       @Param("statuses") List<LoanStatus> statuses,
                                       Pageable pageable);

    List<Loan> findByUserIdAndStatusIn(Long userId, List<LoanStatus> statuses);

    // ====== ADMIN FILTERS ======

    @Query("SELECT l FROM Loan l WHERE " +
            "(:status IS NULL OR l.status = :status) AND " +
            "(:userId IS NULL OR l.userId = :userId) AND " +
            "(:bookId IS NULL OR l.bookCopy.bookId = :bookId) AND " +
            "(:fromDate IS NULL OR l.loanDate >= :fromDate) AND " +
            "(:toDate IS NULL OR l.loanDate <= :toDate)")
    Page<Loan> findLoansWithFilters(@Param("status") LoanStatus status,
                                    @Param("userId") Long userId,
                                    @Param("bookId") Long bookId,
                                    @Param("fromDate") LocalDateTime fromDate,
                                    @Param("toDate") LocalDateTime toDate,
                                    Pageable pageable);

    @Query("SELECT l FROM Loan l WHERE l.status = 'ACTIVE' AND l.dueDate < :now")
    List<Loan> findOverdueLoans(@Param("now") LocalDateTime now);

    // ====== ADMIN STATS ======

    @Query("""
        select count(l)
        from Loan l
        where l.loanDate >= :from and l.loanDate < :to
    """)
    long countLoansBetween(@Param("from") LocalDateTime from,
                           @Param("to") LocalDateTime to);

    @Query("""
        select count(l)
        from Loan l
        where l.returnDate is null
          and l.dueDate < :now
    """)
    long countOverdueLoans(@Param("now") LocalDateTime now);

    // --- Most popular books: PROJECTION (bez new DTO w JPQL) ---
    interface MostPopularBookRow {
        Long getBookId();
        String getTitle();
        Long getLoansCount();
    }

    @Query("""
        select b.id as bookId, b.title as title, count(l) as loansCount
        from Loan l
        join l.bookCopy bc
        join bc.book b
        where l.loanDate >= :from and l.loanDate < :to
        group by b.id, b.title
        order by count(l) desc
    """)
    List<MostPopularBookRow> findMostPopularBooks(@Param("from") LocalDateTime from,
                                                  @Param("to") LocalDateTime to);

    // --- Loans per day: PROJECTION (bez new DTO w JPQL) ---
    interface LoansPerDayRow {
        LocalDate getDay();
        Long getLoansCount();
    }

    @Query("""
        select cast(l.loanDate as date) as day,
               count(l) as loansCount
        from Loan l
        where l.loanDate >= :from and l.loanDate < :to
        group by cast(l.loanDate as date)
        order by day
    """)
    List<LoansPerDayRow> findLoansPerDay(@Param("from") LocalDateTime from,
                                         @Param("to") LocalDateTime to);
}
