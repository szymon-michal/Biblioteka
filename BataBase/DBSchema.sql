-- ============================================================
-- DBSchema.sql – baza danych systemu bibliotecznego (MySQL 8)
-- ============================================================

-- Zalecane uruchomienie na MySQL 8.0+ (w docker-compose używamy mysql:8.0)

SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS v_loans_per_day;
DROP VIEW IF EXISTS v_book_popularity_monthly;

DROP TABLE IF EXISTS penalty;
DROP TABLE IF EXISTS reservation;
DROP TABLE IF EXISTS loan;
DROP TABLE IF EXISTS book_copy;
DROP TABLE IF EXISTS book_author;
DROP TABLE IF EXISTS book;
DROP TABLE IF EXISTS author;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS app_user;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------
-- 2.1 Użytkownicy aplikacji
-- ----------------------------------------
CREATE TABLE app_user (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    first_name     VARCHAR(100) NOT NULL,
    last_name      VARCHAR(100) NOT NULL,
    role           ENUM('READER', 'ADMIN') NOT NULL,
    status         ENUM('ACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
    blocked_reason VARCHAR(500),
    blocked_until  DATETIME NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------
-- 2.2 Kategorie książek (opcjonalnie hierarchiczne)
-- ----------------------------------------
CREATE TABLE category (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    parent_id  BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES category(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------
-- 2.3 Autorzy
-- ----------------------------------------
CREATE TABLE author (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100),
    last_name  VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------
-- 2.4 Książki (logiczne tytuły, nie egzemplarze)
-- ----------------------------------------
CREATE TABLE book (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    publication_year SMALLINT,
    isbn             VARCHAR(20) UNIQUE,
    category_id      BIGINT NULL,
    is_active        TINYINT(1) NOT NULL DEFAULT 1,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_book_category FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------
-- 2.5 Relacja N:M książki–autorzy
-- ----------------------------------------
CREATE TABLE book_author (
    book_id   BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    PRIMARY KEY (book_id, author_id),
    CONSTRAINT fk_book_author_book FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE,
    CONSTRAINT fk_book_author_author FOREIGN KEY (author_id) REFERENCES author(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------
-- 2.6 Egzemplarze książek
-- ----------------------------------------
CREATE TABLE book_copy (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id        BIGINT NOT NULL,
    inventory_code VARCHAR(50) NOT NULL UNIQUE,
    status         ENUM('AVAILABLE', 'BORROWED', 'LOST', 'DAMAGED', 'WITHDRAWN') NOT NULL DEFAULT 'AVAILABLE',
    shelf_location VARCHAR(50),
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_book_copy_book FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------
-- 2.7 Wypożyczenia
-- ----------------------------------------
CREATE TABLE loan (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT NOT NULL,
    book_copy_id     BIGINT NOT NULL,
    loan_date        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date         DATETIME NOT NULL,
    return_date      DATETIME NULL,
    status           ENUM('ACTIVE', 'OVERDUE', 'RETURN_REQUESTED', 'RETURN_REJECTED', 'RETURNED', 'LOST') NOT NULL DEFAULT 'ACTIVE',
    extensions_count SMALLINT NOT NULL DEFAULT 0,
    created_by       BIGINT NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Generated flag: 1 gdy wypożyczenie jest aktywne (brak zwrotu)
    open_loan        TINYINT(1) AS (CASE WHEN return_date IS NULL THEN 1 ELSE 0 END) STORED,

    CONSTRAINT fk_loan_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE RESTRICT,
    CONSTRAINT fk_loan_copy FOREIGN KEY (book_copy_id) REFERENCES book_copy(id) ON DELETE RESTRICT,
    CONSTRAINT fk_loan_created_by FOREIGN KEY (created_by) REFERENCES app_user(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 1 aktywne wypożyczenie na dany egzemplarz (brak zwrotu)
CREATE UNIQUE INDEX uq_loan_active_copy ON loan (book_copy_id, open_loan);

-- ----------------------------------------
-- 2.8 Rezerwacje książek
-- ----------------------------------------
CREATE TABLE reservation (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    book_id      BIGINT NOT NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status       ENUM('ACTIVE', 'CANCELLED', 'FULFILLED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    cancelled_at DATETIME NULL,
    fulfilled_at DATETIME NULL,
    expires_at   DATETIME NULL,

    -- Generated flag: 1 tylko dla ACTIVE
    active_reservation TINYINT(1) AS (CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) STORED,

    CONSTRAINT fk_reservation_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reservation_book FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Użytkownik nie może mieć 2 aktywnych rezerwacji tej samej książki
CREATE UNIQUE INDEX uq_reservation_active_user_book ON reservation (user_id, book_id, active_reservation);

-- ----------------------------------------
-- 2.9 Kary / opłaty
-- ----------------------------------------
CREATE TABLE penalty (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    loan_id     BIGINT NULL,
    amount      DECIMAL(10,2) NOT NULL DEFAULT 0,
    reason      TEXT NOT NULL,
    status      ENUM('OPEN', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    CONSTRAINT fk_penalty_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE RESTRICT,
    CONSTRAINT fk_penalty_loan FOREIGN KEY (loan_id) REFERENCES loan(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
-- Indeksy pod wydajność
-- ============================================================
CREATE INDEX idx_book_title ON book (title);
CREATE INDEX idx_book_category ON book (category_id);
CREATE INDEX idx_loan_user ON loan (user_id);
CREATE INDEX idx_loan_date ON loan (loan_date);
CREATE INDEX idx_reservation_user_status ON reservation (user_id, status);
CREATE INDEX idx_reservation_book_status ON reservation (book_id, status);

-- ============================================================
-- Widoki statystyczne (do wykresów)
-- ============================================================

CREATE VIEW v_book_popularity_monthly AS
SELECT
    DATE_FORMAT(l.loan_date, '%Y-%m-01') AS month,
    b.id                                 AS book_id,
    b.title                              AS title,
    COUNT(*)                             AS loans_count
FROM loan l
JOIN book_copy bc ON bc.id = l.book_copy_id
JOIN book b       ON b.id  = bc.book_id
GROUP BY DATE_FORMAT(l.loan_date, '%Y-%m-01'), b.id, b.title;

CREATE VIEW v_loans_per_day AS
SELECT
    DATE(loan_date) AS day,
    COUNT(*)        AS loans_count
FROM loan
GROUP BY DATE(loan_date);
