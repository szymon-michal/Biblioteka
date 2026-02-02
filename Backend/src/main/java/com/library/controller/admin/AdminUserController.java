package com.library.controller.admin;

import com.library.dto.UserDto;
import com.library.dto.request.AdminSetPasswordRequest;
import com.library.dto.request.UpdateUserRequest;
import com.library.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "200") int size
    ) {
        return ResponseEntity.ok(userService.list(page, size));
    }

    @GetMapping("/picker")
    public ResponseEntity<List<Map<String, Object>>> picker() {
        return ResponseEntity.ok(userService.picker());
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDto> update(@PathVariable Long id, @RequestBody @Valid UpdateUserRequest req) {
        return ResponseEntity.ok(userService.updateUser(id, req));
    }

    @PatchMapping("/{id}/password")
    public ResponseEntity<Void> setPassword(@PathVariable Long id, @RequestBody @Valid AdminSetPasswordRequest req) {
        userService.adminSetPassword(id, req.getNewPassword());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
