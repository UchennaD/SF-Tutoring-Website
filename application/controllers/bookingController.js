// db.js already sets up pool using env values
import pool from '../config/db.js';

export async function bookSession(req, res) {

    // Get identifying session details 

    const { tutor_id, session_id } = req.body;

    // Ensure legit session details
    if ( !tutor_id || !session_id) {
        return res
            .status(400)
            .json({ success: false, error: "Missing required fields." });
    }

    // User must be logged in to book, so we can access student.id through req.user.id or session
    const student_id = req.user.id; // we know req.user has just been initialized by authMiddleware (so we can use it)

    try {
        const [result] = await pool.query(
            `INSERT INTO bookings (student_id, tutor_id, session_id)
             VALUES (?, ?, ?)`,
            [student_id, tutor_id, session_id]
        );
        // remove session from results page (by marking 'booked' boolean as true)
        await pool.query(
            `UPDATE tutoring_sessions 
            SET is_booked = 1 
            WHERE id = ?`,
            [session_id]
        );

        res.json({ success: true, booking_id: result.insertId });

    } catch (err) {
        console.error("Error during booking:", err);
        res.status(500).json({ success: false, error: err.message });
    }
}