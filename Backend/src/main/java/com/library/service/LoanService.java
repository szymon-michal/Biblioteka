package com.library.service;

import com.library.dto.LoanDto;
import com.library.model.entity.BookCopy;
import com.library.model.entity.Loan;
import com.library.model.entity.Reservation;
import com.library.model.enums.BookCopyStatus;
import com.library.model.enums.LoanStatus;
import com.library.model.enums.ReservationStatus;
import com.library.repository.BookCopyRepository;
import com.library.repository.LoanRepository;
import com.library.repository.ReservationRepository;
import com.library.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LoanService {
    private final LoanRepository loanRepository;
    private final BookCopyRepository bookCopyRepository;
    private final ReservationRepository reservationRepository;

    public Page<LoanDto> getUserLoans(Long userId, List<LoanStatus> statuses, Pageable pageable) {
        return loanRepository.findByUserIdAndStatusIn(userId, statuses, pageable)
                .map(this::toDto);
    }

    public Page<LoanDto> getLoans(LoanStatus status, Long userId, Long bookId, 
                                  LocalDateTime fromDate, LocalDateTime toDate, 
                                  Pageable pageable) {
        return loanRepository.findLoansWithFilters(status, userId, bookId, fromDate, toDate, pageable)
                .map(this::toDto);
    }

    @Transactional
    public LoanDto createLoan(Long userId, Long bookId) {
        // Find available copy
        BookCopy availableCopy = bookCopyRepository.findFirstByBookIdAndStatus(bookId, BookCopyStatus.AVAILABLE)
                .orElseThrow(() -> new IllegalStateException("No available copies"));

        // Create loan
        Loan loan = new Loan();
        loan.setUserId(userId);
        loan.setBookCopyId(availableCopy.getId());
        loan.setLoanDate(LocalDateTime.now());
        loan.setDueDate(LocalDateTime.now().plusDays(30)); // 30-day loan period
        loan.setStatus(LoanStatus.ACTIVE);
        loan.setExtensionsCount((short) 0);

        Loan savedLoan = loanRepository.save(loan);

        // Update book copy status
        availableCopy.setStatus(BookCopyStatus.BORROWED);
        bookCopyRepository.save(availableCopy);

        // Mark reservation as fulfilled if exists
        reservationRepository.findByUserIdAndBookIdAndStatus(userId, bookId, ReservationStatus.ACTIVE)
                .ifPresent(reservation -> {
                    reservation.setStatus(ReservationStatus.FULFILLED);
                    reservation.setFulfilledAt(LocalDateTime.now());
                    reservationRepository.save(reservation);
                });

        return toDto(savedLoan);
    }

    @Transactional
    public LoanDto extendLoan(Long loanId, Long userId, Integer additionalDays) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (!loan.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized to extend this loan");
        }

        if (loan.getStatus() != LoanStatus.ACTIVE) {
            throw new IllegalStateException("Can only extend active loans");
        }

        if (loan.getExtensionsCount() >= 2) { // Max 2 extensions
            throw new IllegalStateException("Maximum extensions reached");
        }

        loan.setDueDate(loan.getDueDate().plusDays(additionalDays));
        loan.setExtensionsCount((short) (loan.getExtensionsCount() + 1));

        return toDto(loanRepository.save(loan));
    }

    @Transactional
    public LoanDto returnBook(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        loan.setReturnDate(LocalDateTime.now());
        loan.setStatus(LoanStatus.RETURNED);

        // Update book copy status
        BookCopy bookCopy = bookCopyRepository.findById(loan.getBookCopyId())
                .orElseThrow(() -> new ResourceNotFoundException("Book copy not found"));
        bookCopy.setStatus(BookCopyStatus.AVAILABLE);
        bookCopyRepository.save(bookCopy);

        return toDto(loanRepository.save(loan));
    }

    private LoanDto toDto(Loan loan) {
        LoanDto.UserSummaryDto userDto = new LoanDto.UserSummaryDto(
                loan.getUser().getId(),
                loan.getUser().getFirstName(),
                loan.getUser().getLastName()
        );

        LoanDto.BookSummaryDto bookDto = new LoanDto.BookSummaryDto(
                loan.getBookCopy().getBook().getId(),
                loan.getBookCopy().getBook().getTitle()
        );

        LoanDto.BookCopySummaryDto bookCopyDto = new LoanDto.BookCopySummaryDto(
                loan.getBookCopy().getId(),
                loan.getBookCopy().getInventoryCode(),
                bookDto
        );

        return new LoanDto(
                loan.getId(),
                userDto,
                bookCopyDto,
                loan.getLoanDate(),
                loan.getDueDate(),
                loan.getReturnDate(),
                loan.getStatus(),
                loan.getExtensionsCount()
        );
    }
}