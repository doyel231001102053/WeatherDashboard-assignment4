import { useState } from "react";

export default function SearchBar({ onSearch, loading }) {
  const [city, setCity] = useState("");

  // A form makes the Enter key work automatically
  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = city.trim();
    if (!trimmed) return; // ignore empty or spaces-only input
    onSearch(trimmed);
  }

  return (
    <form className="search" onSubmit={handleSubmit}>
      <label htmlFor="city-input" className="sr-only">
        Search by city
      </label>
      <input
        id="city-input"
        className="search-input"
        type="text"
        placeholder="Search city (e.g. Mumbai)"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        autoComplete="off"
      />
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Searching…" : "Search"}
      </button>
    </form>
  );
}