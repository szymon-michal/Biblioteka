package com.library.service.admin;

import com.library.dto.AuthorDto;
import com.library.dto.admin.AdminAuthorRequest;
import com.library.model.entity.Author;
import com.library.repository.AuthorRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminAuthorService {

    private final AuthorRepository authorRepository;

    @Transactional(readOnly = true)
    public Page<AuthorDto> list(Pageable pageable) {
        return authorRepository.findAll(pageable)
                .map(a -> new AuthorDto(a.getId(), a.getFirstName(), a.getLastName()));
    }

    @Transactional
    public AuthorDto create(@Valid AdminAuthorRequest req) {
        Author a = new Author();
        a.setFirstName(req.getFirstName());
        a.setLastName(req.getLastName());
        Author saved = authorRepository.save(a);
        return new AuthorDto(saved.getId(), saved.getFirstName(), saved.getLastName());
    }

    @Transactional
    public AuthorDto update(Long id, @Valid AdminAuthorRequest req) {
        Author a = authorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Author not found"));
        a.setFirstName(req.getFirstName());
        a.setLastName(req.getLastName());
        Author saved = authorRepository.save(a);
        return new AuthorDto(saved.getId(), saved.getFirstName(), saved.getLastName());
    }

    @Transactional
    public void delete(Long id) {
        if (!authorRepository.existsById(id)) {
            throw new EntityNotFoundException("Author not found");
        }
        authorRepository.deleteById(id);
    }
}
