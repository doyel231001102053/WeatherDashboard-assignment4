export default function Spinner() {
  return (
    <div className="card spinner-wrap" role="status">
      <div className="spinner" aria-hidden="true"></div>
      <p className="spinner-text">Fetching weather…</p>
    </div>
  );
}