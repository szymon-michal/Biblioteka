package com.library.service;

import com.library.dto.UserDto;
import com.library.dto.request.ChangePasswordRequest;
import com.library.dto.request.UpdateProfileRequest;
import com.library.dto.request.UpdateUserRequest;
import com.library.model.entity.AppUser;
import com.library.model.enums.UserRole;
import com.library.model.enums.UserStatus;
import com.library.repository.AppUserRepository;
import com.library.exception.ResourceNotFoundException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {
    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserDto updateUser(Long id, UpdateUserRequest req) {
        AppUser u = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));

        if (req.getEmail() != null) u.setEmail(req.getEmail().trim());
        if (req.getFirstName() != null) u.setFirstName(req.getFirstName().trim());
        if (req.getLastName() != null) u.setLastName(req.getLastName().trim());
        if (req.getRole() != null) u.setRole(req.getRole());
        if (req.getStatus() != null) u.setStatus(req.getStatus());

        // opcjonalnie:
        if (req.getBlockedReason() != null || req.getBlockedUntil() != null) {
            u.setBlockedReason(req.getBlockedReason());
            u.setBlockedUntil(req.getBlockedUntil());
        }

        AppUser saved = userRepository.save(u);

        // return userMapper.toDto(saved);
        return toDto(saved); // <- podmień na swój mapper
    }


    @Transactional
    public void deleteUser(Long id) {
        AppUser u = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));

        userRepository.delete(u);
    }

    public Page<UserDto> getUsers(UserRole role, UserStatus status, String search, Pageable pageable) {
        return userRepository.findUsersWithFilters(role, status, search, pageable)
                .map(this::toDto);
    }

    public UserDto getUserById(Long id) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toDto(user);
    }

    @Transactional
    public UserDto updateUserProfile(Long userId, UpdateProfileRequest request) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        
        return toDto(userRepository.save(user));
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserDto updateUserStatus(Long userId, UserStatus status, String reason, java.time.LocalDateTime blockedUntil) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        user.setStatus(status);
        user.setBlockedReason(reason);
        user.setBlockedUntil(blockedUntil);
        
        return toDto(userRepository.save(user));
    }

    @Transactional
    public String resetUserPassword(Long userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        String tempPassword = generateTemporaryPassword();
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        userRepository.save(user);
        
        return tempPassword;
    }

    private String generateTemporaryPassword() {
        return "TempPass123!";  // In production, generate a random password
    }

    private UserDto toDto(AppUser user) {
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