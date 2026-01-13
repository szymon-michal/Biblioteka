package com.library.service;

import com.library.dto.AuthResponse;
import com.library.dto.UserDto;
import com.library.dto.request.LoginRequest;
import com.library.dto.request.RegisterRequest;
import com.library.model.entity.AppUser;
import com.library.model.enums.UserRole;
import com.library.model.enums.UserStatus;
import com.library.repository.AppUserRepository;
import com.library.security.JwtTokenProvider;
import com.library.exception.AuthenticationException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {
    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public UserDto register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        AppUser user = new AppUser();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setRole(UserRole.READER);
        user.setStatus(UserStatus.ACTIVE);
        user.setCreatedAt(LocalDateTime.now());

        AppUser savedUser = userRepository.save(user);
        return toUserDto(savedUser);
    }

    public AuthResponse login(LoginRequest request) {
        AppUser user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthenticationException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthenticationException("Invalid credentials");
        }

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new AuthenticationException("Account is blocked");
        }

        String token = tokenProvider.generateToken(user);
        return new AuthResponse(token, toUserDto(user));
    }

    public UserDto getCurrentUser(Long userId) {

        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationException("User not found"));
        return toUserDto(user);
    }

    private UserDto toUserDto(AppUser user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.getStatus(),
                user.getBlockedReason(),
                user.getBlockedUntil(),
                user.getCreatedAt()
        );
    }
}