const forecastApi = "https://api.open-meteo.com/v1/forecast";
const geocodingApi = "https://geocoding-api.open-meteo.com/v1/search";
const windDirections = ["N", "NØ", "Ø", "SØ", "S", "SV", "V", "NV"];

const conditions = {};
const addConditions = (codes, description, icon) => {
    codes.forEach((code) => conditions[code] = [description, icon]);
};

addConditions([0], "Solrigt", "☀️");
addConditions([1], "Mest sol", "🌤️");
addConditions([2], "Delvist skyet", "⛅");
addConditions([3], "Skyet", "☁️");
addConditions([45, 48], "Tåge", "🌫️");
addConditions([51, 53, 55, 56, 57], "Støvregn", "🌦️");
addConditions([61, 63, 65, 66, 67], "Regn", "🌧️");
addConditions([71, 73, 75, 77], "Sne", "❄️");
addConditions([80, 81, 82], "Regnbyger", "🌦️");
addConditions([85, 86], "Snebyger", "🌨️");
addConditions([95, 96, 99], "Tordenvejr", "⛈️");

function makeUrl(endpoint, params) {
    const url = new URL(endpoint);
    url.search = new URLSearchParams(params);
    return url;
}

async function fetchData(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            const data = await response.json().catch(() => null);
            throw new Error(data?.reason || `Open-Meteo svarede med fejl (${response.status}).`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.reason || "Open-Meteo kunne ikke hente vejrdata.");
        return data;
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("Forbindelsen til Open-Meteo tog for lang tid. Prøv igen.");
        }
        if (error instanceof TypeError) {
            throw new Error("Kunne ikke hente data. Tjek din internetforbindelse.");
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

function condition(code) {
    const [description, icon] = conditions[code] || ["Ukendt vejr", "🌡️"];
    return { description, icon };
}

function direction(degrees) {
    return windDirections[Math.round(degrees / 45) % 8];
}

function precipitation({ total = 0, rain = 0, showers = 0, snow = 0, code }) {
    let type = "Ingen";
    let amount = 0;

    if (snow > 0 || [71, 73, 75, 77, 85, 86].includes(code)) {
        type = "Sne";
        amount = snow || total;
    } else if (showers > 0) {
        type = "Byger";
        amount = showers;
    } else if (rain > 0) {
        type = "Regn";
        amount = rain;
    } else if (total > 0) {
        type = "Nedbør";
        amount = total;
    }

    if (!amount) return "Ingen · 0 mm";
    return `${type} · ${amount.toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mm`;
}

function formatDate(date, options) {
    const utcDate = new Date(`${date.slice(0, 10)}T12:00:00Z`);
    return new Intl.DateTimeFormat("da-DK", { ...options, timeZone: "UTC" }).format(utcDate);
}

export async function searchLocation(query) {
    const data = await fetchData(makeUrl(geocodingApi, {
        name: query,
        count: "1",
        language: "da",
        format: "json"
    }));
    const place = data.results?.[0];

    if (!place) throw new Error(`Vi kunne ikke finde "${query}".`);

    return {
        latitude: place.latitude,
        longitude: place.longitude,
        city: place.name,
        country: place.country
    };
}

export async function getWeather(location) {
    const data = await fetchData(makeUrl(forecastApi, {
        latitude: location.latitude,
        longitude: location.longitude,
        current: "temperature_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,wind_direction_10m",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,showers_sum,snowfall_sum,wind_speed_10m_max,wind_direction_10m_dominant",
        forecast_days: "5",
        timezone: "auto",
        wind_speed_unit: "kmh"
    }));

    if (!data.current || !data.daily?.time?.length) {
        throw new Error("Open-Meteo returnerede ikke de forventede vejrdata.");
    }

    const current = data.current;
    const daily = data.daily;
    const forecast = daily.time.map((date, index) => {
        const weather = condition(daily.weather_code[index]);

        return {
            day: index === 0 ? "I dag" : formatDate(date, { weekday: "long" }),
            ...weather,
            high: Math.round(daily.temperature_2m_max[index]),
            low: Math.round(daily.temperature_2m_min[index]),
            wind: Math.round(daily.wind_speed_10m_max[index]),
            direction: direction(daily.wind_direction_10m_dominant[index]),
            precipitation: precipitation({
                total: daily.precipitation_sum[index],
                rain: daily.rain_sum[index],
                showers: daily.showers_sum[index],
                snow: daily.snowfall_sum[index],
                code: daily.weather_code[index]
            })
        };
    });

    return {
        city: location.city,
        country: location.country,
        date: formatDate(current.time, { weekday: "long", day: "numeric", month: "long" }),
        current: {
            ...condition(current.weather_code),
            temperature: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            wind: Math.round(current.wind_speed_10m),
            direction: direction(current.wind_direction_10m),
            precipitation: precipitation({
                total: current.precipitation,
                rain: current.rain,
                showers: current.showers,
                snow: current.snowfall,
                code: current.weather_code
            })
        },
        forecast
    };
}
