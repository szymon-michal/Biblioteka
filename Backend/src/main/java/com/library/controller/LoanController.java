package com.library.controller;

import com.library.dto.LoanDto;
import com.library.dto.request.CreateLoanRequest;
import com.library.dto.request.ExtendLoanRequest;
import com.library.model.enums.LoanStatus;
import com.library.service.LoanService;
import com.library.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LoanController {
    private final LoanService loanService;

    @GetMapping("/me/loans")
    public ResponseEntity<Page<LoanDto>> getCurrentUserLoans(
            @CurrentUser Long userId,
            @RequestParam(required = false) LoanStatus status,
            Pageable pageable) {
        
        List<LoanStatus> statuses = status != null ? 
                Arrays.asList(status) : 
                Arrays.asList(LoanStatus.ACTIVE, LoanStatus.OVERDUE);
        
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
    public ResponseEntity<LoanDto> createLoan(@CurrentUser Long userId, 
                                              @Valid @RequestBody CreateLoanRequest request) {
        LoanDto loan = loanService.createLoan(userId, request.getBookId());
        return ResponseEntity.status(HttpStatus.CREATED).body(loan);
    }

    @PostMapping("/loans/{id}/extend")
    public ResponseEntity<LoanDto> extendLoan(@CurrentUser Long userId, 
                                              @PathVariable Long id,
                                              @Valid @RequestBody ExtendLoanRequest request) {
        LoanDto loan = loanService.extendLoan(id, userId, request.getAdditionalDays());
        return ResponseEntity.ok(loan);
    }
}