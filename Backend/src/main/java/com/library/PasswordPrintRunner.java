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
    // USTAL JAWNE HASŁA, KTÓRYCH UŻYJESZ W APP_USER I W Api.py
    String adminPlain = "admin123"; // <-- użyj tego w danych startowych DB
    String readerPlain = "reader123"; // <-- i dla czytelnika

    String adminHash = passwordEncoder.encode(adminPlain);
    String readerHash = passwordEncoder.encode(readerPlain);

    // WSTAW adminHash/readerHash do kolumny app_user.password_hash w bazie
    System.out.println("=== GENERATED PASSWORD HASHES ===");
    System.out.println("ADMIN PLAIN : " + adminPlain);
    System.out.println("ADMIN HASH  : " + adminHash);
    System.out.println("READER PLAIN: " + readerPlain);
    System.out.println("READER HASH : " + readerHash);
    System.out.println("=================================");
  }
}
