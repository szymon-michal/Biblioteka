package com.library.controller.admin;

import com.library.dto.BookDto;
import com.library.dto.admin.AdminCreateBookRequest;
import com.library.dto.admin.AdminUpdateBookRequest;
import com.library.service.admin.AdminBookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/books")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBookController {

    private final AdminBookService adminBookService;

    @GetMapping
    public Page<BookDto> list(@PageableDefault(size = 20) Pageable pageable) {
        return adminBookService.list(pageable);
    }

    @PostMapping
    public ResponseEntity<BookDto> create(@Valid @RequestBody AdminCreateBookRequest req) {
        return ResponseEntity.ok(adminBookService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookDto> update(@PathVariable Long id, @Valid @RequestBody AdminUpdateBookRequest req) {
        return ResponseEntity.ok(adminBookService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        adminBookService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
