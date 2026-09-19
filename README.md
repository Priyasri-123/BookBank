# 📚 Smart Book Bank Management System

A full-stack library/book-bank management system built as a portfolio project, demonstrating
production-style backend architecture (Spring Boot + MySQL + JWT security) and a modern
React frontend.

---

## 1. Overview

Students can search the catalog, borrow and reserve books, and track due dates and fines.
Librarians manage the day-to-day circulation desk: approving requests, issuing and returning
books, and tracking overdue items. Admins manage the full catalog, users, and system-wide
business rules (fine amounts, borrow periods).

## 2. Features

- JWT-based authentication with role-based authorization (`ADMIN`, `LIBRARIAN`, `STUDENT`)
- Book catalog with author/publisher/category relationships, search, filtering, and pagination
- Separate **Book** (catalog title) vs **BookCopy** (physical, borrowable unit) modeling
- Full borrow workflow: request → approve/reject → issue → return, with automatic fine
  calculation based on a configurable fine-per-day rate
- Reservation queue for books with no available copies, with automatic notification when a
  copy becomes free
- Role-specific dashboards (Admin / Librarian / Student) with live statistics
- In-app notifications
- Soft-delete for books (borrowing history is preserved)
- Global exception handling with a consistent JSON error shape
- Interactive API documentation via Swagger / OpenAPI
- Configurable business rules stored in the database (`system_settings` table), editable
  from the Admin UI without a redeploy

## 3. Technology Stack

**Backend:** Java 17, Spring Boot 3.3.4, Spring Security, Spring Data JPA / Hibernate, MySQL,
JWT (jjwt 0.12.6), BCrypt, Springdoc OpenAPI (Swagger), Maven, Lombok, JUnit 5 + Mockito, H2 (tests)

**Frontend:** React 18, React Router, Axios, Vite

**Database:** MySQL 8

## 4. Architecture

```
React Frontend  →  REST API (JWT)  →  Spring Boot
                                          ├── Controller layer
                                          ├── Service layer (business logic)
                                          ├── Repository layer (Spring Data JPA)
                                          ├── Entity layer (JPA / Hibernate)
                                          └── MySQL
```

Backend package structure:

```
com.bookbank
├── config          # Security, CORS, Swagger, DataSeeder, ScheduledTasks
├── controller       # REST controllers
├── dto
│   ├── request       # Request payloads (validated with Bean Validation)
│   └── response       # Response payloads
├── entity            # JPA entities
├── exception          # Custom exceptions + GlobalExceptionHandler
├── mapper              # Entity <-> DTO mapping
├── repository          # Spring Data JPA repositories
├── security             # JWT util/filter, UserDetails, CurrentUserProvider
└── service
    └── impl              # Service implementations
```

## 5. Database Design

Core tables: `users`, `authors`, `publishers`, `categories`, `books`, `book_copies`,
`borrow_transactions`, `reservations`, `system_settings`, `notifications`.

See [`database/schema.sql`](database/schema.sql) for the full DDL with primary keys, foreign
keys, unique constraints, and indexes. In development, Hibernate's `ddl-auto=update` creates
and updates these tables automatically from the JPA entities — you generally won't need to
run the SQL file by hand.

**Why Book and BookCopy are separate:** a `Book` is a catalog title ("Java Complete
Reference"); a `BookCopy` is one physical, borrowable unit of that title (e.g. `BK001`,
`BK002`). This mirrors how real libraries track inventory and lets each copy have its own
condition and status (`AVAILABLE`, `ISSUED`, `RESERVED`, `LOST`, `DAMAGED`).

## 6. Security (explained simply, for interviews)

1. Passwords are hashed with **BCrypt** before being stored — plaintext passwords are never
   saved.
2. On login, the server issues a **JWT** signed with HMAC-SHA256, containing the user's
   email and role, with an expiry.
3. The frontend stores this token and sends it as `Authorization: Bearer <token>` on every
   request.
4. `JwtAuthFilter` runs once per request: it reads and validates the token, then tells
   Spring Security "this request is authenticated as this user" — no server-side session
   needed (`SessionCreationPolicy.STATELESS`).
5. `@PreAuthorize("hasRole('ADMIN')")` (and similar) on controller methods enforces
   role-based access at the endpoint level, on top of the URL-pattern rules in
   `SecurityConfig`.
6. CSRF protection is disabled because we're a stateless, token-based API (not
   cookie/session-based), which is the standard approach for REST + JWT.

## 7. Getting Started

### Prerequisites
- JDK 17+
- Maven 3.8+ (or use the included `mvnw` if you generate a wrapper)
- MySQL 8 running locally
- Node.js 18+ and npm
- VS Code (or any editor)

### 7.1 Database setup

```sql
CREATE DATABASE bookbank_db;
```

You don't need to run `database/schema.sql` manually — Spring Boot creates/updates the
tables automatically on startup. It's provided as a reference and for manual/production setups.

### 7.2 Backend setup

```bash
cd backend
```

Set your local DB credentials as environment variables (recommended), or edit
`src/main/resources/application.properties` directly for local dev only:

```bash
export DB_USERNAME=root
export DB_PASSWORD=your_mysql_password
export JWT_SECRET=$(openssl rand -base64 32)
```

**Gmail SMTP (for Forgot Password OTP emails):** The app defaults to Gmail SMTP.
Set these environment variables with your Gmail App Password:

```bash
# 1. Enable 2-Step Verification on your Google account
# 2. Generate an App Password at https://myaccount.google.com/apppasswords
export MAIL_USERNAME=your_email@gmail.com
export MAIL_PASSWORD=your_gmail_app_password
```

Then run:

```bash
mvn spring-boot:run
```

The API starts on **http://localhost:8080**.

On first run, `DataSeeder` automatically creates:
- Default admin: `admin@bookbank.com` / `Admin@123` **(change this password after first login)**
- Starter categories (Programming, Database, AI, etc.)
- Default system settings (fine per day, borrow period, etc.)

### 7.3 Explore the API

Open **http://localhost:8080/swagger-ui.html** for interactive API docs. Click "Authorize"
and paste a JWT (obtained from `POST /api/auth/login`) to test protected endpoints.

### 7.4 Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL if needed
npm run dev
```

The app starts on **http://localhost:5173**.

## 8. Testing

Backend unit tests (JUnit 5 + Mockito) cover authentication and the core borrowing workflow
(including fine calculation). Run them with:

```bash
cd backend
mvn test
```

### Testing with Postman
1. `POST http://localhost:8080/api/auth/login` with `{ "email": "admin@bookbank.com", "password": "Admin@123" }`
2. Copy the `token` from the response.
3. For any protected endpoint, add header `Authorization: Bearer <token>`.
4. Or simply import the OpenAPI spec from `http://localhost:8080/api-docs` into Postman for
   a ready-made collection.

## 9. Key REST Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a student account |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/books?keyword=&page=&size=` | Search/browse books |
| POST | `/api/books` | Add a book (Admin/Librarian) |
| POST | `/api/book-copies` | Add a physical copy |
| POST | `/api/borrow-requests` | Student requests a book |
| PUT | `/api/borrow-requests/{id}/approve` | Approve a request |
| PUT | `/api/borrow-transactions/{id}/return` | Mark a book returned |
| GET | `/api/borrow-transactions/my-fines` | List the student's unpaid fines (Demo Pay available on the Student Dashboard) |
| POST | `/api/reservations` | Reserve an unavailable book |
| GET | `/api/dashboard/admin` | Admin dashboard stats |
| GET | `/api/dashboard/student` | Student dashboard stats |

Full documentation lives in Swagger UI once the backend is running.

## 10. Common Errors & Fixes

| Error | Likely Cause | Fix |
|---|---|---|
| `Communications link failure` | MySQL isn't running or wrong port | Start MySQL; check `DB_HOST`/`DB_PORT` |
| `Access denied for user` | Wrong DB credentials | Check `DB_USERNAME`/`DB_PASSWORD` |
| `401 Unauthorized` on a protected endpoint | Missing/expired JWT | Log in again, check the `Authorization` header |
| `403 Forbidden` | Logged in with the wrong role | Only Admin/Librarian can manage books, etc. |
| CORS error in browser console | Frontend origin not allowed | Confirm frontend runs on `localhost` and matches `CorsConfig` |
| `Table doesn't exist` | First run and `ddl-auto` misconfigured | Ensure `spring.jpa.hibernate.ddl-auto=update` |
| `503 Service Unavailable` on Forgot Password | SMTP credentials not configured or App Password invalid | Set `MAIL_USERNAME` and `MAIL_PASSWORD` env vars with a Gmail App Password; verify 2-Step Verification is on |

## 11. Future Improvements

- Book cover image upload (currently uses an image URL field)
- Fine payment integration (demo-only payment UI on the Student Dashboard; marks fine Paid for the session — no real payment gateway)
- Refresh tokens for longer sessions
- Docker Compose for one-command local setup

## 12. Screenshots

_Add screenshots of the Admin Dashboard, Book Search, and Borrow Requests pages here once
you've run the app locally._

## 13. License

This project is provided for personal portfolio/educational use.
