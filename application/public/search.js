document.getElementById('searchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const subject = document.getElementById('subjectInput').value;
  const mode = document.getElementById('modeDropdown').value;
  const minrating = document.getElementById('minRating').value;
  const date = document.getElementById('dateSelection').value;

  const response = await fetch(`/api/search?subject=${subject}&mode=${mode}&minrating=${minrating}&date=${date}`);
  const results = await response.json();

  // Display results in the DOM
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';
  results.forEach(tutor => {
    const card = document.createElement('div');
    card.innerHTML = `
      <h3>${tutor.tutor_name}</h3>
      <p>${tutor.description}</p>
      <img src="/images/${tutor.image_url}" alt="${tutor.tutor_name}" />
    `;
    resultsDiv.appendChild(card);
  });
});