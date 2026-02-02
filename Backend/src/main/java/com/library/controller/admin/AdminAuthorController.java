package com.library.controller.admin;

import com.library.dto.AuthorDto;
import com.library.dto.admin.AdminAuthorRequest;
import com.library.repository.AuthorRepository;
import com.library.service.admin.AdminAuthorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/authors")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuthorController {

    private final AdminAuthorService adminAuthorService;
    private final AuthorRepository authorRepository;

    @GetMapping
    public Page<AuthorDto> list(@PageableDefault(size = 20) Pageable pageable) {
        return adminAuthorService.list(pageable);
    }

    @PostMapping
    public ResponseEntity<AuthorDto> create(@Valid @RequestBody AdminAuthorRequest req) {
        return ResponseEntity.ok(adminAuthorService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AuthorDto> update(@PathVariable Long id, @Valid @RequestBody AdminAuthorRequest req) {
        return ResponseEntity.ok(adminAuthorService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        adminAuthorService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
