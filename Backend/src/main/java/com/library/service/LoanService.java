package com.library.service;

import com.library.dto.AuthorDto;
import com.library.dto.LoanDto;
import com.library.exception.ResourceNotFoundException;
import com.library.model.entity.AppUser;
import com.library.model.entity.Author;
import com.library.model.entity.BookCopy;
import com.library.model.entity.Loan;
import com.library.model.enums.BookCopyStatus;
import com.library.model.enums.LoanStatus;
import com.library.model.enums.ReservationStatus;
import com.library.repository.AppUserRepository;
import com.library.repository.BookCopyRepository;
import com.library.repository.LoanRepository;
import com.library.repository.ReservationRepository;
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
@Transactional(readOnly = true)
public class LoanService {
    private final LoanRepository loanRepository;
    private final BookCopyRepository bookCopyRepository;
    private final ReservationRepository reservationRepository;
    private final AppUserRepository appUserRepository;

    public Page<LoanDto> getUserLoans(Long userId, List<LoanStatus> statuses, Pageable pageable) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Brak JWT / niezalogowany użytkownik");
        }
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
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Brak JWT / niezalogowany użytkownik");
        }
        if (bookId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bookId jest wymagane");
        }

        BookCopy availableCopy = bookCopyRepository
                .findFirstByBookIdAndStatus(bookId, BookCopyStatus.AVAILABLE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Brak dostępnych egzemplarzy"));

        AppUser userRef = appUserRepository.getReferenceById(userId);

        Loan loan = new Loan();
        loan.setUserId(userId);
        loan.setBookCopyId(availableCopy.getId());
        loan.setLoanDate(LocalDateTime.now());
        loan.setDueDate(LocalDateTime.now().plusDays(30));
        loan.setStatus(LoanStatus.ACTIVE);
        loan.setExtensionsCount((short) 0);

        // relacje (żeby toDto nie waliło NPE)
        loan.setUser(userRef);
        loan.setBookCopy(availableCopy);

        Loan savedLoan = loanRepository.save(loan);

        availableCopy.setStatus(BookCopyStatus.BORROWED);
        bookCopyRepository.save(availableCopy);

        reservationRepository.findByUserIdAndBookIdAndStatus(userId, bookId, ReservationStatus.ACTIVE)
                .ifPresent(reservation -> {
                    reservation.setStatus(ReservationStatus.FULFILLED);
                    reservation.setFulfilledAt(LocalDateTime.now());
                    reservationRepository.save(reservation);
                });

        savedLoan.setUser(userRef);
        savedLoan.setBookCopy(availableCopy);

        return toDto(savedLoan);
    }

    /**
     * Limit: max 2 przedłużenia.
     * Po przekroczeniu -> 409 + message dla frontu.
     */
    @Transactional
    public LoanDto extendLoan(Long loanId, Long userId, Integer additionalDays) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Brak JWT / niezalogowany użytkownik");
        }

        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (!loan.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nie możesz przedłużyć cudzego wypożyczenia");
        }

        if (loan.getStatus() != LoanStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Można przedłużyć tylko aktywne wypożyczenie");
        }

        short current = loan.getExtensionsCount() == null ? 0 : loan.getExtensionsCount();
        if (current >= 2) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Maksymalna liczba przedłużeń (2) została osiągnięta"
            );
        }

        int days = (additionalDays == null || additionalDays <= 0) ? 7 : additionalDays;

        loan.setDueDate(loan.getDueDate().plusDays(days));
        loan.setExtensionsCount((short) (current + 1));

        return toDto(loanRepository.save(loan));
    }

    /**
     * Zwrot: tylko właściciel i tylko gdy ACTIVE.
     */
    @Transactional
    public LoanDto returnBook(Long loanId, Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Brak JWT / niezalogowany użytkownik");
        }

        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (!loan.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nie możesz zwrócić cudzego wypożyczenia");
        }

        if (loan.getStatus() != LoanStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Można zwrócić tylko aktywne wypożyczenie");
        }

        loan.setReturnDate(LocalDateTime.now());
        loan.setStatus(LoanStatus.RETURNED);
        loanRepository.save(loan);

        BookCopy bookCopy = bookCopyRepository.findById(loan.getBookCopyId())
                .orElseThrow(() -> new ResourceNotFoundException("Book copy not found"));

        bookCopy.setStatus(BookCopyStatus.AVAILABLE);
        bookCopyRepository.save(bookCopy);

        return toDto(loanRepository.save(loan));
    }

    /**
     * Zachowuję starą sygnaturę (jeśli gdzieś wołasz ją bez usera),
     * ale lepiej używać returnBook(id, userId).
     */
    @Transactional
    public LoanDto returnBook(Long loanId) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Użyj endpointu /api/loans/{id}/return (wymaga JWT)");
    }

    private LoanDto toDto(Loan loan) {
        AppUser user = loan.getUser();
        if (user == null && loan.getUserId() != null) {
            user = appUserRepository.getReferenceById(loan.getUserId());
            loan.setUser(user);
        }

        BookCopy bookCopy = loan.getBookCopy();
        if (bookCopy == null && loan.getBookCopyId() != null) {
            bookCopy = bookCopyRepository.getReferenceById(loan.getBookCopyId());
            loan.setBookCopy(bookCopy);
        }

        LoanDto.UserSummaryDto userDto = new LoanDto.UserSummaryDto(
                user.getId(),
                user.getFirstName(),
                user.getLastName()
        );

        var bookEntity = bookCopy.getBook();

        LoanDto.BookSummaryDto bookDto = new LoanDto.BookSummaryDto(
                bookEntity.getId(),
                bookEntity.getTitle(),
                toAuthorDtos(bookEntity.getAuthors())
        );


        LoanDto.BookCopySummaryDto bookCopyDto = new LoanDto.BookCopySummaryDto(
                bookCopy.getId(),
                bookCopy.getInventoryCode(),
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
    private List<AuthorDto> toAuthorDtos(List<Author> authors) {
        if (authors == null || authors.isEmpty()) return Collections.emptyList();
        return authors.stream()
                .map(a -> new AuthorDto(a.getId(), a.getFirstName(), a.getLastName()))
                .collect(Collectors.toList());
    }
}
