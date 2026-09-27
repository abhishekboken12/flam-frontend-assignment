import { DECK_PALETTE } from '../lib/cardColors.js';

const EXAMPLES = ['The water cycle', 'Causes of World War I', 'JavaScript closures', 'The Krebs cycle'];

/**
 * One-click starting points so the idle state is an invitation to
 * act, not just an empty box. Colors cycle through the same deck
 * palette the cards themselves use, so it reads as one system.
 */
export default function ExampleChips({ onPick, disabled }) {
  return (
    <div className="chip-row">
      {EXAMPLES.map((topic, i) => {
        const color = DECK_PALETTE[i % DECK_PALETTE.length].hex;
        return (
          <button
            key={topic}
            type="button"
            className="chip"
            style={{ '--chip-color': color }}
            onClick={() => onPick(topic)}
            disabled={disabled}
          >
            {topic}
          </button>
        );
      })}
    </div>
  );
}
