// src/App.jsx
import { useEffect, useRef, useState } from 'react'
import './App.css'

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
const BASE = 'https://api.openweathermap.org/data/2.5'

const HOME_CITY = 'Kolkata,IN'
const QUICK_CITIES = ['Kolkata,IN', 'Mumbai,IN', 'Delhi,IN']

async function fetchJson(path, city) {
  const res = await fetch(
    `${BASE}/${path}?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
  )
  if (!res.ok) throw new Error(res.status === 404 ? 'City not found' : 'Something went wrong')
  return res.json()
}

async function getWeather(city) {
  const [current, forecast] = await Promise.all([
    fetchJson('weather', city),
    fetchJson('forecast', city),
  ])
  return { current, forecast }
}

const localDate = (unix, tz) => new Date((unix + tz) * 1000)

const formatTime = (unix, tz) =>
  localDate(unix, tz).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  })

const iconUrl = (icon, size = '2x') => `https://openweathermap.org/img/wn/${icon}@${size}.png`

const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase())

function getTheme(current) {
  const { main } = current.weather[0]
  const isNight = current.weather[0].icon.endsWith('n')
  if (main === 'Thunderstorm') return 'thunder'
  if (main === 'Rain' || main === 'Drizzle') return 'rain'
  if (main === 'Snow') return 'snow'
  if (['Mist', 'Fog', 'Haze', 'Smoke', 'Dust'].includes(main)) return 'mist'
  if (main === 'Clouds') return isNight ? 'clouds-night' : 'clouds'
  return isNight ? 'clear-night' : 'clear-day'
}

function buildDaily(forecast) {
  const tz = forecast.city.timezone
  const days = {}
  forecast.list.forEach((item) => {
    const d = localDate(item.dt, tz)
    const key = d.toISOString().slice(0, 10)
    if (!days[key]) days[key] = { key, min: Infinity, max: -Infinity, best: null, bestDiff: 99 }
    const day = days[key]
    day.min = Math.min(day.min, item.main.temp_min)
    day.max = Math.max(day.max, item.main.temp_max)
    const diff = Math.abs(d.getUTCHours() - 12)
    if (diff < day.bestDiff) {
      day.bestDiff = diff
      day.best = item
    }
  })
  const todayKey = localDate(forecast.list[0].dt, tz).toISOString().slice(0, 10)
  return Object.values(days)
    .filter((d) => d.key !== todayKey)
    .slice(0, 5)
    .map((d) => ({
      key: d.key,
      label: new Date(d.key + 'T00:00:00Z').toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: 'UTC',
      }),
      icon: d.best.weather[0].icon,
      desc: d.best.weather[0].description,
      min: Math.round(d.min),
      max: Math.round(d.max),
    }))
}

function buildHourly(forecast) {
  const tz = forecast.city.timezone
  return forecast.list.slice(0, 6).map((item) => ({
    dt: item.dt,
    time: localDate(item.dt, tz).toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true,
      timeZone: 'UTC',
    }),
    icon: item.weather[0].icon,
    temp: Math.round(item.main.temp),
    pop: Math.round((item.pop || 0) * 100),
  }))
}

function App() {
  const [query, setQuery] = useState('')
  const [data, setData] = useState(null)
  const [activeCity, setActiveCity] = useState(HOME_CITY)
  const [quick, setQuick] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestId = useRef(0)

  // initial load: Kolkata + quick city cards
  useEffect(() => {
    const id = ++requestId.current
    getWeather(HOME_CITY)
      .then((res) => {
        if (id === requestId.current) setData(res)
      })
      .catch((e) => {
        if (id === requestId.current) setError(e.message)
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false)
      })

    Promise.all(
      QUICK_CITIES.map((c) =>
        fetchJson('weather', c)
          .then((r) => [c, r])
          .catch(() => [c, null])
      )
    ).then((entries) => setQuick(Object.fromEntries(entries)))
  }, [])

  async function loadCity(city) {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const res = await getWeather(city)
      if (id !== requestId.current) return
      setData(res)
      setActiveCity(city)
    } catch (e) {
      if (id !== requestId.current) return
      setError(e.message)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    const city = query.trim()
    if (!city) return
    loadCity(city)
  }

  function goHome() {
    setQuery('')
    loadCity(HOME_CITY)
  }

  const current = data?.current
  const tz = current?.timezone ?? 0
  const theme = current ? getTheme(current) : 'clear-day'
  const isHome = activeCity === HOME_CITY && !error

  return (
    <div className={`app theme-${theme}`}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <main className="container">
        <header className="topbar">
          <button className="brand" onClick={goHome} title="Back to Kolkata">
            <span className="brand-icon">🌤️</span>
            <span>Weather Dashboard</span>
          </button>
          <button className={`home-btn ${isHome ? 'active' : ''}`} onClick={goHome}>
            🏠 Home
          </button>
        </header>

        <form className="search" onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            placeholder="Search city (e.g. Chennai)"
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? '...' : 'Search'}
          </button>
        </form>

        <section className="quick">
          {QUICK_CITIES.map((c) => {
            const q = quick[c]
            const active = activeCity === c && !error
            return (
              <button
                key={c}
                className={`quick-card ${active ? 'active' : ''}`}
                onClick={() => loadCity(c)}
              >
                <span className="quick-name">{c.split(',')[0]}</span>
                {q ? (
                  <>
                    <img src={iconUrl(q.weather[0].icon)} alt="" />
                    <span className="quick-temp">{Math.round(q.main.temp)}°</span>
                    <span className="quick-desc">{titleCase(q.weather[0].description)}</span>
                  </>
                ) : (
                  <span className="quick-desc">Loading…</span>
                )}
              </button>
            )
          })}
        </section>

        {error && (
          <div className="error">
            <span>⚠️ {error}</span>
            <button onClick={goHome}>Back to Kolkata</button>
          </div>
        )}

        {current && (
          <div className={`stack ${loading ? 'dim' : ''}`}>
            <section className="card main-card">
              <div className="main-head">
                <h2>
                  {current.name}, {current.sys.country}
                </h2>
                <span className="local-time">
                  {localDate(current.dt, tz).toLocaleDateString('en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    timeZone: 'UTC',
                  })}
                </span>
              </div>

              <div className="hero">
                <img
                  className="hero-icon"
                  src={iconUrl(current.weather[0].icon, '4x')}
                  alt={current.weather[0].description}
                />
                <div>
                  <div className="temp">{Math.round(current.main.temp)}°C</div>
                  <div className="desc">{titleCase(current.weather[0].description)}</div>
                  <div className="feels">
                    Feels like {Math.round(current.main.feels_like)}°C · H{' '}
                    {Math.round(current.main.temp_max)}° / L {Math.round(current.main.temp_min)}°
                  </div>
                </div>
              </div>

              <div className="stats">
                <Stat icon="💧" label="Humidity" value={`${current.main.humidity}%`} />
                <Stat icon="💨" label="Wind speed" value={`${current.wind.speed.toFixed(2)} m/s`} />
                <Stat icon="🌡️" label="Pressure" value={`${current.main.pressure} hPa`} />
                <Stat
                  icon="👁️"
                  label="Visibility"
                  value={`${(current.visibility / 1000).toFixed(1)} km`}
                />
                <Stat icon="🌅" label="Sunrise" value={formatTime(current.sys.sunrise, tz)} />
                <Stat icon="🌇" label="Sunset" value={formatTime(current.sys.sunset, tz)} />
              </div>
            </section>

            <section className="card">
              <h3>Next hours</h3>
              <div className="hourly">
                {buildHourly(data.forecast).map((h) => (
                  <div className="hour" key={h.dt}>
                    <span className="hour-time">{h.time}</span>
                    <img src={iconUrl(h.icon)} alt="" />
                    <span className="hour-temp">{h.temp}°</span>
                    <span className="hour-pop">💧 {h.pop}%</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <h3>5-day forecast</h3>
              <ul className="daily">
                {buildDaily(data.forecast).map((d) => (
                  <li key={d.key}>
                    <span className="day-label">{d.label}</span>
                    <img src={iconUrl(d.icon)} alt="" />
                    <span className="day-desc">{titleCase(d.desc)}</span>
                    <span className="day-range">
                      <b>{d.max}°</b> <span>{d.min}°</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {!current && loading && <div className="card loading">Loading weather…</div>}
      </main>
    </div>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  )
}

export default App