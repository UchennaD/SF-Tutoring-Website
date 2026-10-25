# Gator Tutors

A full-stack tutoring platform for San Francisco State University students. Students can search for tutors by subject, book and cancel sessions, and message tutors directly. Tutors can manage their availability, view upcoming sessions, and share notes from a personal dashboard.

## Features

- **Tutor search**: browse and filter tutors by subject and course
- **Session booking**: book and cancel tutoring sessions, with confirmation pages
- **Accounts and authentication**: separate student and tutor sign-up, email verification with one-time passcodes, hashed passwords (bcrypt), and server-side sessions stored in MySQL
- **Dashboards**: personalized student and tutor dashboards showing upcoming sessions and profile details
- **Tutor availability**: tutors add and remove open time slots that students can book
- **Messaging**: one-to-one conversations between students and tutors

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| Database | MySQL (SQL) on AWS RDS |
| Hosting | AWS EC2 (Ubuntu), Nginx reverse proxy, PM2 process manager |
| Email | Resend API (verification codes) |
| Auth | bcrypt, express-session, express-mysql-session |

## Architecture

```
Browser (HTML/CSS/JS)
        │
        ▼
Nginx on AWS EC2  ──►  Express API (Node.js, managed by PM2)
                              │
                              ▼
                       MySQL on AWS RDS
```

The Express server serves the static frontend from `application/public/` and exposes a REST API under `/api`:

| Route group | Purpose |
|---|---|
| `/api/auth` | Sign-up, email OTP verification, login, logout, session check |
| `/api/search` | Tutor search |
| `/api/book` | Book and cancel sessions |
| `/api/dashboard`, `/api/upcoming-sessions`, `/api/profile` | Dashboard and profile data |
| `/api/tutor/availability` | Tutor availability management |
| `/api/convos` | Conversations and messages |

## Project Structure

```
application/
├── server.js          # Express app, sessions, route mounting
├── config/db.js       # MySQL connection pool
├── controllers/       # Request handling and SQL queries
├── routes/            # API route definitions
├── middleware/        # Auth middleware
├── utils/mailer.js    # Resend email client
└── public/            # Frontend pages, styles, scripts, assets
Milestones/            # Course milestone documents (M1–M5)
```

## Running Locally

**Prerequisites:** Node.js (see `.nvmrc`) and a MySQL database.

```bash
cd application
npm install
```

Create `application/.env` with your own values:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
SESSION_SECRET=any_long_random_string
RESEND_API_KEY=your_resend_api_key
PORT=3000
```

Then start the server:

```bash
npm start
```

The app runs at `http://localhost:3000`.
