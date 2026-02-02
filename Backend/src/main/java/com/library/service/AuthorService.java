package com.library.service;

import com.library.dto.AuthorDto;
import com.library.dto.request.CreateAuthorRequest;
import com.library.dto.request.UpdateAuthorRequest;
import com.library.model.entity.Author;
import com.library.repository.AuthorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthorService {

    private final AuthorRepository authorRepository;

    public Page<AuthorDto> search(String search, Pageable pageable) {
        return authorRepository.findAuthorsWithSearch((search == null || search.isBlank()) ? null : search, pageable)
                .map(a -> new AuthorDto(a.getId(), a.getFirstName(), a.getLastName()));
    }

    @Transactional
    public AuthorDto create(CreateAuthorRequest req) {
        Author a = new Author();
        a.setFirstName(req.getFirstName());
        a.setLastName(req.getLastName());
        Author saved = authorRepository.save(a);
        return new AuthorDto(saved.getId(), saved.getFirstName(), saved.getLastName());
    }

    @Transactional
    public AuthorDto update(Long id, UpdateAuthorRequest req) {
        Author a = authorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Author not found"));
        a.setFirstName(req.getFirstName());
        a.setLastName(req.getLastName());
        Author saved = authorRepository.save(a);
        return new AuthorDto(saved.getId(), saved.getFirstName(), saved.getLastName());
    }

    @Transactional
    public void delete(Long id) {
        try {
            authorRepository.deleteById(id);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nie można usunąć autora, bo jest powiązany z książkami.");
        }
    }
}
