package com.library.controller;

import com.library.dto.LoanDto;
import com.library.dto.request.CreateLoanRequest;
import com.library.dto.request.ExtendLoanRequest;
import com.library.model.enums.LoanStatus;
import com.library.security.CurrentUser;
import com.library.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LoanController {
    private final LoanService loanService;
    private Long getUserId(Authentication auth) {
        // Najczęstsze: principal = custom UserDetails z getId()
        Object p = auth.getPrincipal();
        try {
            return (Long) p.getClass().getMethod("getId").invoke(p);
        } catch (Exception e) {
            // fallback: jeśli sub w JWT to ID i jest jako name
            try {
                return Long.parseLong(auth.getName());
            } catch (Exception ex) {
                throw new IllegalStateException("Nie umiem odczytać userId z Authentication principal");
            }
        }
    }
    @GetMapping("/me/loans")
    public ResponseEntity<Page<LoanDto>> getCurrentUserLoans(
            @CurrentUser Long userId,
            @RequestParam(required = false) LoanStatus status,
            Pageable pageable) {

        List<LoanStatus> statuses = status != null
                ? Arrays.asList(status)
                : Arrays.asList(LoanStatus.values());

        Page<LoanDto> loans = loanService.getUserLoans(userId, statuses, pageable);
        return ResponseEntity.ok(loans);
    }

    @GetMapping("/me/loans/history")
    public ResponseEntity<Page<LoanDto>> getCurrentUserLoanHistory(
            @CurrentUser Long userId,
            Pageable pageable) {

        List<LoanStatus> statuses = Arrays.asList(LoanStatus.RETURNED, LoanStatus.LOST);
        Page<LoanDto> loans = loanService.getUserLoans(userId, statuses, pageable);
        return ResponseEntity.ok(loans);
    }

    @PostMapping("/loans")
    public ResponseEntity<LoanDto> createLoan(
            @CurrentUser Long userId,
            @Valid @RequestBody CreateLoanRequest req
    ) {
        LoanDto loan = loanService.createLoan(userId, req.getBookId());
        return ResponseEntity.status(HttpStatus.CREATED).body(loan);
    }

    @PostMapping("/loans/{loanId}/extend")
    public ResponseEntity<LoanDto> extendLoan(
            @PathVariable Long loanId,
            @RequestBody ExtendLoanRequest req,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        int additionalDays = req.getAdditionalDays() == null ? 7 : req.getAdditionalDays();
        return ResponseEntity.ok(loanService.extendLoan(loanId, userId, additionalDays));
    }


    @PostMapping("/loans/{loanId}/return")
    public ResponseEntity<LoanDto> returnLoan(@PathVariable Long loanId, Authentication auth) {
        Long userId = getUserId(auth);
        return ResponseEntity.ok(loanService.returnBook(loanId, userId));
    }
}

