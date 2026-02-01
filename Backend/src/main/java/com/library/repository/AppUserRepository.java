package com.library.repository;

import com.library.model.entity.AppUser;
import com.library.model.enums.UserRole;
import com.library.model.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM AppUser u WHERE " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:status IS NULL OR u.status = :status) AND " +
           "(:search IS NULL OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<AppUser> findUsersWithFilters(@Param("role") UserRole role,
                                       @Param("status") UserStatus status,
                                       @Param("search") String search,
                                       Pageable pageable);
    @Query("select count(u) from AppUser u where u.createdAt between :from and :to")
    long countNewUsersBetween(@Param("from") LocalDateTime from,
                              @Param("to") LocalDateTime to);

    @Query("select count(u) from AppUser u where u.status = com.library.model.enums.UserStatus.ACTIVE")
    long countActiveUsers();


}