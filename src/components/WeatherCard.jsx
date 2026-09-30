// Sunrise/sunset come as UTC seconds. Adding the city's timezone offset
// (in seconds) and formatting as UTC gives the city's LOCAL time.
function formatTime(unixSeconds, timezoneOffset) {
  return new Date((unixSeconds + timezoneOffset) * 1000).toLocaleTimeString(
    "en-US",
    { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }
  );
}

export default function WeatherCard({ data }) {
  const { name, sys, main, weather, wind, timezone } = data;
  const condition = weather[0];

  return (
    <section className="card weather-card">
      <header className="card-header">
        <h2 className="city">
          {name}, {sys.country}
        </h2>
      </header>

      <div className="hero">
        <img
          className="weather-icon"
          src={`https://openweathermap.org/img/wn/${condition.icon}@2x.png`}
          alt={condition.description}
          width="100"
          height="100"
        />
        <div>
          <p className="temp">{Math.round(main.temp)}°C</p>
          <p className="description">{condition.description}</p>
          <p className="feels">Feels like {Math.round(main.feels_like)}°C</p>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat-icon" aria-hidden="true">💧</span>
          <span className="stat-label">Humidity</span>
          <span className="stat-value">{main.humidity}%</span>
        </div>
        <div className="stat">
          <span className="stat-icon" aria-hidden="true">💨</span>
          <span className="stat-label">Wind speed</span>
          <span className="stat-value">{wind.speed} m/s</span>
        </div>
        <div className="stat">
          <span className="stat-icon" aria-hidden="true">🌅</span>
          <span className="stat-label">Sunrise</span>
          <span className="stat-value">{formatTime(sys.sunrise, timezone)}</span>
        </div>
        <div className="stat">
          <span className="stat-icon" aria-hidden="true">🌇</span>
          <span className="stat-label">Sunset</span>
          <span className="stat-value">{formatTime(sys.sunset, timezone)}</span>
        </div>
      </div>
    </section>
  );
}