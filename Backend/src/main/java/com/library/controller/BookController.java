package com.library.controller;

import com.library.dto.BookDto;
import com.library.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {
    private final BookService bookService;

    @GetMapping
    public ResponseEntity<Page<BookDto>> getBooks(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Short publicationYearFrom,
            @RequestParam(required = false) Short publicationYearTo,
            @RequestParam(required = false) Boolean availableOnly,
            @RequestParam(required = false) Boolean activeOnly,
            Pageable pageable) {
        
        Page<BookDto> books = bookService.getBooks(title, author, categoryId, 
                publicationYearFrom, publicationYearTo, availableOnly, activeOnly, pageable);
        return ResponseEntity.ok(books);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookDto> getBook(@PathVariable Long id) {
        BookDto book = bookService.getBookById(id);
        return ResponseEntity.ok(book);
    }
}