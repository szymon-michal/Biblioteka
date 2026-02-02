package com.library.service.admin;

import com.library.dto.AuthorDto;
import com.library.dto.LoanDto;
import com.library.model.entity.AppUser;
import com.library.model.entity.Author;
import com.library.model.entity.Book;
import com.library.model.entity.BookCopy;
import com.library.model.entity.Loan;
import com.library.model.enums.LoanStatus;
import com.library.repository.LoanRepository;
import com.library.repository.BookCopyRepository;
import com.library.repository.AppUserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminLoanService {

    private final LoanRepository loanRepository;
    private final BookCopyRepository bookCopyRepository;
    private final AppUserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<LoanDto> list(Pageable pageable) {
        return loanRepository.findAll(pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public LoanDto get(Long id) {
        return loanRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Loan not found"));
    }

    @Transactional
    public LoanDto create(Long userId, Long bookCopyId, LocalDateTime dueDate) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        BookCopy copy = bookCopyRepository.findById(bookCopyId)
                .orElseThrow(() -> new EntityNotFoundException("Copy not found"));

        if (!copy.isAvailable()) {
            throw new IllegalStateException("Book copy not available");
        }

        Loan loan = new Loan();
        loan.setUser(user);
        loan.setBookCopy(copy);
        loan.setStatus(LoanStatus.ACTIVE);
        loan.setLoanDate(LocalDateTime.now());
        loan.setDueDate(dueDate != null ? dueDate : LocalDateTime.now().plusDays(14));

        copy.setAvailable(false);
        bookCopyRepository.save(copy);

        return toDto(loanRepository.save(loan));
    }

    @Transactional
    public LoanDto update(Long id, LoanStatus status, LocalDateTime dueDate, LocalDateTime returnDate) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Loan not found"));

        if (status != null) {
            loan.setStatus(status);
        }
        if (dueDate != null) {
            loan.setDueDate(dueDate);
        }
        if (returnDate != null) {
            loan.setReturnDate(returnDate);
        }

        if (status == LoanStatus.RETURNED) {
            BookCopy copy = loan.getBookCopy();
            copy.setAvailable(true);
            bookCopyRepository.save(copy);
        }

        return toDto(loanRepository.save(loan));
    }

    @Transactional
    public void delete(Long id) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Loan not found"));

        if (loan.getStatus() == LoanStatus.ACTIVE) {
            BookCopy copy = loan.getBookCopy();
            copy.setAvailable(true);
            bookCopyRepository.save(copy);
        }

        loanRepository.delete(loan);
    }

    private LoanDto toDto(Loan loan) {
        LoanDto.UserSummaryDto userDto = null;
        AppUser user = loan.getUser();
        if (user != null) {
            userDto = new LoanDto.UserSummaryDto(user.getId(), user.getFirstName(), user.getLastName());
        }

        LoanDto.BookCopySummaryDto copyDto = null;
        BookCopy copy = loan.getBookCopy();
        if (copy != null) {
            LoanDto.BookSummaryDto bookDto = null;
            Book book = copy.getBook();
            if (book != null) {
                var authors = book.getAuthors();
                var authorDtos = authors == null
                        ? java.util.List.<AuthorDto>of()
                        : authors.stream()
                        .filter(java.util.Objects::nonNull)
                        .map(a -> new AuthorDto(a.getId(), a.getFirstName(), a.getLastName()))
                        .toList();

                bookDto = new LoanDto.BookSummaryDto(book.getId(), book.getTitle(), authorDtos);
            }

            copyDto = new LoanDto.BookCopySummaryDto(copy.getId(), copy.getInventoryCode(), bookDto);
        }

        return new LoanDto(
                loan.getId(),
                userDto,
                copyDto,
                loan.getLoanDate(),
                loan.getDueDate(),
                loan.getReturnDate(),
                loan.getStatus(),
                loan.getExtensionsCount()
        );
    }
}
