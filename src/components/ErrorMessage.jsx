export default function ErrorMessage({ message }) {
  return (
    <div className="error" role="alert">
      <span className="error-icon" aria-hidden="true">⚠️</span>
      <p className="error-text">{message}</p>
    </div>
  );
}