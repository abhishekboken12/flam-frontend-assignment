import { useState } from 'react';

const SUGGESTIONS = ['Add 5 more cards', 'Make it harder', 'Cover an edge case I might have missed'];

/**
 * Sends a free-form follow-up instruction (e.g. "add 5 more on the
 * Calvin cycle") that asks the model for MORE cards on the same
 * deck, rather than regenerating from scratch. New cards are merged
 * in by App.jsx via the same validation path as a fresh generation.
 */
export default function FollowUpBox({ onSubmit, status, error, cardCount }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const loading = status === 'loading';

  function submit(instruction) {
    const trimmed = instruction.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
    setValue('');
  }

  if (!open) {
    return (
      <div className="followup-toggle-row">
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
          + Add more to this deck
        </button>
      </div>
    );
  }

  return (
    <div className="followup">
      <div className="followup-header">
        <span className="hint">Follow up on these {cardCount} cards — ask for more, harder, or narrower.</span>
      </div>

      <form
        className="followup-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. add 5 more on the Calvin cycle…"
          disabled={loading}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !value.trim()}>
          {loading ? 'Adding…' : 'Add'}
        </button>
      </form>

      <div className="chip-row">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="chip" onClick={() => submit(s)} disabled={loading}>
            {s}
          </button>
        ))}
      </div>

      {status === 'error' && (
        <p className="followup-error">
          {error?.reason === 'empty' && !error?.message
            ? "No new cards came back — try a different instruction."
            : error?.message || "That follow-up didn't go through — try again."}
        </p>
      )}
    </div>
  );
}
