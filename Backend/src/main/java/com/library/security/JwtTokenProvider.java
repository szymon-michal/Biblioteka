package com.library.security;

import com.library.model.entity.AppUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

  @Value("${app.jwt.secret:mySecretKey}")
  private String jwtSecret;

  @Value("${app.jwt.expiration:86400}")
  private int jwtExpirationInMs;

  private javax.crypto.SecretKey getSigningKey() {
    return Keys.hmacShaKeyFor(jwtSecret.getBytes());
  }

  private JwtParser getParser() {
    return Jwts.parser()
            .verifyWith((javax.crypto.SecretKey) getSigningKey())
            .build();
  }

  public String generateToken(AppUser user) {
    Date expiryDate = new Date(
      System.currentTimeMillis() + jwtExpirationInMs * 1000L
    );

    return Jwts
      .builder()
      .setSubject(user.getId().toString())
      .claim("email", user.getEmail())
      .claim("role", user.getRole().toString())
      .setIssuedAt(new Date())
      .setExpiration(expiryDate)
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)
      .compact();
  }

  public String getUserIdFromToken(String token) {
    Claims claims = getParser().parseClaimsJws(token).getBody();

    return claims.getSubject();
  }

  public String getRoleFromToken(String token) {
    Claims claims = getParser().parseClaimsJws(token).getBody();
    return claims.get("role", String.class);
  }

  public boolean validateToken(String token) {
    try {
      getParser().parseClaimsJws(token);
      return true;
    } catch (Exception e) {
      System.out.println(">>> JWT VALIDATION FAILED: " + e.getClass().getSimpleName() + " - " + e.getMessage());
      return false;
    }
  }
}
