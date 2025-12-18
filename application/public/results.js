// Once search button is clicked and user is redirected to the results.html page, queue 
document.addEventListener("DOMContentLoaded", async (event) => {
    // event.preventDefault();

    // get search terms from original landing page
    const params = JSON.parse(sessionStorage.getItem("searchParams") || "{}") || {};

    // Normalize subject input so users can type prefixes (e.g., "CSC 220") while tutors store natural language (e.g., "Computer Science")
    function normalizeSubjectInput(raw) {
        if (!raw) return "";

        const cleaned = String(raw)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        if (!cleaned) return "";

        const alias = {
            csc: "computer science",
            cs: "computer science",
            compsci: "computer science",
            phys: "physics",
            phy: "physics",
            math: "math",
            bus: "business",
            fin: "finance",
            acct: "accounting",
            eng: "english",
            engl: "english",
            chem: "chemistry",
            bio: "biology",
            biol: "biology",
            stats: "statistics",
            stat: "statistics",
            econ: "economics",
            cine: "film",
            geo: "geology",
            comm: "communications",
            soc: "sociology",
            ast: "astronomy",
            astr: "astronomy",
            phil: "philosophy",
            engr: "engineering",
            hum: "humanities",
            lit: "literature",
            psy: "psychology",
            poli: "political science",
            arth: "art history",
            eths: "ethnic studies",
            wgs: "gender studies"
        };

        // If user typed something like "csc 220" or "phys101", extract leading alphabetical prefix
        const m = cleaned.match(/^([a-z]{2,8})(?:\s*\d{2,4})?(?:\b|$)/);
        if (m) {
            const prefix = m[1];
            if (alias[prefix]) return alias[prefix];
        }

        // If not, just keep the cleaned natural-language query (e.g., "computer science")
        return cleaned;
    }

    const subjectRaw = params.subjectRaw ?? params.subject ?? "";
    const subject = normalizeSubjectInput(subjectRaw);
    const mode = params.mode ?? "";
    const minrating = params.minrating ?? "";
    const date = params.date ?? "";

    console.log("Subject (raw):", subjectRaw);
    console.log("Subject (normalized):", subject);
    console.log("Mode:", mode);
    console.log("Min Rating:", minrating);
    console.log("Date:", date);
    

     try {
        const response = await fetch(
            `/api/search?subject=${encodeURIComponent(subject)}&mode=${encodeURIComponent(mode)}&minrating=${encodeURIComponent(minrating)}&date=${encodeURIComponent(date)}`
        );
        const results = await response.json();
        console.log("Fetched tutor results:", results);

        const resultsContainer = document.getElementById("resultsContainer");
        resultsContainer.innerHTML = '';
        
        // attempt to troubleshoot format issues
        if (!Array.isArray(results)) {
            console.error("API response is not an array:", results);
            return;
        }
        console.log(results[0]);

        results.forEach(tutor => {
            const card = document.createElement("div");
            card.classList.add("tutor-card");

            const name = tutor.tutor_name || "Anonymous Tutor";
            const subjects = (Array.isArray(tutor.subjects) && tutor.subjects.length > 0)
                ? tutor.subjects.map(sub => `<span class="subject-badge">${sub}</span>`).join(" ")
                : `<span class="subject-badge">General Help</span>`;
            const rating = parseFloat(tutor.tutor_rating) || 0;
            const date = tutor.session_date ? formatDate(tutor.session_date) : "Date TBA";


            // Create SAFE time for HTML template (DB format: HH:MM:SS)
            const rawTimeSlot = tutor.time_slot;
            let htmlTime = 'Time not set';

            if (rawTimeSlot) {
            const [hhStr, mmStr] = String(rawTimeSlot).split(':');
            const hh = Number(hhStr);
            const mm = Number(mmStr);

            if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
                const hour12 = ((hh + 11) % 12) + 1;
                const ampm = hh >= 12 ? 'PM' : 'AM';
                htmlTime = `${hour12}:${String(mm).padStart(2, '0')} ${ampm}`;
            }
            }
            
            const description = tutor.description || "No description provided.";


            // Generate a random profile pic using 
            let gender = (Math.random() < 0.5) ? "men" : "women";
            let num = Math.floor(Math.random() * 100);
            const image = "https://randomuser.me/api/portraits/"+ gender + "/" + num + ".jpg" ;   

            card.innerHTML = `
    <img src="${image}" alt="Tutor" class="tutor-img">
    <div class="tutor-name">${name}</div>
    <div class="tutor-subject">${subjects}</div>
    <div class="tutor-rating">${generateStars(rating)}</div>
    <div class="tutor-date">Available: ${date}</div>
    <div class="tutor-time">Start Time: ${htmlTime}</div>
    <div class="tutor-description">${description}</div>
    <button class="book-btn" data-session="${tutor.id}" data-tutor="${tutor.tutor_id}">Book Session</button>
`;
            // link generated HTML to existing anchor in results.html
            resultsContainer.appendChild(card);

            const bookBtn = card.querySelector(".book-btn");
            bookBtn.addEventListener("click", async () => {

                // The values to be injected into 'bookings' table
                const payload = {
                    // student_id: 1, // DEFER STUDENT ID ACQUISITION TO BACKEND via req.user.id or req.session.user.id
                    tutor_id: tutor.tutor_id,
                    session_id: tutor.id
                };

                // try to make HTTP post req to booking endpoint w/ payload attached
                try {  
                    console.log("Booking payload:", payload);
                    const res = await fetch("/api/book", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    // data == success/failure of HTTP req & subsequent SQL query
                    const data = await res.json();
                    console.log("Booking response:", data);

                    // TO-DO: (maybe?) Switch from simple ALERT to dynamic "apptConfirmation" page
                    // I don't think we have time to implement this before the demo but...

                    if (data.success) {
                        alert("Session booked successfully!");
                        // runs AFTER user clicks "OK"
                        card.remove(); // remove the card from DOM
                        // redirect to dashboard after booking
                        window.location.href = "studentDashboard.html";
                    } else {
                        alert("Booking failed: " + data.error);
                    }

                } catch (err) {
                    console.error("Booking error:", err);
                    alert("Could not complete booking.");
                }
            });
        });

    } catch (err) {
        console.error("Search error:", err);
    }

    // turns rating into stars w/ half-step increments
    function generateStars(rating) {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;
        let stars = "★".repeat(full);
        if (half) stars += "½";
        return stars.padEnd(5, "☆");
    }

    // turn the SQL numeric date into a more visually appealing format
    function formatDate(rawDate) {
        const d = new Date(rawDate);
        return d.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    }


});