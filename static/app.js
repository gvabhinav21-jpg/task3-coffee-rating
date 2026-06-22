document.addEventListener('DOMContentLoaded', () => {
    const menuGrid = document.getElementById('menu-grid');
    const categoryTabs = document.getElementById('category-tabs');
    
    // Leaderboard elements
    const leaderName = document.getElementById('leader-name');
    const leaderDesc = document.getElementById('leader-desc');
    const leaderVotes = document.getElementById('leader-total-ratings');
    const leaderAvgRating = document.getElementById('leader-avg-rating');
    const leaderImg = document.getElementById('leader-img');
    const leaderStarsContainer = document.getElementById('leader-stars-container');
    const leaderboardBanner = document.getElementById('leaderboard-banner');

    let coffeesData = [];
    let activeCategory = 'all';

    // Fetch coffees list from SQLite
    async function fetchCoffees() {
        try {
            const response = await fetch('/api/coffees');
            if (!response.ok) throw new Error('Failed to fetch coffee ratings');
            
            coffeesData = await response.json();
            updateLeaderboard(coffeesData);
            applyFilter();
        } catch (error) {
            console.error('Error fetching coffees:', error);
            menuGrid.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-triangle-exclamation spinner" style="color: #ef4444;"></i>
                    <p>Failed to load coffee board. Please refresh.</p>
                </div>
            `;
        }
    }

    // Determine and update leader details
    function updateLeaderboard(coffees) {
        if (!coffees || coffees.length === 0) {
            leaderName.textContent = 'Welcome!';
            leaderDesc.textContent = 'Rate specialty drinks below to crown a customer favorite.';
            leaderVotes.textContent = '0';
            leaderAvgRating.textContent = '0.0';
            leaderImg.src = '/static/images/espresso.svg';
            leaderStarsContainer.innerHTML = '';
            return;
        }

        // Coffees are already sorted by rating sum/count descending
        const leader = coffees[0];
        
        leaderName.textContent = leader.name;
        leaderDesc.textContent = leader.description;
        leaderVotes.textContent = leader.rating_count;
        leaderAvgRating.textContent = leader.avg_rating;
        leaderImg.src = leader.image_url;
        
        renderStars(leaderStarsContainer, leader.avg_rating);
    }

    // Render stars representation
    function renderStars(container, rating) {
        container.innerHTML = '';
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.4; // 0.4-0.8 triggers half star representation
        
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('i');
            if (i <= fullStars) {
                star.className = 'fa-solid fa-star';
            } else if (i === fullStars + 1 && hasHalf) {
                star.className = 'fa-solid fa-star-half-stroke';
            } else {
                star.className = 'fa-regular fa-star';
            }
            container.appendChild(star);
        }
    }

    // Category Tabs handler
    categoryTabs.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            categoryTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.category;
            applyFilter();
        });
    });

    function applyFilter() {
        const filtered = activeCategory === 'all'
            ? coffeesData
            : coffeesData.filter(c => c.category === activeCategory);
        renderMenu(filtered);
    }

    // Render cards list
    function renderMenu(coffees) {
        menuGrid.innerHTML = '';

        if (coffees.length === 0) {
            menuGrid.innerHTML = '<p class="loading-state">No coffee items in this category.</p>';
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
                        <div>
                            <h3 class="coffee-name">${escapeHTML(coffee.name)}</h3>
                            <span class="coffee-category-tag">${escapeHTML(coffee.category)}</span>
                        </div>
                    </div>
                    <p class="coffee-desc">${escapeHTML(coffee.description)}</p>
                </div>
                <div class="coffee-actions">
                    <div class="rating-info-row">
                        <div class="score-display-inline">
                            <i class="fa-solid fa-star"></i>
                            <span class="avg-text">${coffee.avg_rating}</span>
                        </div>
                        <span class="count-text">${coffee.rating_count} ratings</span>
                    </div>
                    <!-- Stars Rating Selection widget -->
                    <div class="rating-widget">
                        <span class="widget-label">Rate:</span>
                        <div class="star-input-group" data-coffee-id="${coffee.id}">
                            <i class="fa-regular fa-star star-rate-btn" data-value="1"></i>
                            <i class="fa-regular fa-star star-rate-btn" data-value="2"></i>
                            <i class="fa-regular fa-star star-rate-btn" data-value="3"></i>
                            <i class="fa-regular fa-star star-rate-btn" data-value="4"></i>
                            <i class="fa-regular fa-star star-rate-btn" data-value="5"></i>
                        </div>
                    </div>
                </div>
            `;

            // Star hover and click behavior inside card
            const starInputGroup = card.querySelector('.star-input-group');
            const stars = starInputGroup.querySelectorAll('.star-rate-btn');

            stars.forEach((star, index) => {
                // Hover behavior
                star.addEventListener('mouseover', () => {
                    stars.forEach((s, idx) => {
                        if (idx <= index) {
                            s.classList.add('hovered');
                            s.classList.replace('fa-regular', 'fa-solid');
                        } else {
                            s.classList.remove('hovered');
                            s.classList.replace('fa-solid', 'fa-regular');
                        }
                    });
                });

                // Hover exit behavior
                star.addEventListener('mouseout', () => {
                    stars.forEach(s => {
                        s.classList.remove('hovered');
                        s.classList.replace('fa-solid', 'fa-regular');
                    });
                });

                // Rating Submission click behavior
                star.addEventListener('click', (e) => {
                    const starsCount = parseInt(star.dataset.value);
                    submitRating(coffee.id, starsCount);
                    spawnBurstEffect(e.clientX, e.clientY);
                });
            });

            menuGrid.appendChild(card);
        });
    }

    // Submit rating stars to API
    async function submitRating(coffeeId, starsCount) {
        try {
            const response = await fetch(`/api/coffees/${coffeeId}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stars: starsCount })
            });

            if (!response.ok) throw new Error('Failed to record rating');
            const result = await response.json();

            // Update local state list
            coffeesData = coffeesData.map(c => {
                if (c.id === coffeeId) {
                    const newCount = result.rating_count;
                    const newSum = c.rating_sum + starsCount;
                    const newAvg = roundToOneDecimal(newSum / newCount);
                    return { ...c, rating_sum: newSum, rating_count: newCount, avg_rating: newAvg };
                }
                return c;
            });

            // Re-sort coffees list by avg_rating DESC, rating_count DESC
            coffeesData.sort((a, b) => {
                if (b.avg_rating !== a.avg_rating) {
                    return b.avg_rating - a.avg_rating;
                }
                return b.rating_count - a.rating_count;
            });

            // Re-render
            updateLeaderboard(coffeesData);
            applyFilter();

        } catch (error) {
            console.error('Error submitting rating:', error);
            alert('Failed to save rating. Please try again.');
        }
    }

    // Particle Burst click effect
    function spawnBurstEffect(x, y) {
        const particlesCount = 8;
        const particleIcons = ['☕', '⭐', '✨', '🟤'];
        
        for (let i = 0; i < particlesCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random character selection
            particle.textContent = particleIcons[Math.floor(Math.random() * particleIcons.length)];
            
            // Set initial position
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            
            // Randomize trajectory offset
            const tx = (Math.random() - 0.5) * 150;
            const ty = (Math.random() - 0.5) * 150 - 50; // offset slightly upwards
            const rot = (Math.random() - 0.5) * 360;
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.setProperty('--rot', `${rot}deg`);
            
            document.body.appendChild(particle);
            
            // Clean up
            particle.addEventListener('animationend', () => {
                particle.remove();
            });
        }
    }

    // Helper functions
    function roundToOneDecimal(num) {
        return Math.round(num * 10) / 10;
    }

    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Load menu
    fetchCoffees();
});
