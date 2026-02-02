package com.library.dto;

import com.library.model.entity.AppUser;
import com.library.model.enums.UserRole;
import com.library.model.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private UserRole role;
    private UserStatus status;
    private String blockedReason;
    private LocalDateTime blockedUntil;
    private LocalDateTime createdAt;

    public static UserDto from(AppUser u) {
        UserDto dto = new UserDto();
        dto.setId(u.getId());
        dto.setEmail(u.getEmail());
        dto.setFirstName(u.getFirstName());
        dto.setLastName(u.getLastName());
        dto.setRole(u.getRole());
        dto.setStatus(u.getStatus());
        dto.setBlockedReason(u.getBlockedReason());
        dto.setBlockedUntil(u.getBlockedUntil());
        dto.setCreatedAt(u.getCreatedAt());
        return dto;
    }
}