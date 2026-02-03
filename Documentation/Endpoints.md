
---

## 0. Konwencje ogólne

### 0.1. Prefix, auth, format

* Wszystko pod prefixem: ` /api`
* Format: JSON
* Autoryzacja: JWT w nagłówku:

```http
Authorization: Bearer <token>
```

* Role z bazy: `READER`, `ADMIN` (enum `user_role`). 
* Daty: ISO 8601, np. `"2025-11-30T15:00:00Z"`

### 0.2. Paginacja

Standardowy wrapper:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 125,
  "totalPages": 7
}
```

Query params: `?page=0&size=20&sort=title,asc`

---

## 1. Wspólne DTO (schematy JSON)

Żeby się nie powtarzać przy każdym endpointcie.

### 1.1. UserDto

```json
{
  "id": 1,
  "email": "reader@example.com",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "role": "READER",
  "status": "ACTIVE",
  "blockedReason": null,
  "blockedUntil": "2025-12-01T00:00:00Z",
  "createdAt": "2025-11-30T12:00:00Z"
}
```

### 1.2. CategoryDto

```json
{
  "id": 10,
  "name": "Fantasy",
  "parentId": null
}
```

### 1.3. AuthorDto

```json
{
  "id": 5,
  "firstName": "J.R.R.",
  "lastName": "Tolkien"
}
```

### 1.4. BookDto

```json
{
  "id": 100,
  "title": "Władca Pierścieni",
  "description": null,
  "publicationYear": 1954,
  "isbn": "978-1234567890",
  "category": {
    "id": 10,
    "name": "Fantasy",
    "parentId": null
  },
  "authors": [
    {
      "id": 5,
      "firstName": "J.R.R.",
      "lastName": "Tolkien"
    }
  ],
  "isActive": true,
  "totalCopies": 5,
  "availableCopies": 2
}
```

### 1.5. BookCopyDto (admin)

```json
{
  "id": 501,
  "bookId": 100,
  "inventoryCode": "INV-0001",
  "status": "AVAILABLE",
  "shelfLocation": "R1-P3",
  "createdAt": "2025-11-30T12:00:00Z",
  "updatedAt": "2025-11-30T12:00:00Z"
}
```

### 1.6. LoanDto

```json
{
  "id": 2001,
  "user": {
    "id": 1,
    "firstName": "Jan",
    "lastName": "Kowalski"
  },
  "bookCopy": {
    "id": 501,
    "inventoryCode": "INV-0001",
    "book": {
      "id": 100,
      "title": "Władca Pierścieni"
    }
  },
  "loanDate": "2025-11-20T10:00:00Z",
  "dueDate": "2025-12-20T10:00:00Z",
  "returnDate": null,
  "status": "ACTIVE",
  "extensionsCount": 1
}
```

### 1.7. ReservationDto

```json
{
  "id": 3001,
  "user": {
    "id": 1,
    "firstName": "Jan",
    "lastName": "Kowalski"
  },
  "book": {
    "id": 100,
    "title": "Władca Pierścieni"
  },
  "status": "ACTIVE",
  "createdAt": "2025-11-25T10:00:00Z",
  "cancelledAt": null,
  "fulfilledAt": null,
  "expiresAt": "2025-12-05T10:00:00Z"
}
```

### 1.8. PenaltyDto

```json
{
  "id": 4001,
  "user": {
    "id": 1,
    "firstName": "Jan",
    "lastName": "Kowalski"
  },
  "loanId": 2001,
  "amount": 15.0,
  "reason": "Przekroczony termin zwrotu",
  "status": "OPEN",
  "createdAt": "2025-11-30T12:00:00Z",
  "resolvedAt": null
}
```

### 1.9. AuthResponse

```json
{
  "token": "jwt-token-string",
  "user": { "id": 1, "email": "user@example.com" }
}
```

---

## 2. Moduł auth / profil

### 2.1. POST `/api/auth/register` (public)

Rejestracja czytelnika (`role=READER`).

**Body**

```json
{
  "email": "user@example.com",
  "password": "SuperTajneHaslo123!",
  "firstName": "Jan",
  "lastName": "Kowalski"
}
```

* `password` → backend hashuje i zapisuje w `password_hash`.

**201 Response**

```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "role": "READER",
  "status": "ACTIVE"
}
```

### 2.2. POST `/api/auth/login` (public)

**Body**

```json
{
  "email": "user@example.com",
  "password": "SuperTajneHaslo123!"
}
```

**200 Response**

```json
{
  "token": "jwt-token",
  "user": {}
}
```

Błędy: `401` – nieprawidłowe dane, `403` – status `BLOCKED`.

### 2.3. GET `/api/auth/me` (zalogowany)

Zwraca aktualnego użytkownika na podstawie JWT.

**200 Response**

`UserDto`

### 2.4. PATCH `/api/auth/change-password` (zalogowany)

Zmiana hasła własnego.

**Body**

```json
{
  "currentPassword": "Old123!",
  "newPassword": "New123!"
}
```

**204** – bez body.

### 2.5. PATCH `/api/me/profile` (zalogowany)

Edycja własnych danych (bez roli/statusu).

**Body**

```json
{
  "firstName": "NoweImie",
  "lastName": "NoweNazwisko"
}
```

**200 Response**

`UserDto`

---

## 3. Użytkownicy – panel admina

### 3.1. GET `/api/admin/users` (ADMIN)

Lista użytkowników + filtry.

**Query params (opcjonalne)**

* `page`, `size`, `sort` (np. `lastName,asc`)
* `role=READER|ADMIN`
* `status=ACTIVE|BLOCKED`
* `search=` (fragment imienia/nazwiska/mail)

**200 Response**

`Page<UserDto>`

---

### 3.2. GET `/api/admin/users/{id}` (ADMIN)

Szczegóły użytkownika + podstawowe info o aktywnych wypożyczeniach.

**200 Response**

```json
{
  "user": { /* UserDto */ },
  "activeLoans": [ /* LoanDto (tylko ACTIVE/OVERDUE) */ ]
}
```

---

### 3.3. PATCH `/api/admin/users/{id}/status` (ADMIN)

Blokowanie / odblokowanie konta.

**Body**

```json
{
  "status": "BLOCKED",
  "blockedReason": "Zaległości w zwrotach",
  "blockedUntil": "2025-12-31T23:59:59Z"
}
```

**200 Response**

`UserDto`

---

### 3.4. POST `/api/admin/users/{id}/reset-password` (ADMIN)

Generuje tymczasowe hasło, zapisuje hash w bazie, wysyła np. maila (lub zwraca plaintext tylko w dev).

**200 Response (dev)**

```json
{
  "temporaryPassword": "Abc123!xyz"
}
```

---

### 3.5. GET `/api/admin/users/{id}/loans` (ADMIN)

Historia wypożyczeń konkretnego usera (wszystkie statusy).

**Query params**: `page`, `size`, `status` (opcjonalne)

**200 Response**

`Page<LoanDto>`

---

### 3.6. GET `/api/admin/users/{id}/penalties` (ADMIN)

Kary danego usera.

**Query params**: `status=OPEN|PAID|CANCELLED`

**200 Response**

`Page<PenaltyDto>`

---

## 4. Katalog – książki, kategorie, autorzy

### 4.1. GET `/api/books` (public / zalogowany)

Lista książek do katalogu z filtrowaniem + sortowaniem. Spełnia wymaganie przeglądania / sortowania. 

**Query params (opcjonalne)**

* `page`, `size`, `sort` (np. `title,asc` / `publicationYear,desc`)
* `title=` (fragment)
* `author=` (fragment imienia/nazwiska)
* `categoryId=`
* `publicationYearFrom=`, `publicationYearTo=`
* `availableOnly=true|false` (domyślnie false; jeśli true → tylko książki z `availableCopies > 0`)
* `activeOnly=true|false` (domyślnie true; `book.is_active`)

**200 Response**

`Page<BookDto>`

---

### 4.2. GET `/api/books/{id}` (public / zalogowany)

Szczegóły książki.

**200 Response**

`BookDto` + opcjonalnie lista rezerwacji usera.

---

### 4.3. GET `/api/books/{id}/availability` (public / zalogowany)

Zwięzła info o egzemplarzach.

**200 Response**

```json
{
  "bookId": 100,
  "totalCopies": 5,
  "availableCopies": 2,
  "borrowedCopies": 3,
  "lostCopies": 0,
  "withdrawnCopies": 0
}
```

---

### 4.4. GET `/api/categories` (public)

Drzewo kategorii albo lista płaska.

**Query param**: `tree=true|false` (domyślnie `false`)

**200 Response (tree=true)**

```json
[
  {
    "id": 1,
    "name": "Literatura",
    "parentId": null,
    "children": [
      {
        "id": 10,
        "name": "Fantasy",
        "parentId": 1,
        "children": []
      }
    ]
  }
]
```

---

### 4.5. GET `/api/authors` (public)

Lista autorów do filtrowania na froncie.

**Query params**

* `page`, `size`, `sort`
* `search=` (fragment imienia/nazwiska)

**200 Response**

`Page<AuthorDto>`

---

## 5. Zarządzanie katalogiem – ADMIN

### 5.1. POST `/api/admin/books` (ADMIN)

Dodanie nowej książki.

**Body**

```json
{
  "title": "Władca Pierścieni",
  "description": "Opis...",
  "publicationYear": 1954,
  "isbn": "978-1234567890",
  "categoryId": 10,
  "authorIds": [5],
  "initialCopies": 3
}
```

Back:

* tworzy rekord w `book`
* zapisuje relacje w `book_author`
* tworzy `initialCopies` w `book_copy` z `status=AVAILABLE`. 

**201 Response**

`BookDto`

---

### 5.2. PUT `/api/admin/books/{id}` (ADMIN)

Edycja danych książki.

**Body**

```json
{
  "title": "Nowy tytuł",
  "description": "Nowy opis",
  "publicationYear": 2000,
  "isbn": "978-9999999999",
  "categoryId": 12,
  "authorIds": [5, 6],
  "isActive": true
}
```

**200 Response**

`BookDto`

---

### 5.3. DELETE `/api/admin/books/{id}` (ADMIN)

Logiczne wycofanie książki (`is_active = false`) – nie usuwamy rekordów, jeśli były wypożyczenia.

**200 Response**

```json
{ "id": 100, "isActive": false }
```

---

### 5.4. POST `/api/admin/authors` (ADMIN)

Dodanie autora.

**Body**

```json
{
  "firstName": "Andrzej",
  "lastName": "Sapkowski"
}
```

**201 Response**

`AuthorDto`

---

### 5.5. PUT `/api/admin/authors/{id}` (ADMIN)

Edycja autora.

**Body**

```json
{
  "firstName": "Andrzej",
  "lastName": "Sapkowski"
}
```

**200 Response**

`AuthorDto`

---

### 5.6. POST `/api/admin/categories` (ADMIN)

Dodanie kategorii.

**Body**

```json
{
  "name": "Kryminał",
  "parentId": 1
}
```

**201 Response**

`CategoryDto`

---

### 5.7. PUT `/api/admin/categories/{id}` (ADMIN)

Edycja nazwy / rodzica.

**Body**

```json
{
  "name": "Kryminał / Thriller",
  "parentId": 1
}
```

**200 Response**

`CategoryDto`

---

### 5.8. DELETE `/api/admin/categories/{id}` (ADMIN)

Usunięcie kategorii (jeśli nie ma powiązanych książek) lub zmiana na `parent_id=null`.

**204** – brak body.

---

## 6. Egzemplarze książek (book_copy) – ADMIN

### 6.1. GET `/api/admin/book-copies` (ADMIN)

Lista egzemplarzy z filtrami.

**Query params**

* `page`, `size`, `sort`
* `bookId=`
* `status=AVAILABLE|BORROWED|LOST|DAMAGED|WITHDRAWN`

**200 Response**

`Page<BookCopyDto>`

---

### 6.2. POST `/api/admin/book-copies` (ADMIN)

Dodanie egzemplarza (pojedynczego lub wielu).

**Body – pojedynczy**

```json
{
  "bookId": 100,
  "inventoryCode": "INV-0004",
  "shelfLocation": "R1-P3"
}
```

**Body – batch**

```json
{
  "bookId": 100,
  "copies": [
    { "inventoryCode": "INV-0005", "shelfLocation": "R1-P3" },
    { "inventoryCode": "INV-0006", "shelfLocation": "R1-P4" }
  ]
}
```

**201 Response**

Lista `BookCopyDto` lub pojedynczy.

---

### 6.3. PATCH `/api/admin/book-copies/{id}` (ADMIN)

Zmiana statusu / lokalizacji.

**Body**

```json
{
  "status": "DAMAGED",
  "shelfLocation": "MAGAZYN"
}
```

**200 Response**

`BookCopyDto`

---

### 6.4. DELETE `/api/admin/book-copies/{id}` (ADMIN)

Praktycznie: ustaw `status = WITHDRAWN` zamiast twardego delete, jeśli były wypożyczenia.

**200 Response**

`BookCopyDto`

---

## 7. Wypożyczenia – czytelnik

### 7.1. GET `/api/me/loans` (READER)

Aktualne wypożyczenia zalogowanego użytkownika.

**Query params**: `status=ACTIVE|OVERDUE` (domyślnie oba)

**200 Response**

`Page<LoanDto>`

---

### 7.2. GET `/api/me/loans/history` (READER)

Historia wypożyczeń (zwrócone, utracone).

**Query params**: `page`, `size`

**200 Response**

`Page<LoanDto>`

---

### 7.3. POST `/api/loans` (READER)

Czytelnik wypożycza książkę – backend wybiera wolny egzemplarz (`book_copy.status=AVAILABLE`).

**Body**

```json
{
  "bookId": 100
}
```

Logika:

* sprawdź, czy user nie ma blokady (`user_status != BLOCKED`)
* znajdź wolny egzemplarz
* utwórz `loan` z `status=ACTIVE`, `due_date = now + X dni`
* ustaw `book_copy.status = BORROWED`
* jeśli istniała aktywna rezerwacja tego usera na tę książkę → oznacz ją `FULFILLED`.

**201 Response**

`LoanDto`

---

### 7.4. POST `/api/loans/{id}/extend` (READER)

Przedłużenie terminu wypożyczenia (jeśli regulamin pozwala).

**Body**

```json
{
  "additionalDays": 14
}
```

Backend:

* sprawdza, czy user jest właścicielem tego loan
* sprawdza `extensions_count` vs limit
* ustawia nowy `due_date` i inkrementuje `extensions_count`.

**200 Response**

`LoanDto`

---

## 8. Wypożyczenia – ADMIN

### 8.1. GET `/api/admin/loans` (ADMIN)

Lista wypożyczeń z filtrami.

**Query params**

* `page`, `size`, `sort`
* `status=ACTIVE|RETURNED|OVERDUE|LOST`
* `userId=`
* `bookId=`
* `fromDate=2025-11-01`, `toDate=2025-11-30`

**200 Response**

`Page<LoanDto>`

---

### 8.2. POST `/api/admin/loans` (ADMIN)

Ręczne zarejestrowanie wypożyczenia (np. przy stanowisku bibliotekarza).

**Body**

```json
{
  "userId": 1,
  "bookCopyId": 501,
  "dueDate": "2025-12-20T10:00:00Z"
}
```

**201 Response**

`LoanDto`

---

### 8.3. POST `/api/admin/loans/{id}/return` (ADMIN)

Rejestruje zwrot.

Backend:

* ustawia `return_date = now`, `status=RETURNED`
* zmienia `book_copy.status = AVAILABLE`
* jeśli są aktywne rezerwacje na tę książkę → można triggerować powiadomienie.

**200 Response**

`LoanDto`

---

### 8.4. POST `/api/admin/loans/{id}/mark-lost` (ADMIN)

Oznaczenie wypożyczenia / egzemplarza jako utraconego + potencjalna kara.

**Body**

```json
{
  "createPenalty": true,
  "penaltyAmount": 50.0,
  "penaltyReason": "Utrata egzemplarza"
}
```

Backend:

* `loan.status = LOST`,
* `book_copy.status = LOST`,
* opcjonalnie tworzy `penalty`.

**200 Response**

```json
{
  "loan": { /* LoanDto */ },
  "penalty": { /* PenaltyDto or null */ }
}
```

---

## 9. Rezerwacje – czytelnik

### 9.1. GET `/api/me/reservations` (READER)

Lista rezerwacji zalogowanego usera.

**Query params**: `status=ACTIVE|CANCELLED|FULFILLED|EXPIRED` (domyślnie `ACTIVE`)

**200 Response**

`Page<ReservationDto>`

---

### 9.2. POST `/api/reservations` (READER)

Rezerwacja książki, jeśli nie ma wolnych egzemplarzy.

**Body**

```json
{
  "bookId": 100
}
```

Backend:

* sprawdza brak wolnych `book_copy` dla tego `book_id`
* tworzy `reservation` z `status=ACTIVE`, ustawia `expires_at` (np. 3 dni od momentu, gdy egzemplarz się zwolni – to możesz obsłużyć logiką później).

**201 Response**

`ReservationDto`

---

### 9.3. DELETE `/api/reservations/{id}` (READER)

Anulowanie własnej rezerwacji.

**200 Response**

`ReservationDto` z `status="CANCELLED"` i `cancelledAt` ustawionym.

---

## 10. Rezerwacje – ADMIN

### 10.1. GET `/api/admin/reservations` (ADMIN)

Lista rezerwacji z filtrami.

**Query params**

* `page`, `size`
* `status=ACTIVE|CANCELLED|FULFILLED|EXPIRED`
* `userId=`
* `bookId=`

**200 Response**

`Page<ReservationDto>`

---

### 10.2. POST `/api/admin/reservations/{id}/fulfill` (ADMIN)

Ręczne spełnienie rezerwacji (np. egzemplarz odłożony na odbiór).

**Body (opcjonalne)**

```json
{
  "bookCopyId": 501,
  "dueDate": "2025-12-20T10:00:00Z"
}
```

Backend:

* tworzy `loan` dla wskazanego usera / bookCopy
* `reservation.status = FULFILLED`, `fulfilledAt = now`.

**200 Response**

```json
{
  "reservation": { /* ReservationDto */ },
  "loan": { /* LoanDto */ }
}
```

---

### 10.3. POST `/api/admin/reservations/{id}/expire` (ADMIN)

Ręczne oznaczenie rezerwacji jako wygasłej (np. user nie odebrał).

**200 Response**

`ReservationDto` (`status=EXPIRED`)

---

## 11. Kary / opłaty

### 11.1. GET `/api/me/penalties` (READER)

Czytelnik widzi swoje kary.

**Query params**: `status=OPEN|PAID|CANCELLED` (domyślnie `OPEN`)

**200 Response**

`Page<PenaltyDto>`

---

### 11.2. GET `/api/admin/penalties` (ADMIN)

Lista kar z filtrami.

**Query params**

* `page`, `size`
* `status`
* `userId=`

**200 Response**

`Page<PenaltyDto>`

---

### 11.3. POST `/api/admin/penalties` (ADMIN)

Ręczne utworzenie kary (np. za zniszczenie książki).

**Body**

```json
{
  "userId": 1,
  "loanId": 2001,
  "amount": 20.0,
  "reason": "Zniszczona okładka"
}
```

**201 Response**

`PenaltyDto`

---

### 11.4. POST `/api/admin/penalties/{id}/mark-paid` (ADMIN)

Oznaczenie jako opłacone.

**200 Response**

`PenaltyDto` (`status=PAID`, `resolvedAt` ustawione)

---

### 11.5. POST `/api/admin/penalties/{id}/cancel` (ADMIN)

Anulowanie kary.

**200 Response**

`PenaltyDto` (`status=CANCELLED`, `resolvedAt` ustawione)

---

## 12. Statystyki (do wykresów czasowych)

Masz dwa widoki w bazie: `v_book_popularity_monthly` i `v_loans_per_day` – idealne pod moduł statystyk czasowych.

### 12.1. GET `/api/admin/stats/book-popularity` (ADMIN)

Na potrzeby wykresu „najczęściej wypożyczane książki w danym miesiącu”.

**Query params**

* `fromMonth=2025-01-01` (start miesiąca)
* `toMonth=2025-12-01`
* `limit=10` (ile top książek)

**200 Response**

```json
[
  {
    "month": "2025-11-01T00:00:00Z",
    "bookId": 100,
    "title": "Władca Pierścieni",
    "loansCount": 25
  },
  {
    "month": "2025-11-01T00:00:00Z",
    "bookId": 101,
    "title": "Hobbit",
    "loansCount": 15
  }
]
```

Dane z `v_book_popularity_monthly`.

---

### 12.2. GET `/api/admin/stats/loans-per-day` (ADMIN)

Wykres wypożyczeń per dzień (np. w wybranym miesiącu).

**Query params**

* `from=2025-11-01`
* `to=2025-11-30`

**200 Response**

```json
[
  { "day": "2025-11-01", "loansCount": 5 },
  { "day": "2025-11-02", "loansCount": 12 }
]
```

Dane z `v_loans_per_day`.

---

### 12.3. GET `/api/admin/stats/summary` (ADMIN)

Szybki dashboard.

**Query params**

* `from=2025-11-01`
* `to=2025-11-30`

**200 Response**

```json
{
  "totalLoans": 250,
  "newUsers": 30,
  "activeUsers": 120,
  "overdueLoans": 15,
  "mostPopularBooks": [
    {
      "bookId": 100,
      "title": "Władca Pierścieni",
      "loansCount": 25
    }
  ]
}
```

---

## 13. Dodatkowe – zdrowie / wersja

Nie są konieczne pod zaliczenie, ale przydatne:

### 13.1. GET `/api/health` (public)

```json
{ "status": "UP" }
```

### 13.2. GET `/api/version` (public)

```json
{
  "app": "library-api",
  "version": "1.0.0"
}
```

---