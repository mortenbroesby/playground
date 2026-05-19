import { useEffect, useState } from 'react';

type DisplayNameDialogProps = {
  opened: boolean;
  initialValue: string;
  onSave: (value: string) => void;
};

export function DisplayNameDialog({
  opened,
  initialValue,
  onSave,
}: DisplayNameDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  if (!opened) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog-card" aria-label="Display name dialog">
        <p className="eyebrow">First time here in this browser</p>
        <h2>Choose a display name</h2>
        <p className="dialog-copy">This name will be used for anecdotes and chat messages.</p>
        <label className="field">
          <span>Display name</span>
          <input
            aria-label="Display name"
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
          />
        </label>
        <button
          className="primary-button"
          type="button"
          onClick={() => onSave(value)}
        >
          Save name
        </button>
      </section>
    </div>
  );
}
