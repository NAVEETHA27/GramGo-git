package com.eventbooking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  GramGo Vehicle Rental System – Spring Boot Entry Point
 *  GramGo Vehicle Rental System - Spring Boot Entry Point
 * ╚══════════════════════════════════════════════════════════╝
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
public class GramGoApplication {
    public static void main(String[] args) {
        SpringApplication.run(GramGoApplication.class, args);
    }
}

