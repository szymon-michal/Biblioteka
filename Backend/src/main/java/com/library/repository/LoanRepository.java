package com.library.repository;

import com.library.model.entity.Loan;
import com.library.model.enums.LoanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import com.library.dto.admin.AdminLoansPerDayDto;
import com.library.dto.admin.AdminSummaryDto;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    @Query("SELECT l FROM Loan l WHERE l.userId = :userId AND l.status IN :statuses")
    Page<Loan> findByUserIdAndStatusIn(@Param("userId") Long userId, 
                                       @Param("statuses") List<LoanStatus> statuses, 
                                       Pageable pageable);

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

    List<Loan> findByUserIdAndStatusIn(Long userId, List<LoanStatus> statuses);

    @Query("SELECT l FROM Loan l WHERE l.status = 'ACTIVE' AND l.dueDate < :now")
    List<Loan> findOverdueLoans(@Param("now") LocalDateTime now);
    @Query("""
   select count(l)
   from Loan l
   where l.loanDate between :from and :to
""")
    long countLoansBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
   select count(l)
   from Loan l
   where l.returnDate is null
     and l.dueDate < :now
""")
    long countOverdueLoans(@Param("now") LocalDateTime now);

    @Query("""
   select new com.library.dto.admin.AdminSummaryDto$MostPopularBookDto(
      b.id, b.title, count(l)
   )
   from Loan l
     join l.bookCopy bc
     join bc.book b
   where l.loanDate between :from and :to
   group by b.id, b.title
   order by count(l) desc
""")
    List<AdminSummaryDto.MostPopularBookDto> findMostPopularBooks(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
   select new com.library.dto.admin.AdminLoansPerDayDto(
      function('date', l.loanDate),
      count(l)
   )
   from Loan l
   where l.loanDate between :from and :to
   group by function('date', l.loanDate)
   order by function('date', l.loanDate)
""")
    List<AdminLoansPerDayDto> findLoansPerDay(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

}