package com.library.controller;

import com.library.dto.LoanDto;
import com.library.service.LoanService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    // Jeśli masz własne UserDetails/JWT i trzymasz userId w principalu,
    // to dopasuj getUserId(...) do swojego rozwiązania.
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
    public ResponseEntity<Page<LoanDto>> myLoans(Authentication auth, Pageable pageable) {
        Long userId = getUserId(auth);
        return ResponseEntity.ok(loanService.getMyLoans(userId, pageable));
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
        return ResponseEntity.ok(loanService.returnLoan(loanId, userId));
    }

    @Data
    public static class ExtendLoanRequest {
        private Integer additionalDays;
    }
}
