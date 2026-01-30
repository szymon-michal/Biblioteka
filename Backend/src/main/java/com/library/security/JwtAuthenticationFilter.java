package com.library.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    // >>> RĘCZNY KONSTRUKTOR – to załatwia błąd <<<
    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = getTokenFromRequest(request);
        String path = request.getRequestURI();

        if (token != null && tokenProvider.validateToken(token)) {
            String userId = tokenProvider.getUserIdFromToken(token);
            String role = tokenProvider.getRoleFromToken(token);

            // Spring Security requires "ROLE_" prefix
            String authority = role != null && !role.startsWith("ROLE_")
                    ? "ROLE_" + role
                    : (role != null ? role : "ROLE_USER");

            System.out.println(">>> JWT FILTER [" + path + "]: userId=" + userId + ", role=" + role + ", authority=" + authority);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            Long.parseLong(userId),
                            null,
                            Collections.singletonList(new SimpleGrantedAuthority(authority))
                    );

            SecurityContextHolder.getContext().setAuthentication(authentication);
        } else if (path.startsWith("/api/loans") || path.startsWith("/api/me")) {
            System.out.println(">>> JWT FILTER [" + path + "]: No valid token found!");
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        // Try both "Authorization" and "authorization" (case-insensitive)
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken == null) {
            bearerToken = request.getHeader("authorization");
        }

        System.out.println(">>> JWT FILTER: Authorization header = " + bearerToken);

        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
