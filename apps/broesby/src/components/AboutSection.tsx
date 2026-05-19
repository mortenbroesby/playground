export function AboutSection() {
  return (
    <div className="stack">
      <div>
        <p className="eyebrow">About</p>
        <h2 className="section-title">A small place for family bits and pieces</h2>
      </div>
      <p className="body-copy">
        This little site is for the Broesby family: anecdotes worth keeping, quick
        notes for one another, and a quiet place to collect small memories.
      </p>
      <div className="info-grid">
        <article className="info-card">
          <h3>Why it exists</h3>
          <p>
            To keep family stories and practical chatter somewhere calmer than a
            group thread.
          </p>
        </article>
        <article className="info-card">
          <h3>How it works</h3>
          <p>
            Everything is saved only in the browser you are using right now. It is
            intentionally simple.
          </p>
        </article>
        <article className="info-card">
          <h3>What to add</h3>
          <p>
            Small stories, reminders, plans, jokes, and the sort of details that
            would otherwise disappear.
          </p>
        </article>
      </div>
    </div>
  );
}
