package com.library.service.admin;

import com.library.dto.AuthorDto;
import com.library.dto.BookDto;
import com.library.dto.CategoryDto;
import com.library.dto.admin.AdminCreateBookRequest;
import com.library.dto.admin.AdminUpdateBookRequest;
import com.library.model.entity.Author;
import com.library.model.entity.Book;
import com.library.model.entity.BookCopy;
import com.library.model.enums.BookCopyStatus;
import com.library.repository.AuthorRepository;
import com.library.repository.BookCopyRepository;
import com.library.repository.BookRepository;
import com.library.repository.CategoryRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminBookService {

    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;
    private final AuthorRepository authorRepository;
    private final BookCopyRepository bookCopyRepository;

    @Transactional(readOnly = true)
    public Page<BookDto> list(Pageable pageable) {
        return bookRepository.findAll(pageable).map(this::toDto);
    }

    @Transactional
    public BookDto create(@Valid AdminCreateBookRequest req) {
        Book book = new Book();
        book.setTitle(req.getTitle());
        book.setIsbn(req.getIsbn());
        book.setPublicationYear(
                req.getPublicationYear() == null ? null : req.getPublicationYear().shortValue()
        );        book.setDescription(req.getDescription());
        book.setIsActive(true);

        if (req.getCategoryId() != null) {
            // verify exists
            categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new EntityNotFoundException("Category not found"));
            book.setCategoryId(req.getCategoryId());
        }

        if (req.getAuthorIds() != null && !req.getAuthorIds().isEmpty()) {
            List<Author> authors = authorRepository.findAllById(req.getAuthorIds());
            book.setAuthors(authors);
        } else {
            book.setAuthors(new ArrayList<>());
        }

        Book saved = bookRepository.save(book);

        int copies = req.getInitialCopies() == null ? 1 : Math.max(1, req.getInitialCopies());
        int start = bookCopyRepository.countByBookId(saved.getId());
        for (int i = 0; i < copies; i++) {
            BookCopy copy = new BookCopy();
            copy.setBookId(saved.getId());
            copy.setStatus(BookCopyStatus.AVAILABLE);
            copy.setInventoryCode(generateInventoryCode(saved.getId(), start + i + 1));
            bookCopyRepository.save(copy);
        }

        // reload relations for DTO
        Book reloaded = bookRepository.findById(saved.getId()).orElseThrow();
        return toDto(reloaded);
    }

    @Transactional
    public BookDto update(Long id, @Valid AdminUpdateBookRequest req) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Book not found"));

        book.setTitle(req.getTitle());
        book.setIsbn(req.getIsbn());
        book.setPublicationYear(
                req.getPublicationYear() == null ? null : req.getPublicationYear().shortValue()
        );
        book.setDescription(req.getDescription());

        if (req.getCategoryId() != null) {
            categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new EntityNotFoundException("Category not found"));
            book.setCategoryId(req.getCategoryId());
        } else {
            book.setCategoryId(null);
        }

        if (req.getAuthorIds() != null) {
            List<Author> authors = authorRepository.findAllById(req.getAuthorIds());
            book.setAuthors(authors);
        }

        Book saved = bookRepository.save(book);
        return toDto(saved);
    }

    @Transactional
    public void deactivate(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Book not found"));

        book.setIsActive(false);
        bookRepository.save(book);
    }

    private String generateInventoryCode(Long bookId, int seq) {
        // deterministic + unique enough; ensure not used
        String code = "B" + bookId + "-" + seq;
        int guard = 0;
        while (bookCopyRepository.existsByInventoryCode(code)) {
            guard++;
            code = "B" + bookId + "-" + seq + "-" + guard;
        }
        return code;
    }

    private BookDto toDto(Book book) {
        CategoryDto categoryDto = null;
        if (book.getCategory() != null) {
            categoryDto = new CategoryDto(
                    book.getCategory().getId(),
                    book.getCategory().getName(),
                    book.getCategory().getParentId(),
                    null
            );
        }

        List<AuthorDto> authorDtos = (book.getAuthors() == null ? List.<Author>of() : book.getAuthors())
                .stream()
                .filter(Objects::nonNull)
                .map(a -> new AuthorDto(a.getId(), a.getFirstName(), a.getLastName()))
                .collect(Collectors.toList());

        int totalCopies = bookCopyRepository.countByBookId(book.getId());
        int availableCopies = bookCopyRepository.countByBookIdAndStatus(book.getId(), BookCopyStatus.AVAILABLE);

        return new BookDto(
                book.getId(),
                book.getTitle(),
                book.getDescription(),
                book.getPublicationYear(),
                book.getIsbn(),
                categoryDto,
                authorDtos,
                book.getIsActive(),
                totalCopies,
                availableCopies
        );
    }
    private Short toShort(Integer v) {
        return v == null ? null : v.shortValue();
    }

}
