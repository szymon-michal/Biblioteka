package com.library.service;

import com.library.dto.PenaltyDto;
import com.library.dto.request.AdminCreatePenaltyRequest;
import com.library.model.entity.AppUser;
import com.library.model.entity.Loan;
import com.library.model.entity.Penalty;
import com.library.model.enums.PenaltyStatus;
import com.library.repository.AppUserRepository;
import com.library.repository.LoanRepository;
import com.library.repository.PenaltyRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PenaltyService {
    private final PenaltyRepository penaltyRepository;
    private final LoanRepository loanRepository;
    private final AppUserRepository appUserRepository;

    public Page<PenaltyDto> getUserPenalties(Long userId, PenaltyStatus status, Pageable pageable) {
        return penaltyRepository.findByUserIdAndStatus(userId, status, pageable)
                .map(this::toDto);
    }

    public Page<PenaltyDto> getPenalties(PenaltyStatus status, Long userId, Pageable pageable) {
        return penaltyRepository.findPenaltiesWithFilters(status, userId, pageable)
                .map(this::toDto);
    }

    @Transactional
    public PenaltyDto markAsPaid(Long penaltyId) {
        Penalty penalty = penaltyRepository.findById(penaltyId)
                .orElseThrow(() -> new RuntimeException("Penalty not found"));
        
        penalty.setStatus(PenaltyStatus.PAID);
        penalty.setResolvedAt(LocalDateTime.now());
        
        return toDto(penaltyRepository.save(penalty));
    }

    private PenaltyDto toDto(Penalty p) {
        PenaltyDto dto = new PenaltyDto();
        dto.setId(p.getId());

        PenaltyDto.UserSummaryDto user = new PenaltyDto.UserSummaryDto(
                p.getUser().getId(),
                p.getUser().getFirstName(),
                p.getUser().getLastName()
        );

        dto.setUser(user);
        dto.setUserId(p.getUser().getId());
        dto.setLoanId(p.getLoan() != null ? p.getLoan().getId() : null);

        dto.setAmount(p.getAmount());
        dto.setReason(p.getReason());
        dto.setStatus(p.getStatus());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setResolvedAt(p.getResolvedAt());

        // pola „frontendowe”
        dto.setIssuedAt(p.getCreatedAt());
        dto.setPaid(p.getStatus() == PenaltyStatus.PAID);

        return dto;
    }
@Transactional
public PenaltyDto createPenalty(@Valid AdminCreatePenaltyRequest req) {

        AppUser user = appUserRepository.findById(req.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Loan loan = null;
        if (req.getLoanId() != null) {
            loan = loanRepository.findById(req.getLoanId())
                    .orElseThrow(() -> new EntityNotFoundException("Loan not found"));
        }

        Penalty penalty = new Penalty();
        penalty.setUserId(user.getId());
        penalty.setUser(user);
        penalty.setLoanId(loan != null ? loan.getId() : null);
        penalty.setLoan(loan);
        penalty.setAmount(req.getAmount());
        penalty.setReason(req.getReason());
        penalty.setStatus(PenaltyStatus.OPEN);
        penalty.setCreatedAt(LocalDateTime.now());
        penalty.setResolvedAt(null);

        Penalty saved = penaltyRepository.save(penalty);

        return toDto(saved);
    }

}
