package com.library.repository.admin;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AdminStatsRepository extends Repository<com.library.model.entity.Loan, Long> {

    @Query(value = "select count(*) from loan l where l.loan_date >= :fromDt and l.loan_date < :toDt", nativeQuery = true)
    long countLoansInRange(@Param("fromDt") LocalDateTime fromDt,
                           @Param("toDt") LocalDateTime toDt);

    @Query(value = "select count(*) from app_user u where u.created_at >= :fromDt and u.created_at < :toDt", nativeQuery = true)
    long countNewUsersInRange(@Param("fromDt") LocalDateTime fromDt,
                              @Param("toDt") LocalDateTime toDt);

    @Query(value = "select count(distinct l.user_id) from loan l where l.loan_date >= :fromDt and l.loan_date < :toDt", nativeQuery = true)
    long countActiveUsersInRange(@Param("fromDt") LocalDateTime fromDt,
                                 @Param("toDt") LocalDateTime toDt);

    @Query(value = "select count(*) from loan l where l.status = 'ACTIVE' and l.due_date < now()", nativeQuery = true)
    long countOverdueLoansNow();

    interface LoansPerDayRow {
        String getDay();          // yyyy-MM-dd
        Long getLoansCount();
    }

    @Query(value = """
            select to_char(date(l.loan_date), 'YYYY-MM-DD') as day,
                   count(*) as loansCount
            from loan l
            where l.loan_date >= :fromDt and l.loan_date < :toDt
            group by date(l.loan_date)
            order by date(l.loan_date)
            """, nativeQuery = true)
    List<LoansPerDayRow> loansPerDay(@Param("fromDt") LocalDateTime fromDt,
                                     @Param("toDt") LocalDateTime toDt);

    interface PopularBookRow {
        Long getBookId();
        String getTitle();
        Long getLoansCount();
    }

    @Query(value = """
            select b.id as bookId,
                   b.title as title,
                   count(*) as loansCount
            from loan l
            join book_copy bc on bc.id = l.book_copy_id
            join book b on b.id = bc.book_id
            where l.loan_date >= :fromDt and l.loan_date < :toDt
            group by b.id, b.title
            order by loansCount desc
            limit :limit
            """, nativeQuery = true)
    List<PopularBookRow> mostPopularBooks(@Param("fromDt") LocalDateTime fromDt,
                                          @Param("toDt") LocalDateTime toDt,
                                          @Param("limit") int limit);
}
