import pool from '../config/db.js';
// GET /api/upcoming-sessions
export async function upcomingSessions(req, res) {
    
    // WAY simpler than relying on external fetch & parameterization from frontend
    const user_id = req.session?.user?.id;

    if (!user_id) {
        return res.status(401).json({success: false, error: "Can't load upcoming sessions, user not logged in or missing id."});
    }

    const role = req.session?.user?.role;
    // individualize for tutor vs student
    // If role initialized in session object, use specific column, else use OR to capture all possibilities
    const whereClause = role === "tutor" ? "b.tutor_id = ?" : // role is tutor, use bookings_tutor_id
                        role === "student" ? "b.student_id = ?" // role is student, use bookings.student_id
                        : "(b.student_id = ? OR b.tutor_id = ?)";

    const params = role ? [user_id] : [user_id, user_id];

    try {
        const [rows] = await pool.query(
            `SELECT 
              b.booking_id,
              b.student_id,
              b.tutor_id,
              s.full_name AS student_name,
              ts.id AS session_id,
              ts.tutor_name,
              ts.session_date,
              ts.time_slot,
              ts.subjects,
              ts.mode
            FROM bookings b
            JOIN tutoring_sessions ts 
                ON ts.id = b.session_id
            JOIN students s 
              ON s.id = b.student_id
            WHERE ${whereClause}
              AND b.status = 'confirmed'
              AND (
                ts.session_date > CURDATE()
                OR (ts.session_date = CURDATE() AND ts.time_slot >= CURTIME())
              )
                
            ORDER BY ts.session_date ASC, ts.time_slot ASC`,
            params
        );

        res.json({success: true, upcoming: rows});
    } catch (err) {
        console.error("Error fetching upcoming sessions:", err);
        res.status(500).json({success: false, error: err.message});
    }
}

// GET /profile
// Links to the students table in db14
export async function getProfile(req, res) {
    const user_id = req.session?.user?.id;

    if (!user_id) {
        return res.status(401).json({
            success: false,
            error: "Can't load profile, missing user id."
        });
    }

    try {
        const [rows] = await pool.query(
            `SELECT id,
                    student_id,
                    full_name,
                    email,
                    grade_level,
                    major,
                    preferred_subjects,
                    learning_goals,
                    sfsu_college,
                    gpa
             FROM students
             WHERE id = ?`,
            [user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found.'
            });
        }

        res.json({ success: true, message: "Profile located" , profile: rows[0] });
    } catch (err) {
        console.error('Error fetching student profile:', err);
        res.status(500).json({ success: false, error: err.message });
    }
}

// PUT /profile
export async function updateProfile(req, res) {
    const user_id = req.session?.user?.id;

    if (!user_id) {
        return res.status(401).json({
            success: false,
            error: "Can't update profile, missing session id."
        });
    }

    // Fields students are allowed to update
    const updatableFields = [
        'full_name',
        'email',
        'grade_level',
        'major',
        'preferred_subjects',
        'learning_goals',
        'gpa'
    ];

    const updates = [];
    const values = [];

    updatableFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
            updates.push(`${field} = ?`);
            values.push(req.body[field]);
        }
    });

    if (updates.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'No valid fields provided to update.'
        });
    }

    try {
        // Run UPDATE
        const [result] = await pool.query(
            `UPDATE students
            SET ${updates.join(', ')}
            WHERE id = ?`,
            [...values, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found or nothing changed.'
            });
        }

        // Fetch updated profile to return
        const [rows] = await pool.query(
            `SELECT id,
                    student_id,
                    full_name,
                    email,
                    grade_level,
                    major,
                    preferred_subjects,
                    learning_goals,
                    sfsu_college,
                    gpa
             FROM students
             WHERE id = ?`,
            [user_id]
        );

        if (rows.length > 0) {
            res.json({ success: true, message: 'Profile updated successfully.', profile: rows[0] });
        } else {
            res.json({ success: false, message: 'Profile not found' });
        }
    } catch (err) {
        console.error('Error updating student profile:', err);
        res.status(500).json({ success: false, error: err.message });
    }
}
