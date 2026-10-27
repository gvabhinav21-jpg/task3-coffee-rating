import { refs } from "./dom.js";
import { escapeHTML } from "./utils.js";

export function updateLeaderboard(coffees) {
    const { leaderName, leaderDesc, leaderVotes, leaderAvgRating, leaderImg, leaderStarsContainer } =
        refs;

    if (!coffees || coffees.length === 0) {
        leaderName.textContent = "Welcome!";
        leaderDesc.textContent = "Rate specialty drinks below to crown a customer favorite.";
        leaderVotes.textContent = "0";
        leaderAvgRating.textContent = "0.0";
        leaderImg.src = "/static/images/espresso.svg";
        leaderStarsContainer.innerHTML = "";
        return;
    }

    const leader = coffees[0];

    leaderName.textContent = leader.name;
    leaderDesc.textContent = leader.description;
    leaderVotes.textContent = leader.rating_count;
    leaderAvgRating.textContent = leader.avg_rating;
    leaderImg.src = leader.image_url;

    renderStars(leaderStarsContainer, leader.avg_rating);
}

function renderStars(container, rating) {
    container.innerHTML = "";
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.4;

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("i");
        if (i <= fullStars) {
            star.className = "fa-solid fa-star";
        } else if (i === fullStars + 1 && hasHalf) {
            star.className = "fa-solid fa-star-half-stroke";
        } else {
            star.className = "fa-regular fa-star";
        }
        container.appendChild(star);
    }
}

export function renderMenu(coffees, onSubmitRating) {
    refs.menuGrid.innerHTML = "";

    if (coffees.length === 0) {
        refs.menuGrid.innerHTML = '<p class="loading-state">No coffee items in this category.</p>';
        return;
    }

    coffees.forEach((coffee) => {
        const card = document.createElement("div");
        card.className = "coffee-card";
        card.setAttribute("data-id", coffee.id);

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

        const stars = card.querySelectorAll(".star-rate-btn");

        stars.forEach((star, index) => {
            star.addEventListener("mouseover", () => {
                stars.forEach((item, itemIndex) => {
                    if (itemIndex <= index) {
                        item.classList.add("hovered");
                        item.classList.replace("fa-regular", "fa-solid");
                    } else {
                        item.classList.remove("hovered");
                        item.classList.replace("fa-solid", "fa-regular");
                    }
                });
            });

            star.addEventListener("mouseout", () => {
                stars.forEach((item) => {
                    item.classList.remove("hovered");
                    item.classList.replace("fa-solid", "fa-regular");
                });
            });

            star.addEventListener("click", (event) => {
                const starsCount = parseInt(star.dataset.value);
                onSubmitRating(coffee.id, starsCount);
                spawnBurstEffect(event.clientX, event.clientY);
            });
        });

        refs.menuGrid.appendChild(card);
    });
}

function spawnBurstEffect(x, y) {
    const particlesCount = 8;
    const particleIcons = ["\u2615", "\u2b50", "\u2728", "\ud83d\udfe4"];

    for (let i = 0; i < particlesCount; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.textContent = particleIcons[Math.floor(Math.random() * particleIcons.length)];

        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        const tx = (Math.random() - 0.5) * 150;
        const ty = (Math.random() - 0.5) * 150 - 50;
        const rot = (Math.random() - 0.5) * 360;

        particle.style.setProperty("--tx", `${tx}px`);
        particle.style.setProperty("--ty", `${ty}px`);
        particle.style.setProperty("--rot", `${rot}deg`);

        document.body.appendChild(particle);

        particle.addEventListener("animationend", () => {
            particle.remove();
        });
    }
}
