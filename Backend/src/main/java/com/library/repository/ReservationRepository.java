package com.library.repository;

import com.library.model.entity.Reservation;
import com.library.model.enums.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    @Query("SELECT r FROM Reservation r WHERE r.userId = :userId AND r.status = :status")
    Page<Reservation> findByUserIdAndStatus(@Param("userId") Long userId, 
                                            @Param("status") ReservationStatus status, 
                                            Pageable pageable);

    @Query("SELECT r FROM Reservation r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:userId IS NULL OR r.userId = :userId) AND " +
           "(:bookId IS NULL OR r.bookId = :bookId)")
    Page<Reservation> findReservationsWithFilters(@Param("status") ReservationStatus status,
                                                   @Param("userId") Long userId,
                                                   @Param("bookId") Long bookId,
                                                   Pageable pageable);

    Optional<Reservation> findByUserIdAndBookIdAndStatus(Long userId, Long bookId, ReservationStatus status);

    boolean existsByUserIdAndBookIdAndStatus(Long userId, Long bookId, ReservationStatus status);
}