package com.library.controller;

import com.library.dto.admin.AdminLoansPerDayDto;
import com.library.dto.admin.AdminSummaryDto;
import com.library.service.AdminStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/stats")
public class AdminStatsController {

    private final AdminStatsService adminStatsService;

    @GetMapping("/summary")
    public AdminSummaryDto summary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return adminStatsService.getSummary(from, to);
    }

    @GetMapping("/loans-per-day")
    public List<AdminLoansPerDayDto> loansPerDay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return adminStatsService.getLoansPerDay(from, to);
    }
}
