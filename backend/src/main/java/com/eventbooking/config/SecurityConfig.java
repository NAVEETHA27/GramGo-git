package com.eventbooking.config;

import com.eventbooking.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    /**
     * Comma-separated list of allowed frontend origins injected from application.yml.
     * Examples:
     *   Local dev:   http://localhost:3000
     *   Vercel:      https://vehicle-rent.vercel.app,https://yourdomain.com
     * Set via:  app.cors.allowed-origins in application.yml  OR
     *           CORS_ALLOWED_ORIGINS environment variable
     */
    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // ── Public ────────────────────────────────────────────
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.POST,
                    "/auth/user/register",
                    "/auth/organizer/register",
                    "/auth/user/login",
                    "/auth/organizer/login",
                    "/auth/forgot-password",
                    "/auth/reset-password",
                    "/auth/reset-password/otp",
                    "/auth/refresh-token",
                    "/auth/otp/send",
                    "/auth/otp/verify"
                ).permitAll()
                .requestMatchers(HttpMethod.GET,
                    "/auth/verify-email",
                    "/auth/test-email",
                    "/events",
                    "/events/featured",
                    "/events/categories",
                    "/help",
                    "/help/faqs",
                    "/help/videos",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()
                .requestMatchers(HttpMethod.GET, "/events/*").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/v1/**").permitAll()
                // ── Fleet Owner only ──────────────────────────────────
                .requestMatchers("/organizer/**").hasRole("ORGANIZER")
                .requestMatchers("/admin/**").hasRole("ADMIN")
                // ── Authenticated ─────────────────────────────────────
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Parse comma-separated origins from config
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        // In development, a single wildcard pattern is fine.
        // In production, list explicit Vercel URLs so credentials work correctly.
        config.setAllowedOrigins(origins);

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of(
                "Authorization", "Content-Type", "Accept",
                "X-Requested-With", "Cache-Control"
        ));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
