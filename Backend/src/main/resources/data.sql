INSERT INTO app_user (email, password_hash, first_name, last_name, role, status)
VALUES
  (
    'admin.second@example.com',
    '$2a$10$Dow1d3xOi7KoZkU7eRj6ieVeZ1JY9fUzP6FPOp8Quh2lF0FQ0qj/m',
    'Admin',
    'Second',
    'ADMIN',
    'ACTIVE'
  ),
  (
    'anna.reader@example.com',
    '$2a$10$2bAfQnuO4pY.7y8em7dYjOpT1uWJwwt6Gd26d9hQ8d9oBBJ5K.2xG',
    'Anna',
    'Reader',
    'READER',
    'ACTIVE'
  )
AS new
ON DUPLICATE KEY UPDATE
    password_hash = new.password_hash,
    first_name = new.first_name,
    last_name = new.last_name,
    role = new.role,
    status = new.status;

INSERT INTO category (name)
VALUES ('Science Fiction'), ('Classics')
AS new
ON DUPLICATE KEY UPDATE name = new.name;

INSERT INTO author (first_name, last_name)
SELECT 'George', 'Orwell'
WHERE NOT EXISTS (
  SELECT 1 FROM author WHERE first_name = 'George' AND last_name = 'Orwell'
);

INSERT INTO author (first_name, last_name)
SELECT 'Jane', 'Austen'
WHERE NOT EXISTS (
  SELECT 1 FROM author WHERE first_name = 'Jane' AND last_name = 'Austen'
);

INSERT INTO book (title, description, publication_year, isbn, category_id, is_active)
SELECT
  '1984',
  'Dystopian tale of surveillance and control.',
  1949,
  '9780451524935',
  c.id,
  TRUE
FROM category c
WHERE c.name = 'Science Fiction'
  AND NOT EXISTS (SELECT 1 FROM book WHERE isbn = '9780451524935');

INSERT INTO book (title, description, publication_year, isbn, category_id, is_active)
SELECT
  'Pride and Prejudice',
  'Classic romance about manners and marriage.',
  1813,
  '9780141040349',
  c.id,
  TRUE
FROM category c
WHERE c.name = 'Classics'
  AND NOT EXISTS (SELECT 1 FROM book WHERE isbn = '9780141040349');

INSERT INTO book_author (book_id, author_id)
SELECT b.id, a.id
FROM book b
JOIN author a ON a.last_name = 'Orwell'
WHERE b.isbn = '9780451524935'
  AND NOT EXISTS (
    SELECT 1 FROM book_author ba WHERE ba.book_id = b.id AND ba.author_id = a.id
  );

INSERT INTO book_author (book_id, author_id)
SELECT b.id, a.id
FROM book b
JOIN author a ON a.last_name = 'Austen'
WHERE b.isbn = '9780141040349'
  AND NOT EXISTS (
    SELECT 1 FROM book_author ba WHERE ba.book_id = b.id AND ba.author_id = a.id
  );

INSERT INTO book_copy (book_id, inventory_code, status)
SELECT b.id, 'BK-1984-001', 'AVAILABLE'
FROM book b
WHERE b.isbn = '9780451524935'
  AND NOT EXISTS (
    SELECT 1 FROM book_copy bc WHERE bc.inventory_code = 'BK-1984-001'
  );

INSERT INTO book_copy (book_id, inventory_code, status)
SELECT b.id, 'BK-PP-001', 'AVAILABLE'
FROM book b
WHERE b.isbn = '9780141040349'
  AND NOT EXISTS (
    SELECT 1 FROM book_copy bc WHERE bc.inventory_code = 'BK-PP-001'
  );
