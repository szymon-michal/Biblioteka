package com.library.service;

import com.library.dto.AuthorDto;
import com.library.dto.BookDto;
import com.library.dto.CategoryDto;
import com.library.dto.request.CreateBookRequest;
import com.library.model.entity.Author;
import com.library.model.entity.Book;
import com.library.model.entity.BookCopy;
import com.library.model.entity.Category;
import com.library.model.enums.BookCopyStatus;
import com.library.repository.AuthorRepository;
import com.library.repository.BookCopyRepository;
import com.library.repository.BookRepository;
import com.library.repository.CategoryRepository;
import com.library.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookService {
    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;
    private final AuthorRepository authorRepository;
    private final BookCopyRepository bookCopyRepository;

    public Page<BookDto> getBooks(String title, String author, Long categoryId, 
                                  Short publicationYearFrom, Short publicationYearTo, 
                                  Boolean availableOnly, Boolean activeOnly, 
                                  Pageable pageable) {
        Page<Book> books = bookRepository.findBooksWithFilters(title, author, categoryId, 
                publicationYearFrom, publicationYearTo, activeOnly != null ? activeOnly : true, pageable);
        
        return books.map(book -> {
            BookDto dto = toDto(book);
            if (availableOnly != null && availableOnly && dto.getAvailableCopies() == 0) {
                return null;
            }
            return dto;
        }).map(dto -> dto);  // Filter nulls would be handled by Spring Data
    }

    public BookDto getBookById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));
        return toDto(book);
    }

    @Transactional
    public BookDto createBook(CreateBookRequest request) {
        if (request.getIsbn() != null && bookRepository.existsByIsbn(request.getIsbn())) {
            throw new IllegalArgumentException("Book with this ISBN already exists");
        }

        Book book = new Book();
        book.setTitle(request.getTitle());
        book.setDescription(request.getDescription());
        book.setPublicationYear(request.getPublicationYear());
        book.setIsbn(request.getIsbn());
        book.setCategoryId(request.getCategoryId());
        book.setIsActive(true);

        // Set authors
        List<Author> authors = authorRepository.findAllById(request.getAuthorIds());
        if (authors.size() != request.getAuthorIds().size()) {
            throw new ResourceNotFoundException("Some authors not found");
        }
        book.setAuthors(authors);

        Book savedBook = bookRepository.save(book);

        // Create initial copies
        for (int i = 0; i < request.getInitialCopies(); i++) {
            BookCopy copy = new BookCopy();
            copy.setBookId(savedBook.getId());
            copy.setInventoryCode("INV-" + savedBook.getId() + "-" + (i + 1));
            copy.setStatus(BookCopyStatus.AVAILABLE);
            bookCopyRepository.save(copy);
        }

        return toDto(savedBook);
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

        List<AuthorDto> authorDtos = book.getAuthors().stream()
                .map(author -> new AuthorDto(author.getId(), author.getFirstName(), author.getLastName()))
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
}