package com.library.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
            // ✅ enable CORS
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .authorizeHttpRequests(auth ->
                    auth
                            // ✅ allow preflight requests everywhere
                            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                            // ✅ auth endpoints
                            .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()

                            // (optional) if your frontend still calls /auth/login, allow it too
                            .requestMatchers("/auth/login", "/auth/register").permitAll()

                            // health and error
                            .requestMatchers("/health", "/actuator/health", "/error").permitAll()

                            // public catalog endpoints - allow GET for everyone
                            .requestMatchers(HttpMethod.GET,
                                    "/api/books/**",
                                    "/api/categories/**",
                                    "/api/authors/**"
                            ).permitAll()

                            // admin endpoints - only ADMIN role
                            .requestMatchers("/api/admin/**").hasRole("ADMIN")

                            // authenticated endpoints for logged-in users
                            .requestMatchers("/api/loans/**", "/api/reservations/**", "/api/penalties/**", "/api/me/**").authenticated()

                            .anyRequest().authenticated()
            )
            .addFilterBefore(
                    jwtAuthenticationFilter,
                    UsernamePasswordAuthenticationFilter.class
            );

    return http.build();
  }

  // ✅ CORS policy for your frontend dev servers
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();

    // allow Vite dev origins
    config.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:5174"
    ));

    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));

    // if you use Authorization: Bearer ..., this is fine
    config.setExposedHeaders(List.of("Authorization"));

    // set to true only if you use cookies; for pure JWT header it can be false
    config.setAllowCredentials(false);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}
