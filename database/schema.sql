-- =====================================================================
-- Smart Book Bank Management System - Database Schema
-- MySQL 8.x
--
-- NOTE: In development, Spring Boot (spring.jpa.hibernate.ddl-auto=update)
-- will create/update these tables automatically from the JPA entities.
-- This file is provided so you have a reference schema, can inspect the
-- design without running the app, and can use it for manual setup or
-- production deployments where auto-DDL is turned off.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS bookbank_db
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE bookbank_db;

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(100)  NOT NULL,
    email             VARCHAR(150)  NOT NULL,
    password          VARCHAR(255)  NOT NULL,
    phone             VARCHAR(15),
    department        VARCHAR(100),
    year              VARCHAR(20),
    register_number   VARCHAR(50),
    role              VARCHAR(20)   NOT NULL,          -- ADMIN, LIBRARIAN, STUDENT
    active            BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_email UNIQUE (email),
    CONSTRAINT uk_user_register_number UNIQUE (register_number)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- AUTHORS / PUBLISHERS / CATEGORIES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS authors (
    id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    name  VARCHAR(150) NOT NULL,
    bio   VARCHAR(1000)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS publishers (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(150) NOT NULL,
    website  VARCHAR(150)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    description  VARCHAR(500),
    CONSTRAINT uk_category_name UNIQUE (name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- BOOKS (catalog entries, NOT physical copies)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    isbn               VARCHAR(20)   NOT NULL,
    title              VARCHAR(255)  NOT NULL,
    description        VARCHAR(2000),
    author_id          BIGINT        NOT NULL,
    publisher_id       BIGINT        NOT NULL,
    category_id        BIGINT        NOT NULL,
    language           VARCHAR(50),
    edition            VARCHAR(50),
    publication_year   INT,
    total_copies       INT           NOT NULL DEFAULT 0,
    available_copies   INT           NOT NULL DEFAULT 0,
    image_url          VARCHAR(500),
    is_deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_book_isbn UNIQUE (isbn),
    CONSTRAINT fk_book_author     FOREIGN KEY (author_id)     REFERENCES authors(id),
    CONSTRAINT fk_book_publisher  FOREIGN KEY (publisher_id)  REFERENCES publishers(id),
    CONSTRAINT fk_book_category   FOREIGN KEY (category_id)   REFERENCES categories(id)
) ENGINE=InnoDB;

CREATE INDEX idx_book_title ON books(title);
CREATE INDEX idx_book_isbn  ON books(isbn);

-- ---------------------------------------------------------------------
-- BOOK COPIES (physical, borrowable units of a Book)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS book_copies (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id        BIGINT       NOT NULL,
    copy_code      VARCHAR(30)  NOT NULL,   -- e.g. BK001
    status         VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, ISSUED, RESERVED, LOST, DAMAGED
    `condition`    VARCHAR(30),
    purchase_date  DATE,
    CONSTRAINT uk_copy_code UNIQUE (copy_code),
    CONSTRAINT fk_copy_book FOREIGN KEY (book_id) REFERENCES books(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- BORROW TRANSACTIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS borrow_transactions (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT         NOT NULL,
    book_copy_id  BIGINT         NOT NULL,
    request_date  DATETIME       NOT NULL,
    issue_date    DATETIME,
    due_date      DATE,
    return_date   DATETIME,
    status        VARCHAR(20)    NOT NULL DEFAULT 'REQUESTED', -- REQUESTED, APPROVED, REJECTED, ISSUED, RETURNED, OVERDUE
    fine_amount   DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    fine_paid     BOOLEAN        NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_borrow_user      FOREIGN KEY (user_id)      REFERENCES users(id),
    CONSTRAINT fk_borrow_bookcopy  FOREIGN KEY (book_copy_id) REFERENCES book_copies(id)
) ENGINE=InnoDB;

CREATE INDEX idx_borrow_status ON borrow_transactions(status);
CREATE INDEX idx_borrow_user   ON borrow_transactions(user_id);

-- ---------------------------------------------------------------------
-- RESERVATIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id            BIGINT      NOT NULL,
    book_id            BIGINT      NOT NULL,
    reservation_date   DATETIME    NOT NULL,
    expiry_date        DATETIME,
    status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, FULFILLED, CANCELLED, EXPIRED
    CONSTRAINT fk_reservation_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_reservation_book FOREIGN KEY (book_id) REFERENCES books(id)
) ENGINE=InnoDB;

CREATE INDEX idx_reservation_status ON reservations(status);

-- ---------------------------------------------------------------------
-- SYSTEM SETTINGS (configurable business rules)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key    VARCHAR(100) PRIMARY KEY,
    setting_value  VARCHAR(255) NOT NULL,
    description    VARCHAR(255)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    message     VARCHAR(255) NOT NULL,
    is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- SEED DATA (also auto-created by DataSeeder.java on first app startup)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO categories (name, description) VALUES
    ('Programming', 'Programming languages and software engineering'),
    ('Database', 'Database systems and design'),
    ('Networking', 'Computer networks and protocols'),
    ('Artificial Intelligence', 'AI, ML, and related fields'),
    ('Data Science', 'Data analysis and data science'),
    ('Web Development', 'Frontend and backend web technologies'),
    ('Electronics', 'Electronics and embedded systems'),
    ('Mathematics', 'Mathematics for computer science'),
    ('General', 'General / miscellaneous titles');

INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
    ('BORROW_PERIOD_DAYS', '14', 'Number of days a book can be borrowed before it is due'),
    ('FINE_PER_DAY', '5', 'Fine charged (in rupees) per day overdue'),
    ('RESERVATION_EXPIRY_DAYS', '3', 'Days a reservation stays active once a copy becomes available'),
    ('MAX_BOOKS_PER_STUDENT', '3', 'Maximum number of books a student can borrow at once');

-- Default admin account (email: admin@bookbank.com / password: Admin@123)
-- Password hash below is BCrypt for 'Admin@123'. This row is also
-- auto-created by DataSeeder.java on first application startup, so you
-- generally do not need to run this manually.
-- INSERT IGNORE INTO users (name, email, password, role, active)
-- VALUES ('System Administrator', 'admin@bookbank.com',
--         '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5L3F6BUvVe5b0zC4c.qKM9K3g9v1G', 'ADMIN', TRUE);
