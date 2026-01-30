package com.library.service;

import com.library.dto.admin.AdminLoansPerDayDto;
import com.library.dto.admin.AdminSummaryDto;
import com.library.repository.AppUserRepository;
import com.library.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminStatsService {

    private final LoanRepository loanRepository;
    private final AppUserRepository userRepository;

    @Transactional(readOnly = true)
    public AdminSummaryDto getSummary(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.plusDays(1).atStartOfDay();

        long totalLoans = loanRepository.countLoansBetween(fromDt, toDt);
        long overdueLoans = loanRepository.countOverdueLoans(LocalDateTime.now());

        long newUsers = userRepository.countNewUsersBetween(fromDt, toDt);
        long activeUsers = userRepository.countActiveUsers();

        List<AdminSummaryDto.MostPopularBookDto> popular = loanRepository.findMostPopularBooks(fromDt, toDt)
                .stream()
                .map(x -> new AdminSummaryDto.MostPopularBookDto(x.getBookId(), x.getTitle(), x.getLoansCount()))
                .toList();

        return new AdminSummaryDto(totalLoans, newUsers, activeUsers, overdueLoans, popular);
    }

    @Transactional(readOnly = true)
    public List<AdminLoansPerDayDto> getLoansPerDay(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.plusDays(1).atStartOfDay();

        return loanRepository.findLoansPerDay(fromDt, toDt)
                .stream()
                .map(x -> new AdminLoansPerDayDto(x.getDay().toString(), x.getLoansCount()))
                .toList();
    }
}
