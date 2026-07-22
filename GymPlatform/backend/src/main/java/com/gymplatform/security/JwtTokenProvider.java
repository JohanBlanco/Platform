package com.gymplatform.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long expirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(UserPrincipal principal) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(principal.getUsername())
                .claim("userId", principal.getId())
                .claim("roles", principal.getRoles())
                .claim("organizationId", principal.getOrganizationId())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    /** Token corto para desbloquear el dashboard de estadísticas (no sustituye el JWT de sesión). */
    public String generateStatsUnlockToken(Long userId, Long organizationId) {
        Date now = new Date();
        long ttlMs = 45L * 60L * 1000L; // 45 minutos
        Date expiry = new Date(now.getTime() + ttlMs);

        return Jwts.builder()
                .subject("stats-unlock")
                .claim("purpose", "STATS_UNLOCK")
                .claim("userId", userId)
                .claim("organizationId", organizationId)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public Instant statsUnlockExpiry(String token) {
        return parseClaims(token).getExpiration().toInstant();
    }

    public boolean validateStatsUnlockToken(String token, Long expectedOrgId, Long expectedUserId) {
        try {
            Claims claims = parseClaims(token);
            if (!"STATS_UNLOCK".equals(String.valueOf(claims.get("purpose")))) {
                return false;
            }
            Object orgClaim = claims.get("organizationId");
            Object userClaim = claims.get("userId");
            if (orgClaim == null || userClaim == null) {
                return false;
            }
            long orgId = ((Number) orgClaim).longValue();
            long userId = ((Number) userClaim).longValue();
            return orgId == expectedOrgId && userId == expectedUserId;
        } catch (Exception e) {
            return false;
        }
    }

    public String getEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
