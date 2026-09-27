import { useState } from 'react';

/**
 * The only way the user gets information into the app: a free-form
 * text box describing what they want to study.
 */
export default function PromptInput({ onSubmit, disabled, initialValue = '' }) {
  const [value, setValue] = useState(initialValue);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
  }

  return (
    <form className="prompt-form" onSubmit={handleSubmit}>
      <label htmlFor="topic">Paste your notes, or name a topic</label>
      <textarea
        id="topic"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. the Krebs cycle, or paste a page of lecture notes…"
        disabled={disabled}
      />
      <div className="row">
        <span className="hint">We'll turn this into flashcards you can study and quiz yourself on.</span>
        <button type="submit" className="btn btn-primary" disabled={disabled || !value.trim()}>
          {disabled ? 'Generating…' : 'Generate flashcards'}
        </button>
      </div>
    </form>
  );
}
