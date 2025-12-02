import pool from '../config/db.js';
import bcrypt from 'bcrypt'; // for addUser
import { resend } from '../utils/mailer.js';

export async function emailOTP(req, res) {

    // outside of try/catch so error thrown is more accurate
    const { email } = req.query;
    // Input Validation. Not sure if it's still called input if we're all the way back here but yeah haha
    if (!email) return res.status(400).json({ success: false, error: "Email required" });

    try {
        // the long awaited One Time Password! It's just a random 4 digit number at the end of the day
        const otp = String(Math.floor(1000 + Math.random() * 9000));

        // MANUALLY set expiration +10 min - it's best not to rely on a function in DEFAULT
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

        // Insert  EMAIL | OTP | EXPIRATION combo into DB for later verification
        await pool.query(
            `INSERT INTO one_time_passcodes (email, passcode, expires_at)
            VALUES (?, ?, ?)`,
            [email, otp, expiresAt]
        );

        // Send email using Resend
        const info = await resend.emails.send({
            from: "GatorTutor <onboarding@resend.dev>", 
            to: email,
            subject: "Your GatorTutor Verification Code",
            html: `
                <p>Welcome to <strong>GatorTutor</strong>!</p>
                <p>Your verification code is:</p>
                <h2>${otp}</h2>
                <p>This code expires in 10 minutes.</p>
            `
        });

        // debug to check resend API response
        console.log("Resend response:", info);

        return res.json({ success: true, message: "OTP sent!" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Failed to send OTP" });
    }
}

// When user enters their unique 4-digit OTP, we check against the entry in DB
// This HTTP request will originate from emailVerification.html, not sign up like the prior endpoint. 
export async function verifyOTP(req, res) {
    const { email, otp } = req.body;

    // input validation again
    if (!email || !otp) {
        return res.status(400).json({ success: false, error: "Email and OTP required" });
    }

    try {
        // search for most recent VALID one-time-passcode matching user email
        const [rows] = await pool.query(
            `SELECT * FROM one_time_passcodes
            WHERE email = ? AND passcode = ?
            AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1`,
            [email, otp]
        );

        // no OTP found or only invalid (expired) OTP
        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: "Invalid or expired OTP" });
        }
        // return status so front end can proceed with user flow
        return res.json({ success: true });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "OTP verification error" });
    }
}


export async function addUser(req, res){
    try {
        // Extract sessionStorage student info from HTTP request
        const { fullName, email, password } = req.body;

        // Simple double check pre-account creation, one part of name allowed to be null
        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        // Hash password using fan-favorite: bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into our users table, 
        // (just like bookings table process in bookingController!)
        const [result] = await pool.query(
            `INSERT INTO students 
            (full_name, email, password_hash)
            VALUES (?, ?, ?)`,
            [
            fullName,
            email,
            hashedPassword
            ]
        );

        // Respond with success!!!
        return res.status(200).json({
            success: true,
            message: "User created!",
            user_id: result.insertId
        });

    } catch (err) {
        console.error("addUser error from authController.js: ", err);

        // Handle duplicate email
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                error: "Account already exists with email"
            });
        }

        return res.status(500).json({
            success: false,
            error: "Miscellaneous server error creating user"
        });
    }
}

// Login controller to:
// 1. verify credentials 
// 2. initiate session & state tracking on server
export async function login(req, res) {

    // Extract login credentials from request body
    const { email, password } = req.body;

    // Input Validation (we need something to lookup & compare)
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: "Email and password required"
        });
    }

    try {
        // STEP 1: Select student entry with matching email ('limit' is redundant since we enforce uniqueness)
        const [rows] = await pool.query(
            "SELECT * FROM students WHERE email = ? LIMIT 1",
            [email]
        );

        // Respond with failure status if no match found
        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: "Invalid email or password"
            });
        }

        // Extract the lone entry row
        const student = rows[0];

        // STEP 2: Compare login password to hashed password from selected entry
        const passwordMatches = await bcrypt.compare(password, student.password_hash);

        // (respond with failure if passwords don't match)
        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                error: "Invalid email or password"
            });
        }

        // STEP 3: Check if student is also a tutor (to enable tutor privileges)
        const [tutorRows] = await pool.query(
            "SELECT * FROM tutors WHERE tutor_id = ? LIMIT 1",
            [student.id] // select matching tutor entry via mutual ID
        );
        const isTutor = tutorRows.length > 0;

        // STEP 4: Create server-side session object for this user
        req.session.user = {
            id: student.id,
            email: student.email,
            fullName: student.full_name,
            role: isTutor ? "tutor" : "student"
        };

        // STEP 5: Persist session to MySQL session store in DB
        req.session.save(err => {
            // Respond with failure if session cannot be saved
            if (err) {
                console.error("Session save failed:", err);
                return res.status(500).json({
                    success: false,
                    error: "Session save failed"
                });
            }

            // If session saved, respond with success!
            return res.json({
                success: true,
                message: "Login successful",
                user: req.session.user
            });
        });

    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({
            success: false,
            error: "Server error during login"
        });
    }
}