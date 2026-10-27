import { fetchCoffees, rateCoffee } from "./api.js";
import { refs } from "./dom.js";
import { renderMenu, updateLeaderboard } from "./render.js";
import { roundToOneDecimal } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
    let coffeesData = [];
    let activeCategory = "all";

    async function loadCoffees() {
        try {
            coffeesData = await fetchCoffees();
            updateLeaderboard(coffeesData);
            applyFilter();
        } catch (error) {
            console.error("Error fetching coffees:", error);
            refs.menuGrid.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-triangle-exclamation spinner" style="color: #ef4444;"></i>
                    <p>Failed to load coffee board. Please refresh.</p>
                </div>
            `;
        }
    }

    refs.categoryTabs.querySelectorAll(".tab-btn").forEach((button) => {
        button.addEventListener("click", () => {
            refs.categoryTabs.querySelectorAll(".tab-btn").forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
            activeCategory = button.dataset.category;
            applyFilter();
        });
    });

    function applyFilter() {
        const filtered =
            activeCategory === "all"
                ? coffeesData
                : coffeesData.filter((coffee) => coffee.category === activeCategory);
        renderMenu(filtered, submitRating);
    }

    async function submitRating(coffeeId, starsCount) {
        try {
            const result = await rateCoffee(coffeeId, starsCount);

            coffeesData = coffeesData.map((coffee) => {
                if (coffee.id === coffeeId) {
                    const newCount = result.rating_count;
                    const newSum = coffee.rating_sum + starsCount;
                    const newAvg = roundToOneDecimal(newSum / newCount);
                    return {
                        ...coffee,
                        rating_sum: newSum,
                        rating_count: newCount,
                        avg_rating: newAvg,
                    };
                }
                return coffee;
            });

            coffeesData.sort((a, b) => {
                if (b.avg_rating !== a.avg_rating) {
                    return b.avg_rating - a.avg_rating;
                }
                return b.rating_count - a.rating_count;
            });

            updateLeaderboard(coffeesData);
            applyFilter();
        } catch (error) {
            console.error("Error submitting rating:", error);
            alert("Failed to save rating. Please try again.");
        }
    }

    loadCoffees();
});
