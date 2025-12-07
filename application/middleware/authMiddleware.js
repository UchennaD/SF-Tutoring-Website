// application/middleware/authMiddleware.js

// Protects routes by requiring a valid logged-in session
export function requireAuth(req, res, next) {
  try {
    if (!req.session || !req.session.user) {
      // Not logged in → block or redirect
      return res.status(401).json({
        success: false,
        message: "Unauthorized: You must be logged in."
      });
    }

    // Attach user data for downstream handlers (allows use of user info without touching session directly)
    req.user = req.session.user;

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal auth error."
    });
  }
}

// Bonus: Restrict access to tutors only (i.e. session scheduling page, tutor dashboard, etc.)
export function requireTutor(req, res, next) {
  try {

    // Step 1: Ensure user has *any* account & an active session tied to it
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Login required."
      });
    }
    
    // Step 2: Ensure the account tied to session is a TUTOR (not student) account
    if (req.session.user.role !== "tutor") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Tutor access only."
      });
    }

    // Step 3: Once verified, provide clean user object without needing to meddle with the session itself
    req.user = req.session.user;
    // (allow access to whatever page/endpoint was requested)
    next();
  } catch (err) {
    console.error("Tutor auth error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal auth error."
    });
  }
}
