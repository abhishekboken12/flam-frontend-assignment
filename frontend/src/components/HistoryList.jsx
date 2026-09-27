import { colorForId } from '../lib/cardColors.js';

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/**
 * Your last up-to-4 decks, newest first. Each one reopens exactly
 * where you left off — same cards, same mastery counts.
 */
export default function HistoryList({ entries, onOpen, onDelete }) {
  if (!entries.length) return null;

  return (
    <div className="history">
      <div className="history-label">Recent decks</div>
      <ul className="history-list">
        {entries.map((entry) => {
          const accent = colorForId(entry.id);
          const masteredCount = Object.values(entry.mastery || {}).filter((n) => n > 0).length;
          return (
            <li key={entry.id} className="history-item" style={{ borderLeftColor: accent }}>
              <button type="button" className="history-open" onClick={() => onOpen(entry)}>
                <span className="history-topic">{entry.studySet.topic || 'Untitled deck'}</span>
                <span className="history-meta">
                  {entry.studySet.cards.length} cards
                  {masteredCount > 0 ? ` · ${masteredCount} mastered` : ''} · {timeAgo(entry.savedAt)}
                </span>
              </button>
              <button
                type="button"
                className="history-delete"
                onClick={() => onDelete(entry.id)}
                aria-label={`Remove ${entry.studySet.topic || 'this deck'} from history`}
                title="Remove"
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
