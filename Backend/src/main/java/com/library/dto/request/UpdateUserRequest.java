package com.library.dto.request;

import com.library.model.enums.UserRole;
import com.library.model.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    private String email;
    private String firstName;
    private String lastName;

    private UserRole role;
    private UserStatus status;

    // opcjonalnie, jeśli chcesz to też edytować w tym samym PUT:
    private String blockedReason;
    private LocalDateTime blockedUntil;
}
