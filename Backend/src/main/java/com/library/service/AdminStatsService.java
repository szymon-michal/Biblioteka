package com.library.service;

import com.library.dto.admin.AdminLoansPerDayDto;
import com.library.dto.admin.AdminSummaryDto;
import com.library.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminStatsService {

    private final LoanRepository loanRepository;

    public AdminSummaryDto getSummary(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.plusDays(1).atStartOfDay().minusNanos(1);

        long totalLoans = loanRepository.countLoansBetween(fromDt, toDt);
        long overdueLoans = loanRepository.countOverdueLoans(LocalDateTime.now());

        // Jeśli nie masz sensownych danych -> zostaw 0 (żeby frontend działał)
        long newUsers = 0;
        long activeUsers = 0;

        List<AdminSummaryDto.MostPopularBookDto> top =
                loanRepository.findMostPopularBooks(fromDt, toDt);

        return new AdminSummaryDto(totalLoans, newUsers, activeUsers, overdueLoans, top);
    }

    public List<AdminLoansPerDayDto> getLoansPerDay(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.plusDays(1).atStartOfDay().minusNanos(1);
        return loanRepository.findLoansPerDay(fromDt, toDt);
    }
}
