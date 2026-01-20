function loadFAQ(jsonPath) {
	fetch(jsonPath)
		.then(response => response.json())
		.then(data => {
			const faqSection = document.querySelector('.faq');
			faqSection.innerHTML = ''; // clear existing FAQ

			data.forEach(category => {
				const catDiv = document.createElement('div');
				catDiv.className = 'faq-category';
				catDiv.innerHTML = `<h3>${category.category}</h3>`;

				category.questions.forEach(item => {
					const faqItem = document.createElement('div');
					faqItem.className = 'faq-item';
					faqItem.innerHTML = `
            <div class="faq-q">
              <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                <circle cx="12" cy="12" r="10" fill="#1e7a3c" />
                <line x1="12" y1="7" x2="12" y2="17" stroke="#fff" stroke-width="2" stroke-linecap="round" class="vertical" />
                <line x1="7" y1="12" x2="17" y2="12" stroke="#fff" stroke-width="2" stroke-linecap="round" />
              </svg>
              ${item.q}
            </div>
            <div class="faq-a">${item.a}</div>
          `;
					catDiv.appendChild(faqItem);
				});

				faqSection.appendChild(catDiv);
			});

			// Enable toggle effect
			const items = document.querySelectorAll(".faq-item");
			items.forEach(item => {
				const q = item.querySelector(".faq-q");
				const a = item.querySelector(".faq-a");
				const icon = item.querySelector(".icon");
				q.addEventListener("click", () => {
					const open = a.classList.toggle("open");
					icon.classList.toggle("rotated", open);
				});
			});
		});
}