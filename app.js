// Default location: Boca Raton, FL
const DEFAULT_LOCATION = { name: "Boca Raton", lat: 26.3683, lon: -80.1289 };

// WMO weather codes used by Open-Meteo
const WEATHER_CODES = {
  0: ["Clear", "☀️"],
  1: ["Mostly Clear", "🌤️"],
  2: ["Partly Cloudy", "⛅"],
  3: ["Cloudy", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Fog", "🌫️"],
  51: ["Light Drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Heavy Drizzle", "🌧️"],
  61: ["Light Rain", "🌦️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy Rain", "🌧️"],
  71: ["Light Snow", "🌨️"],
  73: ["Snow", "🌨️"],
  75: ["Heavy Snow", "❄️"],
  80: ["Showers", "🌦️"],
  81: ["Showers", "🌧️"],
  82: ["Heavy Showers", "⛈️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm", "⛈️"],
  99: ["Thunderstorm", "⛈️"],
};

function describe(code) {
  return WEATHER_CODES[code] || ["Unknown", "🌡️"];
}

async function loadWeather({ name, lat, lon }) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation" +
    "&hourly=temperature_2m,weather_code" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
    "&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto";

  try {
    const res = await fetch(url);
    const data = await res.json();
    render(name, data);
  } catch (err) {
    document.getElementById("condition").textContent = "Could not load weather";
  }
}

function render(name, data) {
  const c = data.current;
  const [label] = describe(c.weather_code);

  document.getElementById("location").textContent = name;
  document.getElementById("temp").textContent = `${Math.round(c.temperature_2m)}°`;
  document.getElementById("condition").textContent = label;
  document.getElementById("hi-lo").textContent =
    `H:${Math.round(data.daily.temperature_2m_max[0])}°  L:${Math.round(data.daily.temperature_2m_min[0])}°`;

  document.getElementById("feels").textContent = `${Math.round(c.apparent_temperature)}°`;
  document.getElementById("humidity").textContent = `${c.relative_humidity_2m}%`;
  document.getElementById("wind").textContent = `${Math.round(c.wind_speed_10m)} mph`;
  document.getElementById("precip").textContent = `${c.precipitation}"`;

  // Next 24 hours, starting at the current hour
  const now = c.time.slice(0, 13);
  const start = Math.max(0, data.hourly.time.findIndex((t) => t.startsWith(now)));
  let hourlyHtml = "";
  for (let i = start; i < start + 24 && i < data.hourly.time.length; i++) {
    const hour = new Date(data.hourly.time[i]).toLocaleTimeString([], { hour: "numeric" });
    const [, icon] = describe(data.hourly.weather_code[i]);
    hourlyHtml += `
      <div class="hour">
        <span>${i === start ? "Now" : hour}</span>
        <span class="icon">${icon}</span>
        <span>${Math.round(data.hourly.temperature_2m[i])}°</span>
      </div>`;
  }
  document.getElementById("hourly").innerHTML = hourlyHtml;

  let dailyHtml = "";
  data.daily.time.forEach((date, i) => {
    const day = i === 0 ? "Today" : new Date(date + "T00:00").toLocaleDateString([], { weekday: "short" });
    const [, icon] = describe(data.daily.weather_code[i]);
    dailyHtml += `
      <div class="day">
        <span>${day}</span>
        <span class="icon">${icon}</span>
        <span class="range">
          <span class="low">${Math.round(data.daily.temperature_2m_min[i])}°</span>
          <span>${Math.round(data.daily.temperature_2m_max[i])}°</span>
        </span>
      </div>`;
  });
  document.getElementById("daily").innerHTML = dailyHtml;
}

// City search using the Open-Meteo geocoding API
document.getElementById("search-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = document.getElementById("search-input").value.trim();
  if (!query) return;

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`
    );
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      alert("City not found");
      return;
    }
    const place = data.results[0];
    loadWeather({ name: place.name, lat: place.latitude, lon: place.longitude });
    document.getElementById("search-input").value = "";
  } catch (err) {
    alert("Search failed. Please try again.");
  }
});

// Light/dark theme toggle (light is the default)
const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.dataset.theme = "dark";
  } else {
    delete document.documentElement.dataset.theme;
  }
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem("theme", next);
  } catch (e) {}
});

loadWeather(DEFAULT_LOCATION);
