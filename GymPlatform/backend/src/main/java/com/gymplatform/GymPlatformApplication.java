package com.gymplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GymPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(GymPlatformApplication.class, args);
    }
}
