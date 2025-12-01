import requests
from typing import Iterable, Tuple

BASE_URL = "http://localhost:8080/api"
BASE_ROOT = "http://localhost:8080"

# ==== TUTAJ USTAW PRAWDZIWE HASŁA ====
ADMIN_EMAIL = "admin.second@example.com"
ADMIN_PASSWORD = "admin123"   # MUSI PASOWAĆ DO HASHY W APP_USER
READER_EMAIL = "anna.reader@example.com"
READER_PASSWORD = "reader123" # J.W.
# =====================================

TIMEOUT = 5


def full_url(path: str) -> str:
    if not path.startswith("/"):
        path = "/" + path
    return BASE_URL + path


def check_status(
    resp: requests.Response,
    name: str,
    ok_statuses: Iterable[int] = (200, 201, 204),
) -> None:
    if resp is None:
        print(f"[FAIL] {name}: no response (exception)")
        return
    if resp.status_code in ok_statuses:
        print(f"[OK]   {name} -> {resp.status_code}")
    else:
        body = ""
        try:
            body = resp.text[:300]
        except Exception:
            body = "<no body readable>"
        print(f"[FAIL] {name} -> {resp.status_code}: {body}")


def safe_request(
    session: requests.Session,
    method: str,
    path: str,
    name: str,
    ok_statuses: Iterable[int] = (200, 201, 204),
    **kwargs,
) -> requests.Response:
    url = full_url(path)
    try:
        resp = session.request(method=method, url=url, timeout=TIMEOUT, **kwargs)
    except Exception as e:
        print(f"[ERR]  {name}: {e}")
        return None
    check_status(resp, name, ok_statuses)
    return resp


def login(session: requests.Session, email: str, password: str, label: str) -> str:
    resp = safe_request(
        session,
        "POST",
        "/auth/login",
        f"LOGIN {label}",
        json={"email": email, "password": password},
    )
    if not resp or resp.status_code != 200:
        print(f"[ABORT] Cannot log in as {label}, further tests may fail.")
        return None
    data = resp.json()
    token = data.get("token")
    if not token:
        print(f"[FAIL] {label} login did not return JWT token.")
        return None
    session.headers.update({"Authorization": f"Bearer {token}"})
    return token


def main():
    public_s = requests.Session()
    admin_s = requests.Session()
    reader_s = requests.Session()

    print("=== HEALTH CHECK ===")
    try:
        resp = requests.get(f"{BASE_ROOT}/health", timeout=TIMEOUT)
        check_status(resp, "PUBLIC /health")
    except Exception as e:
        print(f"[ERR]  PUBLIC /health: {e}")

    print("\n=== AUTH: LOGIN ===")
    admin_token = login(admin_s, ADMIN_EMAIL, ADMIN_PASSWORD, "ADMIN")
    reader_token = login(reader_s, READER_EMAIL, READER_PASSWORD, "READER")

    print("\n=== PUBLIC CATALOG ENDPOINTS ===")
    # /books – paginated list
    r_books = safe_request(
        public_s, "GET", "/books?page=0&size=5", "GET /books (public)"
    )
    books_page = None
    first_book_id = None
    if r_books and r_books.status_code == 200:
        try:
            books_page = r_books.json()
            content = books_page.get("content", [])
            if isinstance(content, list) and content:
                first_book_id = content[0].get("id")
        except Exception as e:
            print(f"[WARN] Cannot parse /books JSON: {e}")

    safe_request(public_s, "GET", "/categories", "GET /categories (public)")
    safe_request(public_s, "GET", "/authors?page=0&size=5", "GET /authors (public)")

    if first_book_id is not None:
        safe_request(
            public_s, "GET", f"/books/{first_book_id}", "GET /books/{id} (public)"
        )
        safe_request(
            public_s,
            "GET",
            f"/books/{first_book_id}/availability",
            "GET /books/{id}/availability (public)",
        )
    else:
        print("[WARN] No bookId from /books, skipping details/availability tests.")

    print("\n=== READER ENDPOINTS ===")
    if reader_token:
        # /auth/me
        r_me = safe_request(reader_s, "GET", "/auth/me", "READER GET /auth/me")
        reader_id = None
        if r_me and r_me.status_code == 200:
            try:
                me = r_me.json()
                reader_id = me.get("id")
            except Exception as e:
                print(f"[WARN] Cannot parse /auth/me JSON for reader: {e}")

        safe_request(reader_s, "GET", "/me/loans?page=0&size=10", "GET /me/loans")
        safe_request(
            reader_s,
            "GET",
            "/me/loans/history?page=0&size=10",
            "GET /me/loans/history",
        )
        safe_request(
            reader_s,
            "GET",
            "/me/reservations?page=0&size=10",
            "GET /me/reservations",
        )
        safe_request(
            reader_s,
            "GET",
            "/me/penalties?page=0&size=10",
            "GET /me/penalties",
        )

        # READER shouldn't access admin endpoints
        safe_request(
            reader_s,
            "GET",
            "/admin/users",
            "READER GET /admin/users (should be 403)",
            ok_statuses=(403,),
        )

        # Try to extend one of the reader loans (business may return 200 or 4xx)
        r_loans = safe_request(
            reader_s,
            "GET",
            "/me/loans?page=0&size=5",
            "GET /me/loans (for extend)",
        )
        loan_id = None
        if r_loans and r_loans.status_code == 200:
            try:
                loans_page = r_loans.json()
                content = loans_page.get("content", [])
                if isinstance(content, list) and content:
                    loan_id = content[0].get("id")
            except Exception as e:
                print(f"[WARN] Cannot parse /me/loans JSON: {e}")

        if loan_id is not None:
            # Akceptujemy 200/400/403/409 – ma być obsłużone, nie 404/500
            safe_request(
                reader_s,
                "POST",
                f"/loans/{loan_id}/extend",
                f"POST /loans/{loan_id}/extend",
                json={"additionalDays": 7},
                ok_statuses=(200, 400, 403, 409),
            )
        else:
            print("[WARN] No loanId for reader, skipping /loans/{id}/extend test.")

    else:
        print("[WARN] Skipping READER tests – login failed.")

    print("\n=== ADMIN ENDPOINTS ===")
    if admin_token:
        # /auth/me
        r_admin_me = safe_request(admin_s, "GET", "/auth/me", "ADMIN GET /auth/me")
        admin_id = None
        if r_admin_me and r_admin_me.status_code == 200:
            try:
                me = r_admin_me.json()
                admin_id = me.get("id")
            except Exception as e:
                print(f"[WARN] Cannot parse /auth/me JSON for admin: {e}")

        # Users
        r_users = safe_request(
            admin_s,
            "GET",
            "/admin/users?page=0&size=10",
            "GET /admin/users",
        )
        some_user_id = None
        if r_users and r_users.status_code == 200:
            try:
                users_page = r_users.json()
                ucontent = users_page.get("content", [])
                if isinstance(ucontent, list) and ucontent:
                    some_user_id = ucontent[0].get("id")
            except Exception as e:
                print(f"[WARN] Cannot parse /admin/users JSON: {e}")

        if some_user_id is not None:
            safe_request(
                admin_s,
                "GET",
                f"/admin/users/{some_user_id}",
                "GET /admin/users/{id}",
            )
            safe_request(
                admin_s,
                "GET",
                f"/admin/users/{some_user_id}/loans?page=0&size=10",
                "GET /admin/users/{id}/loans",
            )
            safe_request(
                admin_s,
                "GET",
                f"/admin/users/{some_user_id}/penalties?page=0&size=10",
                "GET /admin/users/{id}/penalties",
            )
        else:
            print("[WARN] No userId from /admin/users, skipping related tests.")

        # Loans / reservations / penalties lists
        r_admin_loans = safe_request(
            admin_s,
            "GET",
            "/admin/loans?page=0&size=10",
            "GET /admin/loans",
        )
        loan_id_admin = None
        if r_admin_loans and r_admin_loans.status_code == 200:
            try:
                lp = r_admin_loans.json()
                lcontent = lp.get("content", [])
                if isinstance(lcontent, list) and lcontent:
                    loan_id_admin = lcontent[0].get("id")
            except Exception as e:
                print(f"[WARN] Cannot parse /admin/loans JSON: {e}")

        safe_request(
            admin_s,
            "GET",
            "/admin/reservations?page=0&size=10",
            "GET /admin/reservations",
        )
        r_admin_penalties = safe_request(
            admin_s,
            "GET",
            "/admin/penalties?page=0&size=10",
            "GET /admin/penalties",
        )
        penalty_id_admin = None
        if r_admin_penalties and r_admin_penalties.status_code == 200:
            try:
                pp = r_admin_penalties.json()
                pcontent = pp.get("content", [])
                if isinstance(pcontent, list) and pcontent:
                    penalty_id_admin = pcontent[0].get("id")
            except Exception as e:
                print(f"[WARN] Cannot parse /admin/penalties JSON: {e}")

        # Akcje na loan – tu świadomie dopuszczamy 200 lub 4xx (walidacja) ale nie 404/5xx
        if loan_id_admin is not None:
            safe_request(
                admin_s,
                "POST",
                f"/admin/loans/{loan_id_admin}/return",
                f"POST /admin/loans/{loan_id_admin}/return",
                ok_statuses=(200, 400, 403, 409),
            )
            safe_request(
                admin_s,
                "POST",
                f"/admin/loans/{loan_id_admin}/mark-lost",
                f"POST /admin/loans/{loan_id_admin}/mark-lost",
                json={
                    "createPenalty": False,
                    "penaltyAmount": 0.0,
                    "penaltyReason": "Test lost",
                },
                ok_statuses=(200, 400, 403, 409),
            )
        else:
            print("[WARN] No loanId for admin, skipping return/mark-lost tests.")

        # Akcje na penalties (business może zwrócić 200 lub 4xx)
        if penalty_id_admin is not None:
            safe_request(
                admin_s,
                "POST",
                f"/admin/penalties/{penalty_id_admin}/mark-paid",
                f"POST /admin/penalties/{penalty_id_admin}/mark-paid",
                ok_statuses=(200, 400, 403, 409),
            )
            safe_request(
                admin_s,
                "POST",
                f"/admin/penalties/{penalty_id_admin}/cancel",
                f"POST /admin/penalties/{penalty_id_admin}/cancel",
                ok_statuses=(200, 400, 403, 409),
            )
        else:
            print("[WARN] No penaltyId for admin, skipping penalty actions.")

        # Statystyki (zakres obejmujący dane z DummyData.sql)
        safe_request(
            admin_s,
            "GET",
            "/admin/stats/book-popularity?fromMonth=2024-01-01&toMonth=2025-12-01&limit=10",
            "GET /admin/stats/book-popularity",
        )
        safe_request(
            admin_s,
            "GET",
            "/admin/stats/loans-per-day?from=2024-01-01&to=2025-12-31",
            "GET /admin/stats/loans-per-day",
        )
        safe_request(
            admin_s,
            "GET",
            "/admin/stats/summary?from=2024-01-01&to=2025-12-31",
            "GET /admin/stats/summary",
        )

        # Przykładowy test tworzenia kategorii (tworzy śmieciowy rekord w DB)
        safe_request(
            admin_s,
            "POST",
            "/admin/categories",
            "POST /admin/categories (create test category)",
            json={"name": "TEST_CATEGORY_API_CHECK", "parentId": None},
            ok_statuses=(201, 400, 409),
        )
    else:
        print("[WARN] Skipping ADMIN tests – login failed.")

    print("\n=== DONE ===")


if __name__ == "__main__":
    main()
