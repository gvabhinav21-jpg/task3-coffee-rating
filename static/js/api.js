async function request(url, options, errorMessage) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(errorMessage);
    }
    return response.json();
}

export function fetchCoffees() {
    return request("/api/coffees", {}, "Failed to fetch coffee ratings");
}

export function rateCoffee(id, stars) {
    return request(
        `/api/coffees/${id}/rate`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stars }),
        },
        "Failed to record rating"
    );
}
