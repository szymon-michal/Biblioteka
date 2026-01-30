package com.library.controller;

import com.library.dto.AuthResponse;
import com.library.dto.UserDto;
import com.library.dto.request.ChangePasswordRequest;
import com.library.dto.request.LoginRequest;
import com.library.dto.request.RegisterRequest;
import com.library.dto.request.UpdateProfileRequest;
import com.library.service.AuthService;
import com.library.service.UserService;
import com.library.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest request) {
        UserDto user = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        System.out.println(">>> LOGIN REQUEST RECEIVED: " + request.getEmail());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@CurrentUser Long userId) {
        UserDto user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/change-password")
    public ResponseEntity<Void> changePassword(@CurrentUser Long userId, 
                                               @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userId, request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/me/profile")
    public ResponseEntity<UserDto> updateProfile(@CurrentUser Long userId, 
                                                 @Valid @RequestBody UpdateProfileRequest request) {
        UserDto user = userService.updateUserProfile(userId, request);
        return ResponseEntity.ok(user);
    }
}