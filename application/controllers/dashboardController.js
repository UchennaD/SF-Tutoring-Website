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

// GET /students/:student_id/profile
export async function getStudentProfile(req, res) {
    const { student_id } = req.params;

    if (!student_id) {
        return res.status(400).json({
            success: false,
            error: "Can't load profile, missing student_id."
        });
    }

    try {
        const [rows] = await pool.query(
            `SELECT student_id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    grade_level,
                    bio
             FROM students
             WHERE student_id = ?`,
            [student_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found.'
            });
        }

        res.json({ success: true, profile: rows[0] });
    } catch (err) {
        console.error('Error fetching student profile:', err);
        res.status(500).json({ success: false, error: err.message });
    }
}

// PUT /students/:student_id/profile
export async function updateStudentProfile(req, res) {
    const { student_id } = req.params;

    if (!student_id) {
        return res.status(400).json({
            success: false,
            error: "Can't update profile, missing student_id."
        });
    }

    // Fields students are allowed to update
    const updatableFields = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'grade_level',
        'bio'
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
             WHERE student_id = ?`,
            [...values, student_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found or nothing changed.'
            });
        }

        // Fetch updated profile to return
        const [rows] = await pool.query(
            `SELECT student_id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    grade_level,
                    bio
             FROM students
             WHERE student_id = ?`,
            [student_id]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully.',
            profile: rows[0]
        });
    } catch (err) {
        console.error('Error updating student profile:', err);
        res.status(500).json({ success: false, error: err.message });
    }
}

import express from 'express';
import {
  upcomingSessions,
  getStudentProfile,
  updateStudentProfile
} from '../controllers/studentController.js';

const router = express.Router();

router.get('/students/:student_id/upcoming-sessions', upcomingSessions);
router.get('/students/:student_id/profile', getStudentProfile);
router.put('/students/:student_id/profile', updateStudentProfile);

export default router;
