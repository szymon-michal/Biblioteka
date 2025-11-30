# Dokumentacja bazy danych – System biblioteczny (PostgreSQL)

## 1. Założenia ogólne

* **Baza danych:** PostgreSQL (np. baza `library_db`, schemat `public`).
* **Backend:** Java + Spring/JPA, **frontend:** HTML5 + JS (React/Angular). 
* **Role aplikacyjne (min. 2, zgodnie z wymaganiami):** 
  * `READER` – zwykły czytelnik.
  * `ADMIN` – administrator/bibliotekarz.
* **Hasła:** przechowujemy tylko **hash** (np. BCrypt) w kolumnie `password_hash`.
* **Główne obszary danych:**

  * Użytkownicy + role + blokady kont.
  * Książki, autorzy, kategorie, egzemplarze.
  * Wypożyczenia, zwroty, prolongaty.
  * Rezerwacje (kolejka do książki bez dostępnych egzemplarzy).
  * Proste statystyki wypożyczeń (widoki).

---

## 2. Model pojęciowy – encje

Encje wynikają bezpośrednio z przypadków użycia czytelnika i administratora. 

1. **`app_user`** – konto użytkownika (czytelnik / admin).
2. **`book`** – opis logicznej książki (tytuł, opis, kategoria).
3. **`author`** – autor książki.
4. **`book_author`** – tabela łącząca książki z autorami (N:M).
5. **`category`** – kategorie książek (np. „Fantastyka”, „Nauka”).
6. **`book_copy`** – fizyczny egzemplarz książki (kod inwentarzowy).
7. **`loan`** – wypożyczenie egzemplarza dla użytkownika.
8. **`reservation`** – rezerwacja książki, gdy wszystkie egzemplarze są wypożyczone.
9. **`penalty`** (opcjonalne, ale przydatne) – zapis kar/obostrzeń za przetrzymanie.
10. **Widoki statystyczne** – np. najczęściej wypożyczane książki w danym miesiącu.

---

## 3. Typy ENUM (PostgreSQL)

Dla większej spójności logiki używamy typów `ENUM`:

```sql
CREATE TYPE user_role AS ENUM ('READER', 'ADMIN');

CREATE TYPE user_status AS ENUM ('ACTIVE', 'BLOCKED');

CREATE TYPE book_copy_status AS ENUM ('AVAILABLE', 'BORROWED', 'LOST', 'DAMAGED', 'WITHDRAWN');

CREATE TYPE loan_status AS ENUM ('ACTIVE', 'RETURNED', 'OVERDUE', 'LOST');

CREATE TYPE reservation_status AS ENUM ('ACTIVE', 'CANCELLED', 'FULFILLED', 'EXPIRED');

CREATE TYPE penalty_status AS ENUM ('OPEN', 'PAID', 'CANCELLED');
```

---

## 4. Relacje między encjami (opis ERD)

* `app_user (1) — (N) loan`

* `app_user (1) — (N) reservation`

* `app_user (1) — (N) penalty`

* `book (1) — (N) book_copy`

* `author (N) — (N) book` przez `book_author`

* `category (1) — (N) book`

* `book_copy (1) — (N) loan`

* `book (1) — (N) reservation`

Najważniejsze zasady:

* **Wypożyczenie** dotyczy **konkretnego egzemplarza** (`loan.book_copy_id`).
* **Rezerwacja** dotyczy **tytułu** (książki), nie konkretnego egzemplarza (`reservation.book_id`).
* Unikalne ograniczenia pilnują, żeby:

  * jeden egzemplarz nie był równocześnie w dwóch aktywnych wypożyczeniach,
  * użytkownik nie miał dwóch aktywnych rezerwacji tego samego tytułu.

---

## 5. Specyfikacja tabel

### 5.1. Tabela `app_user`

Opis: konta użytkowników (czytelnicy i administratorzy), logowanie, blokady.

```sql
CREATE TABLE app_user (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    role            user_role NOT NULL, -- READER / ADMIN
    status          user_status NOT NULL DEFAULT 'ACTIVE',
    blocked_reason  VARCHAR(500),
    blocked_until   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 5.2. Tabela `category`

Opis: kategorie książek (opcjonalnie hierarchiczne).

```sql
CREATE TABLE category (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    parent_id   BIGINT REFERENCES category(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
---

### 5.3. Tabela `author`

Opis: autorzy książek.

```sql
CREATE TABLE author (
    id          BIGSERIAL PRIMARY KEY,
    first_name  VARCHAR(100),
    last_name   VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 5.4. Tabela `book`

Opis: logiczna pozycja w katalogu (nie egzemplarz).

```sql
CREATE TABLE book (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    publication_year SMALLINT,
    isbn            VARCHAR(20) UNIQUE,
    category_id     BIGINT REFERENCES category(id) ON DELETE SET NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE, -- wycofanie książki = FALSE
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 5.5. Tabela `book_author`

Opis: relacja N:M między książkami a autorami.

```sql
CREATE TABLE book_author (
    book_id     BIGINT NOT NULL REFERENCES book(id)   ON DELETE CASCADE,
    author_id   BIGINT NOT NULL REFERENCES author(id) ON DELETE RESTRICT,
    PRIMARY KEY (book_id, author_id)
);
```

---

### 5.6. Tabela `book_copy`

Opis: fizyczne egzemplarze książek.

```sql
CREATE TABLE book_copy (
    id              BIGSERIAL PRIMARY KEY,
    book_id         BIGINT NOT NULL REFERENCES book(id) ON DELETE RESTRICT,
    inventory_code  VARCHAR(50) NOT NULL UNIQUE,  -- np. kod kreskowy
    status          book_copy_status NOT NULL DEFAULT 'AVAILABLE',
    shelf_location  VARCHAR(50),                  -- np. regał/półka
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Użycie:**

* Dodawanie/usuwanie egzemplarzy.
* Oznaczanie egzemplarza jako zniszczony/zaginiony. 
* Obliczanie liczby dostępnych egzemplarzy książki.

---

### 5.7. Tabela `loan`

Opis: pojedyncze wypożyczenie egzemplarza książki przez użytkownika.

```sql
CREATE TABLE loan (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    book_copy_id    BIGINT NOT NULL REFERENCES book_copy(id) ON DELETE RESTRICT,
    loan_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date        TIMESTAMPTZ NOT NULL,  -- termin oddania
    return_date     TIMESTAMPTZ,           -- NULL = aktualnie wypożyczona
    status          loan_status NOT NULL DEFAULT 'ACTIVE',
    extensions_count SMALLINT NOT NULL DEFAULT 0,
    created_by      BIGINT REFERENCES app_user(id), -- kto zarejestrował (admin)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1 aktywne wypożyczenie na egzemplarz
CREATE UNIQUE INDEX uq_loan_active_copy
    ON loan (book_copy_id)
    WHERE return_date IS NULL;
```

**Użycie:**

* Wypożyczanie książki (czytelnik/admin).
* Rejestracja zwrotu (ustawienie `return_date`, `status='RETURNED'`).
* Przedłużenie terminu (`due_date` + `extensions_count`).
* Historia wypożyczeń użytkownika (`loan` filtrowane po `user_id`). 

---

### 5.8. Tabela `reservation`

Opis: rezerwacje książki, gdy brak wolnych egzemplarzy.

```sql
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

-- użytkownik nie może mieć 2 aktywnych rezerwacji tej samej książki
CREATE UNIQUE INDEX uq_reservation_active_user_book
    ON reservation (user_id, book_id)
    WHERE status = 'ACTIVE';
```

**Użycie:**

* Gdy książka ma 0 dostępnych egzemplarzy, czytelnik może złożyć rezerwację. 
* System ustawia status `FULFILLED`, gdy egzemplarz się zwolni i zostanie przydzielony danej rezerwacji.
* Kolejność rezerwacji wg `created_at` lub dodatkowej logiki w aplikacji.

---

### 5.9. Tabela `penalty` (opcjonalna, ale spójna z „karami/ograniczeniami”)

Opis: ewentualne kary za przetrzymanie książek / inne naruszenia.

```sql
CREATE TABLE penalty (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    loan_id         BIGINT REFERENCES loan(id) ON DELETE SET NULL,
    amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
    reason          TEXT NOT NULL,
    status          penalty_status NOT NULL DEFAULT 'OPEN',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);
```

**Użycie:**

* Wyświetlanie użytkownikowi „kar/ograniczeń” w module profilu. 
* Blokowanie konta można robić ustawiając `status = 'BLOCKED'` w `app_user`, gdy ma otwarte kary / przeterminowane wypożyczenia.

---

## 6. Indeksy i kluczowe ograniczenia

Oprócz PK/FK warto dodać:

```sql
-- Szybsze wyszukiwanie po tytule (np. ILIKE, pełnotekstowość można rozwinąć)
CREATE INDEX idx_book_title ON book (title);

-- Szybsze filtrowanie po kategorii
CREATE INDEX idx_book_category ON book (category_id);

-- Szybsze filtrowanie wypożyczeń po użytkowniku
CREATE INDEX idx_loan_user ON loan (user_id);

-- Szybsze filtrowanie wypożyczeń po dacie
CREATE INDEX idx_loan_date ON loan (loan_date);

-- Szybsze filtrowanie rezerwacji po użytkowniku i statusie
CREATE INDEX idx_reservation_user_status ON reservation (user_id, status);

-- Szybsze filtrowanie rezerwacji po książce i statusie
CREATE INDEX idx_reservation_book_status ON reservation (book_id, status);
```

---

## 7. Widoki statystyczne

### 7.1. Najczęściej wypożyczane książki w miesiącu

Spełnia wymaganie statystyk czasowych / wykresów.

```sql
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
```

Przykładowe użycie w aplikacji:

* Top 10 książek w wybranym miesiącu:

  ```sql
  SELECT * FROM v_book_popularity_monthly
  WHERE month = DATE '2025-01-01'
  ORDER BY loans_count DESC
  LIMIT 10;
  ```

### 7.2. Liczba wypożyczeń w danym okresie

```sql
CREATE VIEW v_loans_per_day AS
SELECT
    DATE(loan_date) AS day,
    COUNT(*)        AS loans_count
FROM loan
GROUP BY DATE(loan_date);
```

To daje prosty wykres typu „liczba wypożyczeń dziennie / miesięcznie”.

---

## 8. Mapowanie przypadków użycia → model danych

Krótko pokazuję, że baza pokrywa wszystkie przypadki z opisu. 

### 8.1. Czytelnik

* **Zarejestruj konto / Zaloguj się / Zmień hasło / Edytuj profil**
  → `app_user` (`email`, `password_hash`, dane osobowe, `status`).

* **Przeglądaj katalog / Wyszukaj książkę / Szczegóły książki**
  → `book`, `author`, `book_author`, `category`, `book_copy` (dla info o liczbie dostępnych egzemplarzy).

* **Wypożycz książkę**
  → `loan` (dodanie wiersza powiązanego z `app_user` i `book_copy`, aktualizacja `book_copy.status`).

* **Zarezerwuj książkę**
  → `reservation` (dodanie rekordu, status `ACTIVE`, zabezpieczenie unikalnością).

* **Wyświetl aktualne wypożyczenia / historię wypożyczeń**
  → `loan` filtrowane po `user_id`, `return_date`.

* **Przedłuż wypożyczenie**
  → aktualizacja `loan.due_date` i `extensions_count`.

* **Podgląd kar / ograniczeń**
  → `penalty` + `app_user.status`.

### 8.2. Administrator / Bibliotekarz

* **Logowanie do panelu**
  → `app_user.role = 'ADMIN'`.

* **Dodaj/edytuj/usuń książkę, oznacz wycofanie**
  → `book`, `book_author`, `category`, `book.is_active`.

* **Zarządzanie egzemplarzami (dodaj/usuń, oznacz zniszczone/zaginione)**
  → `book_copy` (`status`, `inventory_code`).

* **Rejestracja wypożyczenia / zwrotu**
  → `loan` (insert/update), `book_copy.status`.

* **Przegląd listy użytkowników / szczegółów / blokada konta**
  → `app_user`, `loan`, `penalty`.

* **Statystyki wypożyczeń / najczęściej wypożyczane książki / liczba wypożyczeń**
  → widoki `v_book_popularity_monthly`, `v_loans_per_day`.

---


