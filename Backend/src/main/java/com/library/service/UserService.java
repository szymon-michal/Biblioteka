package com.library.service;

import com.library.dto.UserDto;
import com.library.dto.request.ChangePasswordRequest;
import com.library.dto.request.UpdateProfileRequest;
import com.library.dto.request.UpdateUserRequest;
import com.library.exception.ResourceNotFoundException;
import com.library.model.entity.AppUser;
import com.library.repository.AppUserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestBody;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.time.chrono.ChronoLocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(int page, int size) {
        // UI i tak woła ?page=0&size=200 – zwracamy listę, bez Page wrappera
        var pr = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1),
                Sort.by(Sort.Direction.DESC, "id")
        );

        return appUserRepository.findAll(pr)
                .getContent()
                .stream()
                .map(this::toAdminUserMap)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> picker() {
        // prosta lista do select/autocomplete: id + label
        return appUserRepository.findAll(Sort.by(Sort.Direction.ASC, "lastName", "firstName", "id"))
                .stream()
                .map(u -> {
                    String fn = safeString(getFieldValue(u, "firstName"));
                    String ln = safeString(getFieldValue(u, "lastName"));
                    String email = safeString(getFieldValue(u, "email"));
                    String label = (fn + " " + ln).trim();
                    if (label.isBlank()) label = email;

                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("label", label);
                    m.put("email", email);
                    return m;
                })
                .toList();
    }

    @Transactional
    public UserDto updateUser(Long id, @Valid @RequestBody UpdateUserRequest req) {
        AppUser u = appUserRepository.findById(id)
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

        AppUser saved = appUserRepository.save(u);

        // return userMapper.toDto(saved);
        return toDto(saved); // <- podmień na swój mapper
    }
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        appUserRepository.save(user);
    }

    @Transactional
    public void adminSetPassword(Long userId, String newPassword) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        appUserRepository.save(user);
    }
    @Transactional
    public void deleteUser(Long id) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));

        // Prefer soft delete: status = "DELETED" jeśli istnieje pole status
        boolean softDeleted = setEnumByName(user, "status", "DELETED");
        if (softDeleted) {
            appUserRepository.save(user);
            return;
        }

        // Fallback hard delete
        appUserRepository.delete(user);
    }

    // ----------------- helpers -----------------

    private Map<String, Object> toAdminUserMap(AppUser u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("email", getFieldValue(u, "email"));
        m.put("firstName", getFieldValue(u, "firstName"));
        m.put("lastName", getFieldValue(u, "lastName"));
        m.put("role", enumName(getFieldValue(u, "role")));
        m.put("status", enumName(getFieldValue(u, "status")));
        m.put("blockedReason", getFieldValue(u, "blockedReason"));
        m.put("blockedUntil", stringifyDate(getFieldValue(u, "blockedUntil")));
        m.put("createdAt", stringifyDate(getFieldValue(u, "createdAt")));
        return m;
    }

    private static String stringifyDate(Object v) {
        return v == null ? null : String.valueOf(v);
    }

    private static String enumName(Object v) {
        if (v == null) return null;
        if (v instanceof Enum<?> e) return e.name();
        return String.valueOf(v);
    }

    private static String safeString(Object v) {
        return v == null ? "" : String.valueOf(v);
    }

    private static Object getFieldValue(Object target, String fieldName) {
        try {
            Field f = findField(target.getClass(), fieldName);
            if (f == null) return null;
            f.setAccessible(true);
            return f.get(target);
        } catch (Exception ignored) {
            return null;
        }
    }

    private static void setIfPresent(Object target, String fieldName, Object value) {
        try {
            Field f = findField(target.getClass(), fieldName);
            if (f == null) return;
            f.setAccessible(true);
            f.set(target, value);
        } catch (Exception ignored) {
        }
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private static boolean setEnumByName(Object target, String fieldName, String enumName) {
        try {
            Field f = findField(target.getClass(), fieldName);
            if (f == null) return false;

            Class<?> t = f.getType();
            if (!t.isEnum()) return false;

            Object enumValue = Enum.valueOf((Class<? extends Enum>) t, enumName);
            f.setAccessible(true);
            f.set(target, enumValue);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    private static Field findField(Class<?> cls, String name) {
        Class<?> c = cls;
        while (c != null && c != Object.class) {
            try {
                return c.getDeclaredField(name);
            } catch (NoSuchFieldException ignored) {
                c = c.getSuperclass();
            }
        }
        return null;
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
