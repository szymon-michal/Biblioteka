package com.library.controller.admin;

import com.library.dto.PenaltyDto;
import com.library.dto.request.AdminCreatePenaltyRequest;
import com.library.model.enums.PenaltyStatus;
import com.library.service.PenaltyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/penalties")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPenaltyController {

    private final PenaltyService penaltyService;

    @GetMapping
    public ResponseEntity<Page<PenaltyDto>> list(
            @RequestParam(required = false) PenaltyStatus status,
            @RequestParam(required = false) Long userId,
            Pageable pageable
    ) {
        return ResponseEntity.ok(penaltyService.getPenalties(status, userId, pageable));
    }

    @PostMapping
    public ResponseEntity<PenaltyDto> create(@Valid @RequestBody AdminCreatePenaltyRequest req) {
        return ResponseEntity.ok(penaltyService.createPenalty(req));
    }

    @PostMapping("/{penaltyId}/paid")
    public ResponseEntity<PenaltyDto> markPaid(@PathVariable Long penaltyId) {
        return ResponseEntity.ok(penaltyService.markAsPaid(penaltyId));
    }
}
