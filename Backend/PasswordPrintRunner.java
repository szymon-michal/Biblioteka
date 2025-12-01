package com.library;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordPrintRunner implements CommandLineRunner {

    private final PasswordEncoder passwordEncoder;

    public PasswordPrintRunner(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        String adminPlain = "admin_password_here";
        String readerPlain = "admin_password_here";

        String adminHash = passwordEncoder.encode(adminPlain);
        String readerHash = passwordEncoder.encode(readerPlain);

        System.out.println("=== GENERATED PASSWORD HASHES ===");
        System.out.println("ADMIN PLAIN : " + adminPlain);
        System.out.println("ADMIN HASH  : " + adminHash);
        System.out.println("READER PLAIN: " + readerPlain);
        System.out.println("READER HASH : " + readerHash);
        System.out.println("=================================");
    }
}