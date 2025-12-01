package com.library.repository;

import com.library.model.entity.Penalty;
import com.library.model.enums.PenaltyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PenaltyRepository extends JpaRepository<Penalty, Long> {
    @Query("SELECT p FROM Penalty p WHERE p.userId = :userId AND " +
           "(:status IS NULL OR p.status = :status)")
    Page<Penalty> findByUserIdAndStatus(@Param("userId") Long userId, 
                                        @Param("status") PenaltyStatus status, 
                                        Pageable pageable);

    @Query("SELECT p FROM Penalty p WHERE " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:userId IS NULL OR p.userId = :userId)")
    Page<Penalty> findPenaltiesWithFilters(@Param("status") PenaltyStatus status,
                                           @Param("userId") Long userId,
                                           Pageable pageable);
}