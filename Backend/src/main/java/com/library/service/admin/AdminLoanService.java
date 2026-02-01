package com.library.service.admin;

import com.library.model.entity.Loan;
import com.library.model.entity.BookCopy;
import com.library.model.enums.LoanStatus;
import com.library.repository.LoanRepository;
import com.library.repository.BookCopyRepository;
import com.library.repository.AppUserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminLoanService {

    private final LoanRepository loanRepository;
    private final BookCopyRepository bookCopyRepository;
    private final AppUserRepository userRepository;

    public Page<Loan> list(Pageable pageable) {
        return loanRepository.findAll(pageable);
    }

    public Loan get(Long id) {
        return loanRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Loan not found"));
    }

    public Loan create(Long userId, Long bookCopyId, LocalDateTime dueDate) {
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

        return loanRepository.save(loan);
    }

    public Loan update(Long id, LoanStatus status, LocalDateTime dueDate, LocalDateTime returnDate) {
        Loan loan = get(id);

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

        return loanRepository.save(loan);
    }

    public void delete(Long id) {
        Loan loan = get(id);

        if (loan.getStatus() == LoanStatus.ACTIVE) {
            BookCopy copy = loan.getBookCopy();
            copy.setAvailable(true);
            bookCopyRepository.save(copy);
        }

        loanRepository.delete(loan);
    }
}
