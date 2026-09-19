# CampusConnect - College Event Booking System

CampusConnect is a complete College Event Booking System built with **Node.js/Express**, **PostgreSQL**, **Supabase**, and a modern responsive **HTML5/Vanilla CSS/JavaScript** frontend with glassmorphism design and dark/light mode.

---

## 🌟 Features

- **Role-Based Access Control (RBAC)**:
  - **Public**: Home, Browse Events, Student Registration, Student Login, Admin Console Login.
  - **Student**: View Events, Search by Name/Department/Venue, Real-time Seat Tracking, Book Tickets, View Bookings, Cancel Bookings, Profile Management.
  - **Admin**: Dashboard with Metrics, Add/Edit/Delete Events, Venue Management, Department Management, View Registered Users, Audit All Bookings with Cancellation.
- **Seat Capacity & Integrity**:
  - Atomic transactions prevent overbooking and negative seat counts.
  - Automatic seat reduction upon booking and automatic seat restoration upon cancellation.
  - Duplicate booking prevention for the same event by the same user.
- **Cloud Database (Supabase PostgreSQL)**:
  - Fully compatible with Supabase's hosted PostgreSQL.
  - Connection pooling with SSL support.

---



## 🔑 Default Credentials

- **Admin Account**:
  - Username: `admin`
  - Password: `admin123`
