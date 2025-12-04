import pool from '../config/db.js';

export async function upcomingSessions(req, res) {
    const {student_id} = req.params;

    if (!student_id) {
        return res.status(400).json({success: false, error: "Can't load upcoming sessions, missing student_id."});
    }

    try {
        const [rows] = await pool.query(
            `SELECT bookings.booking_id,
                    tutoring_sessions.session_date,
                    tutoring_sessions.subjects,
                    tutoring_sessions.tutor_name
            FROM bookings
            JOIN tutoring_sessions ON bookings.tutor_id = tutoring_sessions.tutor_id
            JOIN tutors ON bookings.tutor_id = tutors.tutor_id
            WHERE bookings.student_id = ?
                AND bookings.status = 'confirmed'
            ORDER BY tutoring_sessions.session_date ASC`
            [student_id]
        );

        res.json({success: true, upcoming: rows});
    } catch (err) {
        console.error("Error fetching upcoming sessions:", err);
        res.status(500).json({sucess: false, error: err.message});
    }
}