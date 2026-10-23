import { getWeather, searchLocation } from "./weatherModel.js";
import { renderMessage, renderWeather } from "./weatherView.js";

export function startWeatherApp() {
    const app = document.querySelector("#app");
    if (!app) throw new Error('Appens HTML-element "#app" blev ikke fundet.');

    let latestRequest = 0;

    function showError(error, nextStep) {
        renderMessage(app, `${error.message} ${nextStep}`, true);
    }

    async function showWeather(location, requestId) {
        renderMessage(app, "Henter vejret...");

        try {
            const weather = await getWeather(location);
            if (requestId === latestRequest) renderWeather(app, weather);
        } catch (error) {
            if (requestId === latestRequest) showError(error, "Søg efter en by for at prøve igen.");
        }
    }

    app.addEventListener("submit", async (event) => {
        if (!event.target.matches(".location-search")) return;
        event.preventDefault();

        const requestId = ++latestRequest;
        const query = String(new FormData(event.target).get("location") || "").trim();

        if (!query) {
            renderMessage(app, "Skriv navnet på en by for at søge.", true);
            return;
        }

        renderMessage(app, `Søger efter ${query}...`);
        try {
            const location = await searchLocation(query);
            if (requestId === latestRequest) await showWeather(location, requestId);
        } catch (error) {
            if (requestId === latestRequest) showError(error, "Prøv igen eller søg efter en anden by.");
        }
    });

    if (!navigator.geolocation) {
        renderMessage(app, "Din browser kan ikke finde din position. Søg efter en by.", true);
        return;
    }

    const requestId = ++latestRequest;
    renderMessage(app, "Finder din position...");
    navigator.geolocation.getCurrentPosition(
        ({ coords }) => showWeather({
            latitude: coords.latitude,
            longitude: coords.longitude,
            city: "Din lokation"
        }, requestId),
        () => {
            if (requestId === latestRequest) {
                renderMessage(app, "Vi kunne ikke finde din position. Søg efter en by.", true);
            }
        },
        { timeout: 10000, maximumAge: 600000 }
    );
}
