function element(tag, className = "", text = "") {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
}

function icon(symbol, description, className = "") {
    const node = element("span", `weather-emoji ${className}`, symbol);
    node.setAttribute("role", "img");
    node.setAttribute("aria-label", description);
    return node;
}

function heading(label, title, id, tag = "h2") {
    const wrapper = element("div");
    const titleNode = element(tag, "", title);
    titleNode.id = id;
    wrapper.append(element("p", "eyebrow", label), titleNode);
    return wrapper;
}

function detail(iconSymbol, label, value) {
    const item = element("div", "detail-item");
    const iconNode = element("span", "detail-icon", iconSymbol);
    const text = element("div");

    iconNode.setAttribute("aria-hidden", "true");
    text.append(element("p", "detail-label", label), element("p", "detail-value", value));
    item.append(iconNode, text);
    return item;
}

function forecastCard(day, index) {
    const card = element("details", "forecast-card");
    const summary = element("summary");
    const temperatures = element("span", "forecast-temperatures");
    const details = element("div", "forecast-details");

    card.open = index === 0;
    summary.append(
        element("span", "forecast-day", day.day),
        icon(day.icon, day.description),
        element("span", "forecast-description", day.description)
    );
    temperatures.append(
        element("strong", "", `${day.high}°`),
        element("span", "", `${day.low}°`)
    );
    summary.append(temperatures);

    const wind = element("p");
    wind.append(
        element("span", "", "Vind · 10 m"),
        element("strong", "", `${day.wind} km/t · ${day.direction}`)
    );

    const precipitation = element("p");
    precipitation.append(
        element("span", "", "Nedbør"),
        element("strong", "", day.precipitation)
    );

    details.append(wind, precipitation);
    card.append(summary, details);
    return card;
}

function appHeader() {
    const header = element("header", "topbar");
    const brand = element("a", "brand");
    const search = element("form", "location-search");
    const input = element("input");
    const button = element("button", "", "Søg");
    const name = element("span", "", "vejr");
    const sun = element("span", "brand-icon", "☀");

    brand.href = "#";
    brand.setAttribute("aria-label", "Vejr, forsiden");
    sun.setAttribute("aria-hidden", "true");
    name.append(element("span", "brand-period", "."));
    brand.append(sun, name);

    const label = element("label", "visually-hidden", "Søg efter en by");
    label.htmlFor = "location";
    input.id = "location";
    input.name = "location";
    input.type = "search";
    input.placeholder = "Søg efter en by";
    button.type = "submit";
    button.setAttribute("aria-label", "Søg");
    search.setAttribute("role", "search");
    search.append(label, element("span", "search-icon", "⌕"), input, button);
    header.append(brand, search);
    return header;
}

function todaySection(weather) {
    const current = weather.current;
    const section = element("section", "today-section");
    const sectionHeader = element("div", "section-heading");
    const panel = element("article", "weather-panel");
    const currentWeather = element("div", "current-weather");
    const location = element("div", "location-label");
    const temperatureLine = element("div", "temperature-line");
    const details = element("div", "weather-details");
    const city = weather.country ? `${weather.city}, ${weather.country}` : weather.city;
    const pin = element("span", "location-pin", "⌖");
    const temperature = element("p", "temperature", `${current.temperature}`);

    section.setAttribute("aria-labelledby", "today-heading");
    sectionHeader.append(
        heading("LOKALT VEJR", "Vejret i dag", "today-heading", "h1"),
        element("p", "date-label", weather.date)
    );
    pin.setAttribute("aria-hidden", "true");
    location.append(pin, element("h2", "", city));
    temperature.append(element("span", "", "°"));
    temperatureLine.append(icon(current.icon, current.description, "current-icon"), temperature);
    currentWeather.append(
        location,
        element("p", "weather-description", current.description),
        temperatureLine,
        element("p", "feels-like", `Føles som ${current.feelsLike}°`)
    );
    details.setAttribute("aria-label", "Vejrdetaljer");
    details.append(
        detail("🌡", "Temperatur", `${current.temperature} °C`),
        detail("↗", "Vindstyrke · 10 m", `${current.wind} km/t`),
        detail("➤", "Vindretning", current.direction),
        detail("☂", "Nedbør", current.precipitation)
    );
    panel.append(currentWeather, details);
    section.append(sectionHeader, panel);
    return section;
}

function forecastSection(forecast) {
    const section = element("section", "forecast-section");
    const sectionHeader = element("div", "section-heading");
    const grid = element("div", "forecast-grid");

    section.setAttribute("aria-labelledby", "forecast-heading");
    sectionHeader.append(
        heading("PLANLÆG DIN UGE", "De næste fem dage", "forecast-heading"),
        element("p", "section-hint", "Vælg en dag for detaljer")
    );
    forecast.forEach((day, index) => grid.append(forecastCard(day, index)));
    section.append(sectionHeader, grid);
    return section;
}

function appFooter() {
    const footer = element("footer", "page-footer");
    const attribution = element("p", "", "Vejrdata fra ");
    const link = element("a", "", "Open-Meteo");

    link.href = "https://open-meteo.com/";
    link.target = "_blank";
    link.rel = "noreferrer";
    attribution.append(link);
    footer.append(element("p", "", "Vejret, lige dér hvor du er."), attribution);
    return footer;
}

function renderPage(root, content) {
    root.replaceChildren(appHeader(), content, appFooter());
}

export function renderMessage(root, message, isError = false) {
    const main = element("main");
    const status = element("p", "app-status", message);
    status.setAttribute("role", isError ? "alert" : "status");
    main.append(status);
    renderPage(root, main);
}

export function renderWeather(root, weather) {
    const main = element("main");
    main.append(todaySection(weather), forecastSection(weather.forecast));
    renderPage(root, main);
}
