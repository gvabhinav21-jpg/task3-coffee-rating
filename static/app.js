document.addEventListener('DOMContentLoaded', () => {
    const menuGrid = document.getElementById('menu-grid');
    const leaderName = document.getElementById('leader-name');
    const leaderDesc = document.getElementById('leader-desc');
    const leaderVotes = document.getElementById('leader-votes');
    const leaderImg = document.getElementById('leader-img');
    const leaderboardBanner = document.getElementById('leaderboard-banner');

    let coffeesData = [];

    // Fetch coffees from backend
    async function fetchCoffees() {
        try {
            const response = await fetch('/api/coffees');
            if (!response.ok) throw new Error('Failed to fetch coffee ratings');
            
            coffeesData = await response.json();
            updateLeaderboard(coffeesData);
            renderMenu(coffeesData);
        } catch (error) {
            console.error('Error fetching coffees:', error);
            menuGrid.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-triangle-exclamation spinner" style="color: #ef4444;"></i>
                    <p>Failed to load coffee board. Please try again later.</p>
                </div>
            `;
        }
    }

    // Determine and update leader details
    function updateLeaderboard(coffees) {
        if (!coffees || coffees.length === 0) {
            leaderName.textContent = 'Join the vote!';
            leaderDesc.textContent = 'Vote for your favorite coffee below to display the favorite here.';
            leaderVotes.textContent = '0';
            leaderImg.src = '/static/images/espresso.svg';
            return;
        }

        // Coffees are already sorted by votes DESC from backend
        const leader = coffees[0];
        
        leaderName.textContent = leader.name;
        leaderDesc.textContent = leader.description;
        leaderVotes.textContent = leader.votes;
        leaderImg.src = leader.image_url;
        
        // Add subtle animation when leader changes
        leaderboardBanner.classList.remove('pop-effect');
        void leaderboardBanner.offsetWidth; // Trigger reflow
        leaderboardBanner.classList.add('pop-effect');
    }

    // Render list of coffee cards
    function renderMenu(coffees) {
        // Clear grid
        menuGrid.innerHTML = '';

        if (coffees.length === 0) {
            menuGrid.innerHTML = '<p class="loading-state">No specialty coffees available.</p>';
            return;
        }

        coffees.forEach(coffee => {
            const card = document.createElement('div');
            card.className = 'coffee-card';
            card.setAttribute('data-id', coffee.id);

            card.innerHTML = `
                <div>
                    <div class="coffee-top">
                        <div class="coffee-img-container">
                            <img src="${escapeHTML(coffee.image_url)}" alt="${escapeHTML(coffee.name)}">
                        </div>
                        <h3 class="coffee-name">${escapeHTML(coffee.name)}</h3>
                    </div>
                    <p class="coffee-desc">${escapeHTML(coffee.description)}</p>
                </div>
                <div class="coffee-actions">
                    <span class="coffee-vote-count">
                        Votes: <span class="vote-number" id="votes-val-${coffee.id}">${coffee.votes}</span>
                    </span>
                    <button class="vote-btn" data-id="${coffee.id}">
                        <i class="fa-regular fa-heart"></i> Vote
                    </button>
                </div>
            `;

            // Click listener for Vote button
            const voteBtn = card.querySelector('.vote-btn');
            voteBtn.addEventListener('click', () => {
                castVote(coffee.id, voteBtn);
            });

            menuGrid.appendChild(card);
        });
    }

    // Post vote to API
    async function castVote(id, buttonEl) {
        buttonEl.disabled = true;
        const icon = buttonEl.querySelector('i');
        
        // Heart icon pop animation
        icon.className = 'fa-solid fa-heart pop-effect';

        try {
            const response = await fetch(`/api/coffees/${id}/vote`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Failed to register vote');

            const result = await response.json();

            // Update local data
            coffeesData = coffeesData.map(c => {
                if (c.id === id) {
                    return { ...c, votes: result.votes };
                }
                return c;
            });

            // Sort data: votes DESC, name ASC
            coffeesData.sort((a, b) => {
                if (b.votes !== a.votes) {
                    return b.votes - a.votes;
                }
                return a.name.localeCompare(b.name);
            });

            // Update UI count immediately
            const votesValSpan = document.getElementById(`votes-val-${id}`);
            if (votesValSpan) votesValSpan.textContent = result.votes;

            // Re-render other parts/leaderboard
            setTimeout(() => {
                updateLeaderboard(coffeesData);
                renderMenu(coffeesData);
            }, 400); // Small timeout to let animation finish nicely

        } catch (error) {
            console.error('Error voting:', error);
            alert('Could not record vote. Please try again.');
            icon.className = 'fa-regular fa-heart';
            buttonEl.disabled = false;
        }
    }

    // Escape HTML characters helper
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Initial load
    fetchCoffees();
});
