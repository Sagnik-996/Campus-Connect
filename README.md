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

## 📁 Repository Structure

```text
CampusConnect/
├── frontend/                       # Client web interface
│   ├── index.html                  # Landing Page
│   ├── register.html               # Student Registration
│   ├── login.html                  # Student Login
│   ├── admin-login.html            # Admin Access Console
│   ├── events.html                 # Student Event Browser
│   ├── event-details.html          # Seat Booking Page
│   ├── my-bookings.html            # Student Reservation Tickets
│   ├── profile.html                # Student Profile Management
│   ├── admin-dashboard.html        # Administrative Dashboard
│   ├── add-event.html              # Event Creation / Editor
│   ├── manage-events.html          # Event List Manager
│   ├── manage-venues.html          # Venue CRUD Panel
│   ├── manage-departments.html     # Department CRUD Panel
│   ├── manage-users.html           # Registered Student Accounts List
│   ├── bookings.html               # Global Reservations Auditor
│   ├── css/
│   │   └── style.css               # Unified Glassmorphism Theme (Dark/Light)
│   └── js/
│       └── script.js               # Client AJAX Controller & Route Guards
│
├── backend/
│   ├── database.sql                # Complete PostgreSQL / Supabase Schema & Seeds
│   ├── package.json                # Node dependencies
│   ├── server.js                   # Express application entry point
│   ├── .env                        # Local environment configuration
│   ├── scripts/
│   │   └── initDb.js               # Automated database initialization script
│   ├── models/
│   │   └── db.js                   # pg.Pool with SSL connection
│   ├── authentication/
│   │   └── auth.js                 # Password hashing & verification
│   ├── middleware/
│   │   └── authMiddleware.js       # Session verification & RBAC
│   ├── controllers/                # Business logic controllers
│   └── routes/                     # Express REST routes
│
├── .gitignore
└── README.md
```

---

## 🗄️ Setting Up Supabase Database

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and open your project.
2. In the left navigation, click on **SQL Editor**.
3. Click **New Query**, copy the entire contents of [`backend/database.sql`](backend/database.sql), and paste it into the editor.
4. Click **Run**.
5. All tables (`USERS`, `ADMINS`, `DEPARTMENTS`, `VENUES`, `EVENTS`, `BOOKINGS`) will be created and seeded with:
   - **7 Departments**: CSE, ISE, ECE, EEE, Mechanical, Civil, AI & ML
   - **5 Venues**: DES Seminar Halls 1 & 2, ESB Seminar Halls 1 & 2, Apex Auditorium
   - **15 Events**: With exact dates, times, and seat allocations
   - **Default Admin Account**: Username: `admin`, Password: `admin123`
   - **Sample Student Accounts**: E.g. `sagnik@email.com` / `1234`

---

## 🚀 Deploying to Render

1. Connect your **GitHub** repository (`CampusConnect`) to **Render**.
2. Create a **New Web Service**:
   - **Root Directory**: `backend` (or leave empty if using root `npm start` with build command `cd backend && npm install`)
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
3. In **Environment Variables**, add:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string URI (e.g. `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`)
   - `SESSION_SECRET`: Any random secure string (e.g. `super_secret_campus_key_12345`)
   - `NODE_ENV`: `production`
4. Click **Deploy Web Service**!

---

## 💻 Local Development

1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```
2. Set your `DATABASE_URL` in `backend/.env`.
3. Run the database seed script:
   ```bash
   npm run init-db
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open your browser at [http://localhost:3000](http://localhost:3000).

---

## 🔑 Default Credentials

- **Admin Account**:
  - Username: `admin`
  - Password: `admin123`
- **Student User Account**:
  - Email: `sagnik@email.com`
  - Password: `1234`
