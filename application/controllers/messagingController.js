import pool from "../config/db.js"; 

export async function createConvo(req, res) {

    // get id of individual whom current user wishes to communicate with
    const { receiverId } = req.body;

    // Ensure user IDs received
    if (!req.session.user || !receiverId){
        return res.status(401).json({
            success: false, error: "Missing either recipient ID or user ID."
        })
    }
    // Make sure user can't message themselves somehow:
    if (req.session.user.id == receiverId){
        return res.status(403).json({
            success: false, error: "Illegal operation - recipient must not be yourself."
        })
    }

    // figure out if user is a student/tutor. 
    const isStudent = req.session.user.role === "student";

    // assign correct value so it can be paramaterized into the sql query
    const studentId  = isStudent ? req.session.user.id : receiverId;
    const tutorId    = isStudent ? receiverId : req.session.user.id;

    try {  
        // Check for duplicates before inserting
        const [duplicates] = await pool.query(`
            SELECT * 
            FROM conversations
            WHERE student_id = ? AND tutor_id = ?`, 
            [studentId, tutorId]
        );
        // Exit if query finds a match
        if (duplicates.length > 0) { 
            return res.status(409).json({ 
                success: false, 
                error: "Duplicate entry – conversation already exists.",
                convo_id: duplicates[0].convo_id
            });
        } 

        // insert in 'conversations' table
        const [result] = await pool.query(`
            INSERT INTO conversations (student_id, tutor_id)
            VALUES (?, ?)`, 
            [studentId, tutorId]
        );

        res.json({ success: true, convo_id: result.insertId });
    } catch (err) {
        console.error("Error during convo creation:", err);
        res.status(500).json({ success: false, error: 'Internal server error', details: err.message });
    }
}

export async function getConvos(req, res) {
    // Get session user, store in variable so it can be referenced in response json
    const user = req.session?.user;
    const user_id = user?.id;
    
    if (!user_id) {
        return res.status(401).json({
            success: false,
            error: "User not logged in ⇢ no conversations available."
        });
    }

    try {
        // Get as much info as possible to give frontend options to display
        const [rows] = await pool.query(
            `SELECT
                c.*,
                s.full_name  AS student_name,
                ts.full_name AS tutor_name
            FROM conversations c
            JOIN students s  ON c.student_id = s.id
            JOIN students ts ON c.tutor_id   = ts.id
            WHERE c.student_id = ? OR c.tutor_id = ?
            ORDER BY c.last_message_at DESC`,
            [user_id, user_id]
        );

        return res.json({ 
            success: true, 
            count: rows.length, 
            convos: rows, 
            user_role: user.role,        // always present
            user_name: user.fullName     // optional but there if needed
        });

    } catch (err) {
        console.error("Error fetching conversations:", err);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            details: err.message
        });
    }
}

export async function sendMessage(req, res) {

    // Extract required values
    const sender_id = req.session.user.id;
    const { receiver_id, message_text } = req.body;
    const convo_id = req.params.convo_id;

    // Validation: ensure required data exists
    if (!receiver_id || !message_text || !convo_id) {
        return res.status(400).json({
            success: false,
            error: "Missing receiver_id, message_text, or convo_id."
        });
    }

    try {
        // "Send" the message (insert into 'messages' table)
        const [messageResult] = await pool.query(
            `
            INSERT INTO messages (sender_id, receiver_id, convo_id, message_text)
            VALUES (?, ?, ?, ?)
            `,
            [sender_id, receiver_id, convo_id, message_text]
        );

        if (messageResult.affectedRows === 0) {
            return res.status(500).json({
                success: false,
                error: "Message insert failed."
            });
        }

        // UPDATE conversation metadata, using NOW() function for date
        // Whether student OR tutor, sender_id will ALWAYS be a students.id, thus giving us a students.full_name
        const [convoUpdate] = await pool.query(
            `
            UPDATE conversations
            SET 
                last_message_at = NOW(),
                last_message_text = ?,
                last_sender_name = (
                    SELECT full_name
                    FROM students
                    WHERE id = ?
                    LIMIT 1
                )
            WHERE convo_id = ?
            `,
            [message_text, sender_id, convo_id]
        );

        if (convoUpdate.affectedRows == 0){
            return res.status(500).json({
                success: false,
                error: "Convo metadata update failure."
            })
        }

        // respond with all the juicy details
        res.json({
            success: true,
            message_id: messageResult.insertId,
            convo_id,
            message: {
                sender_id,
                receiver_id,
                message_text,
                sent_at: new Date()
            }
        });

    } catch (err) {
        console.error("Error sending message or updating conversation:", err);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            details: err.message
        });
    }
}

export async function getMessages(req, res) {

    const convo_id = req.params.convo_id;
    // Validation: ensure required data exists
    if (!convo_id) {
        return res.status(400).json({
            success: false,
            error: "Missing convo_id."
        });
    }
    // Get all messages within a requested convo :D
    try {
        const [rows] = await pool.query(`
            SELECT *
            FROM messages
            WHERE convo_id = ?
            ORDER BY sent_at ASC;`,
            [convo_id]
        );
        
        res.json({ success: true, count: rows.length, messages: rows });
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ success: false, error: "Internal server error", details: err.message });
    }
}