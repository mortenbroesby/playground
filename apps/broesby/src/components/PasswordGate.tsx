import { useState, type FormEvent } from 'react';

type PasswordGateProps = {
  onUnlock: (password: string) => boolean;
};

export function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!onUnlock(password)) {
      setErrorMessage('That password does not match.');
      return;
    }

    setErrorMessage('');
  }

  return (
    <main className="app-shell">
      <form className="gate-card" aria-label="Password gate" onSubmit={handleSubmit}>
        <p className="eyebrow">Private family hub</p>
        <h1>Broesby Family</h1>
        <p className="gate-copy">
          A small family corner for stories, little updates, and quick notes.
        </p>
        <label className="field">
          <span>Shared password</span>
          <input
            aria-label="Shared password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
        </label>
        {errorMessage ? (
          <p className="error-message" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <button className="primary-button" type="submit">
          Enter site
        </button>
      </form>
    </main>
  );
}
