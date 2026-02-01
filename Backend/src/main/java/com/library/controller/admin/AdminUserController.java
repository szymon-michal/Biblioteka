package com.library.controller.admin;

import com.library.dto.LoanDto;
import com.library.dto.PenaltyDto;
import com.library.dto.UserDto;
import com.library.dto.request.UpdateUserStatusRequest;
import com.library.model.enums.PenaltyStatus;
import com.library.model.enums.UserRole;
import com.library.model.enums.UserStatus;
import com.library.service.LoanService;
import com.library.service.PenaltyService;
import com.library.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import com.library.dto.request.UpdateUserRequest;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {
    private final UserService userService;
    private final LoanService loanService;
    private final PenaltyService penaltyService;

    @GetMapping
    public ResponseEntity<Page<UserDto>> getUsers(
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        Page<UserDto> users = userService.getUsers(role, status, search, pageable);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getUserDetails(@PathVariable Long id) {
        UserDto user = userService.getUserById(id);
        // Note: In a full implementation, you'd also get active loans here
        return ResponseEntity.ok(Map.of("user", user));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<UserDto> updateUserStatus(@PathVariable Long id, 
                                                    @RequestBody UpdateUserStatusRequest request) {
        UserDto user = userService.updateUserStatus(id, request.getStatus(), 
                request.getBlockedReason(), request.getBlockedUntil());
        return ResponseEntity.ok(user);
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Map<String, String>> resetUserPassword(@PathVariable Long id) {
        String tempPassword = userService.resetUserPassword(id);
        return ResponseEntity.ok(Map.of("temporaryPassword", tempPassword));
    }
//    @PutMapping("/{id}")
//    public UserDto update(
//            @PathVariable Long id,
//            @RequestBody UpdateUserRequest req
//    ) {
//        return userService.updateUser(id, req);
//    }
//
//    @DeleteMapping("/{id}")
//    public void delete(@PathVariable Long id) {
//        userService.deleteUser(id);
//    }
    @PutMapping("/api/admin/users/{id}")
    public ResponseEntity<UserDto> update(@PathVariable Long id, @RequestBody @Valid UpdateUserRequest req) {
        return ResponseEntity.ok(userService.updateUser(id, req));
    }

    @DeleteMapping("/api/admin/users/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

}