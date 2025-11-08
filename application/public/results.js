// Once search button is clicked and user is redirected to the results.html page, queue 
document.addEventListener("DOMContentLoaded", async (event) => {
    // event.preventDefault();

    // get search terms from original landing page
    const params = JSON.parse(sessionStorage.getItem("searchParams"));
    
    console.log("Subject:", params.subject);
    console.log("Mode:", params.mode);
    console.log("Min Rating:", params.minrating);
    console.log("Date:", params.date);
    

     try {
        const response = await fetch(`/api/search?subject=${params.subject}&mode=${params.mode}&minrating=${params.minrating}&date=${params.date}`);
        const results = await response.json();
        console.log("Fetched tutor results:", results);

        const resultsContainer = document.getElementById("resultsContainer");
        resultsContainer.innerHTML = '';
        

        if (!Array.isArray(results)) {
            console.error("API response is not an array:", results);
            return;
        }

        results.forEach(tutor => {
            const card = document.createElement("div");
            card.classList.add("tutor-card");

            const name = tutor.tutor_name || "Anonymous Tutor";
            const subject = tutor.subjects?.[0] || "General Help";
            const rating = parseFloat(tutor.tutor_rating) || 0;
            const date = tutor.session_date ? formatDate(tutor.session_date) : "Date TBA";
            const description = tutor.description || "No description provided.";
            const image = tutor.image_url || "/images/default.png";

            card.innerHTML = `
            <img src="${image}" alt="Tutor" class="tutor-img">
            <div class="tutor-name">${name}</div>
            <div class="tutor-subject">${subject}</div>
            <div class="tutor-rating">${generateStars(rating)}</div>
            <div class="tutor-date">Available: ${date}</div>
            <div class="tutor-description">${description}</div>
            `;

            resultsContainer.appendChild(card);
        });

    } catch (err) {
        console.error("Search error:", err);
    }

    function generateStars(rating) {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;
        let stars = "★".repeat(full);
        if (half) stars += "½";
        return stars.padEnd(5, "☆");
    }

    function formatDate(rawDate) {
        const d = new Date(rawDate);
        return d.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    }


});