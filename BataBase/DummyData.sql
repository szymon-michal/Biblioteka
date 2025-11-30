









SET search_path TO public;

-- ============================================================
-- 1. UŻYTKOWNICY (5)
-- ============================================================

INSERT INTO app_user (email, password_hash, first_name, last_name, role, status)
VALUES
  ('john.reader@example.com',  'bcrypt$john',  'John',  'Reader',  'READER', 'ACTIVE'),
  ('anna.reader@example.com',  'bcrypt$anna',  'Anna',  'Reader',  'READER', 'ACTIVE'),
  ('mark.reader@example.com',  'bcrypt$mark',  'Mark',  'Reader',  'READER', 'ACTIVE'),
  ('admin.main@example.com',   'bcrypt$admin', 'Alice', 'Admin',   'ADMIN',  'ACTIVE'),
  ('admin.second@example.com', 'bcrypt$admin', 'Bob',   'Admin',   'ADMIN',  'ACTIVE');


-- ============================================================
-- 2. KATEGORIE (5)
-- ============================================================

INSERT INTO category (name, parent_id)
VALUES
  ('IT',        NULL),
  ('Fantasy',   NULL),
  ('Science',   NULL),
  ('History',   NULL),
  ('Biography', NULL);


-- ============================================================
-- 3. AUTORZY (5)
-- ============================================================

INSERT INTO author (first_name, last_name)
VALUES
  ('Robert C.',  'Martin'),
  ('Andrew',     'Hunt'),
  ('J.R.R.',     'Tolkien'),
  ('Isaac',      'Asimov'),
  ('Yuval Noah', 'Harari');


-- ============================================================
-- 4. KSIĄŻKI (10)
-- ============================================================

INSERT INTO book (title, description, publication_year, isbn, category_id)
VALUES
  ('Clean Code',
   'A Handbook of Agile Software Craftsmanship.',
   2008,
   '9780132350884',
   (SELECT id FROM category WHERE name = 'IT')),

  ('The Pragmatic Programmer',
   'Journey to Mastery for software developers.',
   1999,
   '9780201616224',
   (SELECT id FROM category WHERE name = 'IT')),

  ('Refactoring',
   'Improving the design of existing code.',
   1999,
   '9780201485677',
   (SELECT id FROM category WHERE name = 'IT')),

  ('The Lord of the Rings',
   'Epic fantasy novel set in Middle-earth.',
   1954,
   '9780261102385',
   (SELECT id FROM category WHERE name = 'Fantasy')),

  ('The Hobbit',
   'Prequel to The Lord of the Rings.',
   1937,
   '9780261102217',
   (SELECT id FROM category WHERE name = 'Fantasy')),

  ('Foundation',
   'Classic science fiction novel.',
   1951,
   '9780553293357',
   (SELECT id FROM category WHERE name = 'Science')),

  ('I, Robot',
   'Collection of science fiction short stories.',
   1950,
   '9780553382563',
   (SELECT id FROM category WHERE name = 'Science')),

  ('Sapiens: A Brief History of Humankind',
   'History of humankind from Stone Age to present.',
   2011,
   '9780062316097',
   (SELECT id FROM category WHERE name = 'History')),

  ('Homo Deus: A Brief History of Tomorrow',
   'Speculation about the future of humankind.',
   2015,
   '9780062464316',
   (SELECT id FROM category WHERE name = 'History')),

  ('Educated',
   'Memoir about a woman who grows up in a strict household and pursues education.',
   2018,
   '9780399590504',
   (SELECT id FROM category WHERE name = 'Biography'));


-- ============================================================
-- 5. POWIĄZANIA KSIĄŻKA–AUTOR (N:M)
-- ============================================================

INSERT INTO book_author (book_id, author_id)
VALUES
  (
    (SELECT id FROM book   WHERE title = 'Clean Code'),
    (SELECT id FROM author WHERE last_name = 'Martin' AND first_name = 'Robert C.')
  ),
  (
    (SELECT id FROM book   WHERE title = 'The Pragmatic Programmer'),
    (SELECT id FROM author WHERE last_name = 'Hunt' AND first_name = 'Andrew')
  ),
  (
    (SELECT id FROM book   WHERE title = 'Refactoring'),
    (SELECT id FROM author WHERE last_name = 'Martin' AND first_name = 'Robert C.')
  ),
  (
    (SELECT id FROM book   WHERE title = 'The Lord of the Rings'),
    (SELECT id FROM author WHERE last_name = 'Tolkien')
  ),
  (
    (SELECT id FROM book   WHERE title = 'The Hobbit'),
    (SELECT id FROM author WHERE last_name = 'Tolkien')
  ),
  (
    (SELECT id FROM book   WHERE title = 'Foundation'),
    (SELECT id FROM author WHERE last_name = 'Asimov')
  ),
  (
    (SELECT id FROM book   WHERE title = 'I, Robot'),
    (SELECT id FROM author WHERE last_name = 'Asimov')
  ),
  (
    (SELECT id FROM book   WHERE title = 'Sapiens: A Brief History of Humankind'),
    (SELECT id FROM author WHERE last_name = 'Harari')
  ),
  (
    (SELECT id FROM book   WHERE title = 'Homo Deus: A Brief History of Tomorrow'),
    (SELECT id FROM author WHERE last_name = 'Harari')
  ),
  (
    (SELECT id FROM book   WHERE title = 'Educated'),
    (SELECT id FROM author WHERE last_name = 'Harari')
  );


-- ============================================================
-- 6. EGZEMPLARZE KSIĄŻEK (10)
-- ============================================================

INSERT INTO book_copy (book_id, inventory_code, status, shelf_location)
VALUES
  (
    (SELECT id FROM book WHERE title = 'Clean Code'),
    'INV-0001',
    'BORROWED',
    'IT-01-01'
  ),
  (
    (SELECT id FROM book WHERE title = 'Clean Code'),
    'INV-0002',
    'AVAILABLE',
    'IT-01-02'
  ),
  (
    (SELECT id FROM book WHERE title = 'The Pragmatic Programmer'),
    'INV-0003',
    'BORROWED',
    'IT-02-01'
  ),
  (
    (SELECT id FROM book WHERE title = 'The Pragmatic Programmer'),
    'INV-0004',
    'AVAILABLE',
    'IT-02-02'
  ),
  (
    (SELECT id FROM book WHERE title = 'Refactoring'),
    'INV-0005',
    'BORROWED',
    'IT-03-01'
  ),
  (
    (SELECT id FROM book WHERE title = 'The Lord of the Rings'),
    'INV-0006',
    'AVAILABLE',
    'FAN-01-01'
  ),
  (
    (SELECT id FROM book WHERE title = 'The Hobbit'),
    'INV-0007',
    'LOST',
    'FAN-01-02'
  ),
  (
    (SELECT id FROM book WHERE title = 'Foundation'),
    'INV-0008',
    'BORROWED',
    'SCI-01-01'
  ),
  (
    (SELECT id FROM book WHERE title = 'Sapiens: A Brief History of Humankind'),
    'INV-0009',
    'LOST',
    'HIS-01-01'
  ),
  (
    (SELECT id FROM book WHERE title = 'Homo Deus: A Brief History of Tomorrow'),
    'INV-0010',
    'AVAILABLE',
    'HIS-01-02'
  );


-- ============================================================
-- 7. WYPOŻYCZENIA (9 – spójne z egzemplarzami)
-- ============================================================

-- 1. John wypożycza Clean Code (INV-0001) – aktywne
INSERT INTO loan (user_id, book_copy_id, loan_date, due_date, return_date, status, extensions_count, created_by)
VALUES (
  (SELECT id FROM app_user  WHERE email = 'john.reader@example.com'),
  (SELECT id FROM book_copy WHERE inventory_code = 'INV-0001'),
  '2025-01-10 10:00:00+01',
  '2025-01-24 23:59:59+01',
  NULL,
  'ACTIVE',
  0,
  (SELECT id FROM app_user WHERE email = 'admin.main@example.com')
);

-- 2. Anna wypożycza The Pragmatic Programmer (INV-0003) – aktywne
INSERT INTO loan (user_id, book_copy_id, loan_date, due_date, return_date, status, extensions_count, created_by)
VALUES (
  (SELECT id FROM app_user  WHERE email = 'anna.reader@example.com'),
  (SELECT id FROM book_copy WHERE inventory_code = 'INV-0003'),
  '2025-01-05 09:00:00+01',
  '2025-01-19 23:59:59+01',
  NULL,
  'ACTIVE',
  0,
  (SELECT id FROM app_user WHERE email = 'admin.main@example.com')
);

-- 3. John wcześniej wypożyczał Clean Code (INV-0002) – zwrócone
INSERT INTO loan (user_id, book_copy_id, loan_date, due_date, return_date, status, extensions_count, created_by)
VALUES (
  (SELECT id FROM app_user  WHERE email = 'john.reader@example.com'),
  (SELECT id FROM book_copy WHERE inventory_code = 'INV-0002'),
  '2024-11-01 10:00:00+01',
  '2024-11-15 23:59:59+01',
  '2024-11-14 15:30:00+01',
  'RETURNED',
  0,
  (SELECT id FROM app_user WHERE email = 'admin.main@example.com')
);

-- 4. Mark wypożyczał The Pragmatic Programmer (INV-0004) – zwrócone z opóźnieniem
INSERT INTO loan (user_id, book_copy_id, loan_date, due_date, return_date, status, extensions_count, created_by)
VALUES (
  (SELECT id FROM app_user  WHERE email = 'mark.reader@example.com'),
  (SELECT id FROM book_copy WHERE inventory_code = 'INV-0004'),
  '2024-10-01 09:00:00+01',
  '2024-10-15 23:59:59+01',
  '2024-10-25 12:00:00+01',
  'RETURNED',
  1,
  (SELECT id FROM app_user WHERE email = 'admin.second@example.com')
);

-- 5. Anna wypożycza Refactoring (INV-0005) – przetrzymane (OVERDUE)
INSERT INTO loan (user_id, book_copy_id, loan_date, due_date, return_date, status, extensions_count, created_by)
VALUES (
  (SELECT id FROM app_user  WHERE email = 'anna.reader@example.com'),
  (SELECT id FROM book_copy WHERE inventory_code = 'INV-0005'),
  '2024-12-01 11:00:00+01',
  '2024-12-15 23:59:59+01',
  NULL,
  'OVERDUE',
  0,
  (SELECT id FROM app_user WHERE email = 'admin.second@example.com')
);

-- 6. John wypożyczał The Lord of the Rings (INV-0006) – zwrócone
INSERT INTO loan (user_id, book_copy_id, loan_date, due_date, return_date, status, extensions_count, created_by)
VALUES (
  (SELECT id FROM app_user  WHERE email = 'john.reader@example.com'),
  (SELECT id FROM book_copy WHERE inventory_code = 'INV-0006'),
  '2024-09-01 10:00:00+02',
  '2024-09-15 23:59:59+02',
  '2024-09-14 16:00:00+02',
  'RETURNED',
  0,
  (SELECT id FROM app_user WHERE email = 'admin.main@example.com')
);

-- 7. Mark wypożycza Foundation (INV-0008) – aktywne
INSERT INTO loan (user_id, book_copy_id, loan_date, due_date, return_date, status, extensions_count, created_by)
VALUES (
  (SELECT id FROM app_user  WHERE email = 'mark.reader@example.com'),
  (SELECT id FROM book_copy WHERE inventory_code = 'INV-0008'),
  '2025-01-08 14:00:00+01',
  '2025-01-22 23:59:59+01',
  NULL,
  'ACTIVE',
  0,
  (SELECT id FROM app_user WHERE email = 'admin.main@example.com')
);

-- 8. Anna wypożycza Sapiens (INV-0009) – zaginęło (LOST)
INSERT INTO loan (user_id, book_copy_id, loan_date, due_date, return_date, status, extensions_count, created_by)
VALUES (
  (SELECT id FROM app_user  WHERE email = 'anna.reader@example.com'),
  (SELECT id FROM book_copy WHERE inventory_code = 'INV-0009'),
  '2024-08-01 09:00:00+02',
  '2024-08-15 23:59:59+02',
  NULL,
  'LOST',
  0,
  (SELECT id FROM app_user WHERE email = 'admin.second@example.com')
);

-- 9. Mark wypożyczał Homo Deus (INV-0010) – zwrócone
INSERT INTO loan (user_id, book_copy_id, loan_date, due_date, return_date, status, extensions_count, created_by)
VALUES (
  (SELECT id FROM app_user  WHERE email = 'mark.reader@example.com'),
  (SELECT id FROM book_copy WHERE inventory_code = 'INV-0010'),
  '2024-11-10 10:00:00+01',
  '2024-11-24 23:59:59+01',
  '2024-11-23 17:00:00+01',
  'RETURNED',
  0,
  (SELECT id FROM app_user WHERE email = 'admin.main@example.com')
);


-- ============================================================
-- 8. REZERWACJE (5)
-- ============================================================

-- 1. John rezerwuje The Hobbit – AKTYWNA
INSERT INTO reservation (user_id, book_id, created_at, status, expires_at)
VALUES (
  (SELECT id FROM app_user WHERE email = 'john.reader@example.com'),
  (SELECT id FROM book     WHERE title = 'The Hobbit'),
  '2025-01-15 09:00:00+01',
  'ACTIVE',
  '2025-01-25 23:59:59+01'
);

-- 2. Anna rezerwuje Clean Code – AKTYWNA
INSERT INTO reservation (user_id, book_id, created_at, status, expires_at)
VALUES (
  (SELECT id FROM app_user WHERE email = 'anna.reader@example.com'),
  (SELECT id FROM book     WHERE title = 'Clean Code'),
  '2025-01-12 10:30:00+01',
  'ACTIVE',
  '2025-01-22 23:59:59+01'
);

-- 3. Mark rezerwował Sapiens – ANULOWANA
INSERT INTO reservation (user_id, book_id, created_at, status, cancelled_at)
VALUES (
  (SELECT id FROM app_user WHERE email = 'mark.reader@example.com'),
  (SELECT id FROM book     WHERE title = 'Sapiens: A Brief History of Humankind'),
  '2024-12-01 12:00:00+01',
  'CANCELLED',
  '2024-12-05 09:00:00+01'
);

-- 4. John rezerwował Foundation – ZREALIZOWANA
INSERT INTO reservation (user_id, book_id, created_at, status, fulfilled_at)
VALUES (
  (SELECT id FROM app_user WHERE email = 'john.reader@example.com'),
  (SELECT id FROM book     WHERE title = 'Foundation'),
  '2024-11-01 08:00:00+01',
  'FULFILLED',
  '2024-11-03 10:00:00+01'
);

-- 5. Anna rezerwuje Educated – AKTYWNA
INSERT INTO reservation (user_id, book_id, created_at, status, expires_at)
VALUES (
  (SELECT id FROM app_user WHERE email = 'anna.reader@example.com'),
  (SELECT id FROM book     WHERE title = 'Educated'),
  '2025-01-18 11:00:00+01',
  'ACTIVE',
  '2025-01-28 23:59:59+01'
);


-- ============================================================
-- 9. KARY (3)
-- ============================================================

-- A. Kara za przetrzymanie Refactoring (INV-0005) – ANNA, OTWARTA
INSERT INTO penalty (user_id, loan_id, amount, reason, status, created_at, resolved_at)
VALUES (
  (SELECT id FROM app_user WHERE email = 'anna.reader@example.com'),
  (
    SELECT l.id
    FROM loan l
    JOIN app_user u  ON u.id  = l.user_id
    JOIN book_copy bc ON bc.id = l.book_copy_id
    WHERE u.email = 'anna.reader@example.com'
      AND bc.inventory_code = 'INV-0005'
      AND l.due_date = '2024-12-15 23:59:59+01'
    LIMIT 1
  ),
  20.00,
  'Przetrzymanie książki "Refactoring" o ponad 7 dni.',
  'OPEN',
  '2024-12-23 10:00:00+01',
  NULL
);

-- B. Kara za zagubienie Sapiens (INV-0009) – ANNA, OTWARTA
INSERT INTO penalty (user_id, loan_id, amount, reason, status, created_at, resolved_at)
VALUES (
  (SELECT id FROM app_user WHERE email = 'anna.reader@example.com'),
  (
    SELECT l.id
    FROM loan l
    JOIN app_user u  ON u.id  = l.user_id
    JOIN book_copy bc ON bc.id = l.book_copy_id
    WHERE u.email = 'anna.reader@example.com'
      AND bc.inventory_code = 'INV-0009'
      AND l.status = 'LOST'
    LIMIT 1
  ),
  80.00,
  'Zagubienie egzemplarza "Sapiens: A Brief History of Humankind".',
  'OPEN',
  '2024-08-20 09:00:00+02',
  NULL
);

-- C. Kara za opóźniony zwrot The Pragmatic Programmer (INV-0004) – MARK, ZAPŁACONA
INSERT INTO penalty (user_id, loan_id, amount, reason, status, created_at, resolved_at)
VALUES (
  (SELECT id FROM app_user WHERE email = 'mark.reader@example.com'),
  (
    SELECT l.id
    FROM loan l
    JOIN app_user u  ON u.id  = l.user_id
    JOIN book_copy bc ON bc.id = l.book_copy_id
    WHERE u.email = 'mark.reader@example.com'
      AND bc.inventory_code = 'INV-0004'
      AND l.return_date = '2024-10-25 12:00:00+01'
    LIMIT 1
  ),
  10.00,
  'Opóźniony zwrot "The Pragmatic Programmer".',
  'PAID',
  '2024-10-26 09:00:00+01',
  '2024-10-28 12:00:00+01'
);

-- ==============================================
-- KONIEC sample_data.sql
-- ==============================================
