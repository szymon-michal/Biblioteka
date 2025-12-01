package com.library.service;

import com.library.dto.PenaltyDto;
import com.library.model.entity.Penalty;
import com.library.model.enums.PenaltyStatus;
import com.library.repository.PenaltyRepository;
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

    private PenaltyDto toDto(Penalty penalty) {
        PenaltyDto.UserSummaryDto userDto = new PenaltyDto.UserSummaryDto(
                penalty.getUser().getId(),
                penalty.getUser().getFirstName(),
                penalty.getUser().getLastName()
        );

        return new PenaltyDto(
                penalty.getId(),
                userDto,
                penalty.getLoanId(),
                penalty.getAmount(),
                penalty.getReason(),
                penalty.getStatus(),
                penalty.getCreatedAt(),
                penalty.getResolvedAt()
        );
    }
}