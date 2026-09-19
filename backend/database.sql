-- ==========================================================
-- PostgreSQL Database Schema for CampusConnect
-- Compatible with Supabase & Standard PostgreSQL
-- ==========================================================

-- Clean up existing tables if any
DROP TABLE IF EXISTS BOOKINGS CASCADE;
DROP TABLE IF EXISTS EVENTS CASCADE;
DROP TABLE IF EXISTS VENUES CASCADE;
DROP TABLE IF EXISTS DEPARTMENTS CASCADE;
DROP TABLE IF EXISTS ADMINS CASCADE;
DROP TABLE IF EXISTS USERS CASCADE;

-- 1. USERS Table
CREATE TABLE USERS (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- 2. ADMINS Table
CREATE TABLE ADMINS (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- 3. DEPARTMENTS Table
CREATE TABLE DEPARTMENTS (
    dept_id SERIAL PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL
);

-- 4. VENUES Table
CREATE TABLE VENUES (
    venue_id SERIAL PRIMARY KEY,
    venue_name VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    capacity INT NOT NULL
);

-- 5. EVENTS Table
CREATE TABLE EVENTS (
    event_id SERIAL PRIMARY KEY,
    event_name VARCHAR(150) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    venue_id INT NOT NULL REFERENCES VENUES(venue_id) ON DELETE CASCADE,
    dept_id INT NOT NULL REFERENCES DEPARTMENTS(dept_id) ON DELETE CASCADE
);

-- 6. BOOKINGS Table
CREATE TABLE BOOKINGS (
    booking_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES USERS(user_id) ON DELETE CASCADE,
    event_id INT NOT NULL REFERENCES EVENTS(event_id) ON DELETE CASCADE,
    seats_booked INT NOT NULL,
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL
);

-- ==========================================================
-- EXACT SAMPLE DATA INSERTION
-- ==========================================================

-- DEPARTMENTS (7)
INSERT INTO DEPARTMENTS (dept_id, dept_name) VALUES
(1, 'CSE'),
(2, 'ISE'),
(3, 'ECE'),
(4, 'EEE'),
(5, 'Mechanical'),
(6, 'Civil'),
(7, 'AI & ML');

-- Reset identity sequence for departments
SELECT setval(pg_get_serial_sequence('DEPARTMENTS', 'dept_id'), (SELECT MAX(dept_id) FROM DEPARTMENTS));

-- VENUES (5)
INSERT INTO VENUES (venue_id, venue_name, location, capacity) VALUES
(1, 'DES Seminar Hall 1', 'DES Block', 150),
(2, 'DES Seminar Hall 2', 'DES Block', 150),
(3, 'ESB Seminar Hall 1', 'ESB Block', 120),
(4, 'ESB Seminar Hall 2', 'ESB Block', 120),
(5, 'Apex Auditorium', 'Main Campus', 500);

-- Reset identity sequence for venues
SELECT setval(pg_get_serial_sequence('VENUES', 'venue_id'), (SELECT MAX(venue_id) FROM VENUES));

-- DEFAULT ADMIN (Username: admin, Password: admin123)
INSERT INTO ADMINS (admin_id, username, password) VALUES
(1, 'admin', '$2a$10$2du6W9NKWNEZAnRTxove/ePFhB6DIdBK.pcodAjReuJMp81sCoUOO');

SELECT setval(pg_get_serial_sequence('ADMINS', 'admin_id'), (SELECT MAX(admin_id) FROM ADMINS));

-- SAMPLE USERS (Password: 1234 for sagnik)
INSERT INTO USERS (user_id, name, email, password) VALUES
(1, 'Sagnik', 'sagnik@email.com', '$2a$10$tZt6lXN3s8gA/xRkm9bXqu3s8vJz6h3KzL2C9Zp3J8lq7z2f1m6eS'),
(2, 'Rahul Sharma', 'rahul@gmail.com', '$2a$10$tZt6lXN3s8gA/xRkm9bXqu3s8vJz6h3KzL2C9Zp3J8lq7z2f1m6eS'),
(3, 'Ananya Rao', 'ananya@gmail.com', '$2a$10$tZt6lXN3s8gA/xRkm9bXqu3s8vJz6h3KzL2C9Zp3J8lq7z2f1m6eS'),
(4, 'Kiran Patel', 'kiran@gmail.com', '$2a$10$tZt6lXN3s8gA/xRkm9bXqu3s8vJz6h3KzL2C9Zp3J8lq7z2f1m6eS'),
(5, 'Megha N', 'megha@gmail.com', '$2a$10$tZt6lXN3s8gA/xRkm9bXqu3s8vJz6h3KzL2C9Zp3J8lq7z2f1m6eS'),
(6, 'Arjun Reddy', 'arjun@gmail.com', '$2a$10$tZt6lXN3s8gA/xRkm9bXqu3s8vJz6h3KzL2C9Zp3J8lq7z2f1m6eS');

SELECT setval(pg_get_serial_sequence('USERS', 'user_id'), (SELECT MAX(user_id) FROM USERS));

-- EVENTS (15)
INSERT INTO EVENTS (event_id, event_name, event_date, event_time, total_seats, available_seats, dept_id, venue_id) VALUES
(1, 'IEEE Student Branch Orientation', '2026-06-15', '10:00:00', 150, 147, 3, 1),
(2, 'Introduction to Competitive Programming', '2026-06-18', '02:00:00', 120, 120, 1, 3),
(3, 'AI & Machine Learning Workshop', '2026-06-22', '09:30:00', 120, 117, 7, 4),
(4, 'Cyber Security Awareness Seminar', '2026-06-25', '11:00:00', 150, 150, 1, 2),
(5, 'Robotics and Automation Expo', '2026-06-28', '10:00:00', 300, 296, 3, 5),
(6, 'Google Developer Student Clubs Orientation', '2026-07-02', '02:00:00', 150, 150, 1, 1),
(7, 'Placement Readiness Program', '2026-07-05', '09:00:00', 250, 248, 1, 5),
(8, 'Startup and Entrepreneurship Meetup', '2026-07-08', '01:30:00', 120, 120, 2, 2),
(9, 'Circuit Design Workshop', '2026-07-12', '10:00:00', 100, 100, 4, 3),
(10, 'Civil Engineering Innovations Seminar', '2026-07-15', '11:00:00', 120, 120, 6, 4),
(11, 'EV Technology and Future Mobility Talk', '2026-07-18', '02:00:00', 120, 120, 5, 2),
(12, 'Data Science Bootcamp', '2026-07-20', '09:30:00', 150, 150, 7, 1),
(13, 'Women in Engineering Session', '2026-07-22', '11:00:00', 120, 120, 3, 3),
(14, 'Cloud Computing Workshop', '2026-07-25', '10:00:00', 120, 120, 4, 4),
(15, 'Annual Technical Fest Inauguration', '2026-08-01', '09:00:00', 500, 500, 1, 5);

SELECT setval(pg_get_serial_sequence('EVENTS', 'event_id'), (SELECT MAX(event_id) FROM EVENTS));

-- INITIAL BOOKINGS
INSERT INTO BOOKINGS (booking_id, user_id, event_id, seats_booked, booking_date, event_date, event_time) VALUES
(1, 1, 1, 2, CURRENT_DATE, '2026-06-15', '10:00:00'),
(2, 2, 3, 3, CURRENT_DATE, '2026-06-22', '09:30:00'),
(3, 3, 5, 4, CURRENT_DATE, '2026-06-28', '10:00:00'),
(4, 4, 1, 1, CURRENT_DATE, '2026-06-15', '10:00:00'),
(5, 5, 7, 2, CURRENT_DATE, '2026-07-05', '09:00:00');

SELECT setval(pg_get_serial_sequence('BOOKINGS', 'booking_id'), (SELECT MAX(booking_id) FROM BOOKINGS));
