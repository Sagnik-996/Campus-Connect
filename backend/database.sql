-- MySQL Database Schema for College Event Booking System
CREATE DATABASE IF NOT EXISTS event_booking;
USE event_booking;

-- Disable foreign key checks to drop tables cleanly
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS BOOKINGS;
DROP TABLE IF EXISTS EVENTS;
DROP TABLE IF EXISTS VENUES;
DROP TABLE IF EXISTS DEPARTMENTS;
DROP TABLE IF EXISTS ADMINS;
DROP TABLE IF EXISTS USERS;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS Table
CREATE TABLE USERS (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- 2. ADMINS Table
CREATE TABLE ADMINS (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- 3. DEPARTMENTS Table
CREATE TABLE DEPARTMENTS (
    dept_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL
);

-- 4. VENUES Table
CREATE TABLE VENUES (
    venue_id INT AUTO_INCREMENT PRIMARY KEY,
    venue_name VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    capacity INT NOT NULL
);

-- 5. EVENTS Table
CREATE TABLE EVENTS (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(150) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    venue_id INT NOT NULL,
    dept_id INT NOT NULL,
    CONSTRAINT fk_event_venue FOREIGN KEY (venue_id) REFERENCES VENUES(venue_id) ON DELETE CASCADE,
    CONSTRAINT fk_event_dept FOREIGN KEY (dept_id) REFERENCES DEPARTMENTS(dept_id) ON DELETE CASCADE
);

-- 6. BOOKINGS Table
CREATE TABLE BOOKINGS (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    seats_booked INT NOT NULL,
    booking_date DATE NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_event FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE CASCADE
);

-- Insert exact DEPARTMENTS
INSERT INTO DEPARTMENTS (dept_id, dept_name) VALUES
(1, 'CSE'),
(2, 'ISE'),
(3, 'ECE'),
(4, 'EEE'),
(5, 'Mechanical'),
(6, 'Civil'),
(7, 'AI & ML');

-- Insert exact VENUES
INSERT INTO VENUES (venue_id, venue_name, location, capacity) VALUES
(1, 'DES Seminar Hall 1', 'DES Block', 150),
(2, 'DES Seminar Hall 2', 'DES Block', 150),
(3, 'ESB Seminar Hall 1', 'ESB Block', 120),
(4, 'ESB Seminar Hall 2', 'ESB Block', 120),
(5, 'Apex Auditorium', 'Main Campus', 500);

-- Insert exact EVENTS (All initialized with available_seats = total_seats)
INSERT INTO EVENTS (event_id, event_name, event_date, event_time, total_seats, available_seats, dept_id, venue_id) VALUES
(1, 'IEEE Student Branch Orientation', '2026-06-15', '10:00:00', 150, 150, 3, 1),
(2, 'Introduction to Competitive Programming', '2026-06-18', '02:00:00', 120, 120, 1, 3),
(3, 'AI & Machine Learning Workshop', '2026-06-22', '09:30:00', 120, 120, 7, 4),
(4, 'Cyber Security Awareness Seminar', '2026-06-25', '11:00:00', 150, 150, 1, 2),
(5, 'Robotics and Automation Expo', '2026-06-28', '10:00:00', 300, 300, 3, 5),
(6, 'Google Developer Student Clubs Orientation', '2026-07-02', '02:00:00', 150, 150, 1, 1),
(7, 'Placement Readiness Program', '2026-07-05', '09:00:00', 250, 250, 1, 5),
(8, 'Startup and Entrepreneurship Meetup', '2026-07-08', '01:30:00', 120, 120, 2, 2),
(9, 'Circuit Design Workshop', '2026-07-12', '10:00:00', 100, 100, 4, 3),
(10, 'Civil Engineering Innovations Seminar', '2026-07-15', '11:00:00', 120, 120, 6, 4),
(11, 'EV Technology and Future Mobility Talk', '2026-07-18', '02:00:00', 120, 120, 5, 2),
(12, 'Data Science Bootcamp', '2026-07-20', '09:30:00', 150, 150, 7, 1),
(13, 'Women in Engineering Session', '2026-07-22', '11:00:00', 120, 120, 3, 3),
(14, 'Cloud Computing Workshop', '2026-07-25', '10:00:00', 120, 120, 4, 4),
(15, 'Annual Technical Fest Inauguration', '2026-08-01', '09:00:00', 500, 500, 1, 5);

-- Insert exact DEFAULT ADMIN ACCOUNT (using bcrypt hash for password 'admin123')
INSERT INTO ADMINS (admin_id, username, password) VALUES
(1, 'admin', '$2a$10$2du6W9NKWNEZAnRTxove/ePFhB6DIdBK.pcodAjReuJMp81sCoUOO');
