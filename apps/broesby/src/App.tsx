export function App() {
  return (
    <main className="app-shell">
      <section className="gate-card" aria-label="Password gate">
        <p className="eyebrow">Private family hub</p>
        <h1>Broesby Family</h1>
        <label className="field">
          <span>Shared password</span>
          <input aria-label="Shared password" type="password" autoComplete="current-password" />
        </label>
      </section>
    </main>
  );
}
