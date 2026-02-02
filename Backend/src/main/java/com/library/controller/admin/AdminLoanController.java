package com.library.controller.admin;

import com.library.dto.LoanDto;
import com.library.model.enums.LoanStatus;
import com.library.service.admin.AdminLoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/loans")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminLoanController {

    private final AdminLoanService adminLoanService;

    @GetMapping
    public Page<LoanDto> list(Pageable pageable) {
        return adminLoanService.list(pageable);
    }

    @GetMapping("/{id}")
    public LoanDto get(@PathVariable Long id) {
        return adminLoanService.get(id);
    }

    @PostMapping
    public ResponseEntity<LoanDto> create(@RequestParam Long userId,
                                       @RequestParam Long bookCopyId,
                                       @RequestParam(required = false) LocalDateTime dueDate) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminLoanService.create(userId, bookCopyId, dueDate));
    }

    @PutMapping("/{id}")
    public LoanDto update(@PathVariable Long id,
                       @RequestParam(required = false) LoanStatus status,
                       @RequestParam(required = false) LocalDateTime dueDate,
                       @RequestParam(required = false) LocalDateTime returnDate) {
        return adminLoanService.update(id, status, dueDate, returnDate);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        adminLoanService.delete(id);
    }
}
