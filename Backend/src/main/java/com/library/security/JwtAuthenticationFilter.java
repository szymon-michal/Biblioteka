package com.library.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
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

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    /**
     * ✅ Najważniejsze: nie filtrujemy ścieżek publicznych,
     * bo inaczej jak gdzieś poleci błąd i Spring wejdzie na /error,
     * to filtr znowu odpala i może się zrobić pętla 403/401.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();

        return
                // Spring error endpoint
                path.equals("/error") || path.startsWith("/error/") ||

                        // auth endpoints
                        path.startsWith("/api/auth/") ||
                        path.startsWith("/auth/") ||

                        // actuator/health
                        path.startsWith("/actuator/") ||
                        path.equals("/health") ||

                        // public catalog
                        path.startsWith("/api/books/") ||
                        path.startsWith("/api/categories/") ||
                        path.startsWith("/api/authors/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = getTokenFromRequest(request);

        // ✅ Brak tokena -> nie blokujemy, idziemy dalej
        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            if (tokenProvider.validateToken(token)) {
                String userId = tokenProvider.getUserIdFromToken(token);

                // TODO: jeśli masz role w tokenie, tu je wyciągnij.
                // Na razie zachowuję Twoje ROLE_USER:
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                Long.parseLong(userId),
                                null,
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                        );

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }

            filterChain.doFilter(request, response);

        } catch (Exception ex) {
            // ✅ Nie rzucamy wyjątku dalej, bo wtedy Spring idzie na /error i może być pętla.
            // Zwracamy 401 i kończymy.
            SecurityContextHolder.clearContext();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized\"}");
        }
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
