package com.library.service;

import com.library.dto.LoanDto;
import com.library.model.entity.AppUser;
import com.library.model.entity.Author;
import com.library.model.entity.Book;
import com.library.model.entity.BookCopy;
import com.library.model.entity.Loan;
import com.library.repository.BookCopyRepository;
import com.library.repository.LoanRepository;
import com.library.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final BookCopyRepository bookCopyRepository;
    private final AppUserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<LoanDto> getMyLoans(Long userId, Pageable pageable) {
        return loanRepository.findByUserId(userId, pageable).map(this::toDto);
    }

    @Transactional
    public LoanDto extendLoan(Long loanId, Long userId, int additionalDays) {
        if (additionalDays <= 0 || additionalDays > 30) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "additionalDays musi być w zakresie 1..30");
        }

        Loan loan = loanRepository.findByIdAndUserId(loanId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono wypożyczenia"));

        if (!"ACTIVE".equalsIgnoreCase(loan.getStatus().name())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Można przedłużać tylko aktywne wypożyczenia");
        }

        Integer cnt = Integer.valueOf(loan.getExtensionsCount() == null ? 0 : loan.getExtensionsCount());
        if (cnt >= 2) {
            // to ma trafić na front jako komunikat
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Limit przedłużeń został osiągnięty (max 2).");
        }

        loan.setDueDate(loan.getDueDate().plusDays(additionalDays));
        loan.setExtensionsCount((short) (cnt + 1));

        Loan saved = loanRepository.save(loan);
        return toDto(saved);
    }

    @Transactional
    public LoanDto returnLoan(Long loanId, Long userId) {
        Loan loan = loanRepository.findByIdAndUserId(loanId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono wypożyczenia"));

        if (!"ACTIVE".equalsIgnoreCase(loan.getStatus().name())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "To wypożyczenie nie jest aktywne");
        }

        loan.setReturnDate(LocalDateTime.now());
        loan.setStatus(com.library.model.enums.LoanStatus.RETURNED);

        // jeśli masz status egzemplarza:
        BookCopy copy = loan.getBookCopy();
        if (copy != null && copy.getStatus() != null) {
            // dopasuj enum/nazwy do siebie
            try {
                copy.setStatus(com.library.model.enums.BookCopyStatus.AVAILABLE);
                bookCopyRepository.save(copy);
            } catch (Exception ignored) {
                // jeśli nie masz enumów albo masz inne — zostaw
            }
        }

        Loan saved = loanRepository.save(loan);
        return toDto(saved);
    }

    private LoanDto toDto(Loan loan) {
        AppUser u = loan.getUser();
        BookCopy bc = loan.getBookCopy();
        Book b = (bc != null) ? bc.getBook() : null;

        List<LoanDto.AuthorSummaryDto> authors = Collections.emptyList();
        if (b != null && b.getAuthors() != null) {
            authors = b.getAuthors().stream()
                    .map(this::toAuthorSummary)
                    .collect(Collectors.toList());
        }

        return new LoanDto(
                loan.getId(),
                u == null ? null : new LoanDto.UserSummaryDto(u.getId(), u.getFirstName(), u.getLastName()),
                bc == null ? null : new LoanDto.BookCopySummaryDto(
                        bc.getId(),
                        bc.getInventoryCode(),
                        b == null ? null : new LoanDto.BookSummaryDto(b.getId(), b.getTitle(), authors)
                ),
                loan.getLoanDate(),
                loan.getDueDate(),
                loan.getReturnDate(),
                loan.getStatus().name(),
                loan.getExtensionsCount()
        );
    }

    private LoanDto.AuthorSummaryDto toAuthorSummary(Author a) {
        if (a == null) return null;
        // dopasuj nazwy getterów do swojej encji Author
        return new LoanDto.AuthorSummaryDto(
                a.getId(),
                a.getFirstName(),
                a.getLastName()
        );
    }
}
