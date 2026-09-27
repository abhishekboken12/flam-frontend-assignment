import { useEffect, useState } from 'react';
import { colorForId } from '../lib/cardColors.js';
import { TYPE_LABEL } from '../lib/cardTypes.js';

/**
 * Browse mode: flip the current card to reveal its answer, step
 * through the deck. Driven entirely by React state — nothing here
 * re-prints model text into a chat log.
 */
export default function FlashcardDeck({ cards, mastery = {} }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];
  const accent = colorForId(card.id);
  const timesRight = mastery[card.id] || 0;

  function goTo(next) {
    setFlipped(false);
    setIndex(Math.max(0, Math.min(cards.length - 1, next)));
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') goTo(index + 1);
      if (e.key === 'ArrowLeft') goTo(index - 1);
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <div className="deck">
      <div className="badge-row">
        <span className="badge badge-type">{TYPE_LABEL[card.type] || 'Q&A'}</span>
        <span className={`badge badge-difficulty diff-${card.difficulty}`}>{card.difficulty}</span>
        {timesRight > 0 && (
          <span className="badge badge-mastery" title={`Answered correctly ${timesRight} time(s) in quiz mode`}>
            {'●'.repeat(Math.min(timesRight, 3))} mastered
          </span>
        )}
      </div>

      <div className="card-scene">
        <div
          className={`flip-card${flipped ? ' flipped' : ''}`}
          onClick={() => setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          aria-label={flipped ? 'Showing answer, click to show question' : 'Showing question, click to reveal answer'}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setFlipped((f) => !f);
          }}
        >
          <div className="flip-face front" style={{ borderLeftColor: accent }}>
            <span className="eyebrow" style={{ color: accent }}>
              question
            </span>
            <span className="body-text">{card.question}</span>
          </div>
          <div className="flip-face back" style={{ borderLeftColor: accent }}>
            <span className="eyebrow" style={{ color: accent }}>
              answer
            </span>
            <span className="body-text">{card.answer}</span>
          </div>
        </div>
      </div>

      <div className="deck-controls">
        <button className="icon-btn" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous card">
          ‹
        </button>
        <span className="count">
          {index + 1} / {cards.length}
        </span>
        <button
          className="icon-btn"
          onClick={() => goTo(index + 1)}
          disabled={index === cards.length - 1}
          aria-label="Next card"
        >
          ›
        </button>
      </div>
      <span className="deck-hint">Click the card to flip it · ← → to move, space to flip</span>
    </div>
  );
}
