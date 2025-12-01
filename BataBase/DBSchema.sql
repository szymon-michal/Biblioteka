-- ============================================================
-- schema.sql – baza danych systemu bibliotecznego (PostgreSQL)
-- ============================================================

-- UWAGA: zapytania w backendzie mogą używać LOWER(...) na polach
-- tekstowych (VARCHAR/TEXT). Nie używaj LOWER na kolumnach binarnych (BYTEA),
-- bo w Postgresie powoduje to błąd "function lower(bytea) does not exist".

SET search_path TO public;



DROP VIEW IF EXISTS v_loans_per_day;
DROP VIEW IF EXISTS v_book_popularity_monthly;

DROP TABLE IF EXISTS penalty CASCADE;
DROP TABLE IF EXISTS reservation CASCADE;
DROP TABLE IF EXISTS loan CASCADE;
DROP TABLE IF EXISTS book_copy CASCADE;
DROP TABLE IF EXISTS book_author CASCADE;
DROP TABLE IF EXISTS book CASCADE;
DROP TABLE IF EXISTS author CASCADE;
DROP TABLE IF EXISTS category CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;

DROP TYPE IF EXISTS penalty_status;
DROP TYPE IF EXISTS reservation_status;
DROP TYPE IF EXISTS loan_status;
DROP TYPE IF EXISTS book_copy_status;
DROP TYPE IF EXISTS user_status;
DROP TYPE IF EXISTS user_role;



CREATE TYPE user_role AS ENUM ('READER', 'ADMIN');

CREATE TYPE user_status AS ENUM ('ACTIVE', 'BLOCKED');

CREATE TYPE book_copy_status AS ENUM ('AVAILABLE', 'BORROWED', 'LOST', 'DAMAGED', 'WITHDRAWN');

CREATE TYPE loan_status AS ENUM ('ACTIVE', 'RETURNED', 'OVERDUE', 'LOST');

CREATE TYPE reservation_status AS ENUM ('ACTIVE', 'CANCELLED', 'FULFILLED', 'EXPIRED');

CREATE TYPE penalty_status AS ENUM ('OPEN', 'PAID', 'CANCELLED');

-- ----------------------------------------
-- 2.1 Użytkownicy aplikacji
-- ----------------------------------------
CREATE TABLE app_user (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    role            user_role NOT NULL,                 -- READER / ADMIN
    status          user_status NOT NULL DEFAULT 'ACTIVE',
    blocked_reason  VARCHAR(500),
    blocked_until   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------
-- 2.2 Kategorie książek (opcjonalnie hierarchiczne)
-- ----------------------------------------
CREATE TABLE category (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    parent_id   BIGINT REFERENCES category(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------
-- 2.3 Autorzy
-- ----------------------------------------
CREATE TABLE author (
    id          BIGSERIAL PRIMARY KEY,
    first_name  VARCHAR(100),
    last_name   VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------
-- 2.4 Książki (logiczne tytuły, nie egzemplarze)
-- ----------------------------------------
CREATE TABLE book (
    id               BIGSERIAL PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    publication_year SMALLINT,
    isbn             VARCHAR(20) UNIQUE,
    category_id      BIGINT REFERENCES category(id) ON DELETE SET NULL,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,  -- wycofanie = FALSE
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------
-- 2.5 Relacja N:M książki–autorzy
-- ----------------------------------------
CREATE TABLE book_author (
    book_id     BIGINT NOT NULL REFERENCES book(id)   ON DELETE CASCADE,
    author_id   BIGINT NOT NULL REFERENCES author(id) ON DELETE RESTRICT,
    PRIMARY KEY (book_id, author_id)
);

-- ----------------------------------------
-- 2.6 Egzemplarze książek
-- ----------------------------------------
CREATE TABLE book_copy (
    id              BIGSERIAL PRIMARY KEY,
    book_id         BIGINT NOT NULL REFERENCES book(id) ON DELETE RESTRICT,
    inventory_code  VARCHAR(50) NOT NULL UNIQUE,  -- np. kod kreskowy / sygnatura
    status          book_copy_status NOT NULL DEFAULT 'AVAILABLE',
    shelf_location  VARCHAR(50),                  -- np. "R1-P3"
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------
-- 2.7 Wypożyczenia
-- ----------------------------------------
CREATE TABLE loan (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    book_copy_id     BIGINT NOT NULL REFERENCES book_copy(id) ON DELETE RESTRICT,
    loan_date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date         TIMESTAMPTZ NOT NULL,  -- termin oddania
    return_date      TIMESTAMPTZ,           -- NULL = nadal na koncie
    status           loan_status NOT NULL DEFAULT 'ACTIVE',
    extensions_count SMALLINT NOT NULL DEFAULT 0,
    created_by       BIGINT REFERENCES app_user(id),   -- admin, który zarejestrował
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1 aktywne wypożyczenie na dany egzemplarz (brak zwrotu)
CREATE UNIQUE INDEX uq_loan_active_copy
    ON loan (book_copy_id)
    WHERE return_date IS NULL;


-- ----------------------------------------
-- 2.8 Rezerwacje książek
-- ----------------------------------------
CREATE TABLE reservation (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    book_id         BIGINT NOT NULL REFERENCES book(id)      ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status          reservation_status NOT NULL DEFAULT 'ACTIVE',
    cancelled_at    TIMESTAMPTZ,
    fulfilled_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ
);

-- Użytkownik nie może mieć 2 aktywnych rezerwacji tej samej książki
CREATE UNIQUE INDEX uq_reservation_active_user_book
    ON reservation (user_id, book_id)
    WHERE status = 'ACTIVE';


-- ----------------------------------------
-- 2.9 Kary / opłaty (opcjonalne, ale przydatne)
-- ----------------------------------------
CREATE TABLE penalty (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    loan_id     BIGINT REFERENCES loan(id) ON DELETE SET NULL,
    amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
    reason      TEXT NOT NULL,
    status      penalty_status NOT NULL DEFAULT 'OPEN',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);


-- ============================================================
-- CZĘŚĆ 3: Indeksy pod wydajność
-- ============================================================

-- Szybkie wyszukiwanie książek po tytule
CREATE INDEX idx_book_title ON book (title);

-- Filtrowanie książek po kategorii
CREATE INDEX idx_book_category ON book (category_id);

-- Filtrowanie wypożyczeń po użytkowniku
CREATE INDEX idx_loan_user ON loan (user_id);

-- Filtrowanie wypożyczeń po dacie
CREATE INDEX idx_loan_date ON loan (loan_date);

-- Filtrowanie rezerwacji po użytkowniku i statusie
CREATE INDEX idx_reservation_user_status
    ON reservation (user_id, status);

-- Filtrowanie rezerwacji po książce i statusie
CREATE INDEX idx_reservation_book_status
    ON reservation (book_id, status);


-- ============================================================
-- CZĘŚĆ 4: Widoki statystyczne
-- ============================================================

-- 4.1 Popularność książek per miesiąc (do wykresów)
CREATE VIEW v_book_popularity_monthly AS
SELECT
    DATE_TRUNC('month', l.loan_date) AS month,
    b.id                              AS book_id,
    b.title,
    COUNT(*)                          AS loans_count
FROM loan l
JOIN book_copy bc ON bc.id = l.book_copy_id
JOIN book b       ON b.id  = bc.book_id
GROUP BY DATE_TRUNC('month', l.loan_date), b.id, b.title;


-- 4.2 Liczba wypożyczeń per dzień (też do wykresów)
CREATE VIEW v_loans_per_day AS
SELECT
    DATE(loan_date) AS day,
    COUNT(*)        AS loans_count
FROM loan
GROUP BY DATE(loan_date);