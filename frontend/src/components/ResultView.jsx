import { useState } from 'react';
import FlashcardDeck from './FlashcardDeck.jsx';
import QuizMode from './QuizMode.jsx';
import FollowUpBox from './FollowUpBox.jsx';

/**
 * Everything here receives already-validated data (see
 * lib/validateResult.js). No raw model text is ever rendered
 * directly — only parsed cards driving real components.
 */
export default function ResultView({
  studySet,
  onNewTopic,
  mastery,
  onGrade,
  onRefine,
  refineStatus,
  refineError,
}) {
  const [mode, setMode] = useState('study');

  return (
    <div>
      <div className="result-header">
        <h2>{studySet.topic || 'Your flashcards'}</h2>
        <div className="tabs" role="tablist" aria-label="Study mode">
          <button
            className="tab"
            role="tab"
            aria-selected={mode === 'study'}
            onClick={() => setMode('study')}
          >
            Study
          </button>
          <button
            className="tab"
            role="tab"
            aria-selected={mode === 'quiz'}
            onClick={() => setMode('quiz')}
          >
            Quiz
          </button>
        </div>
      </div>

      {mode === 'study' ? (
        <FlashcardDeck cards={studySet.cards} mastery={mastery} />
      ) : (
        <QuizMode key={studySet.topic + studySet.cards.length} cards={studySet.cards} onGrade={onGrade} />
      )}

      <FollowUpBox onSubmit={onRefine} status={refineStatus} error={refineError} cardCount={studySet.cards.length} />

      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={onNewTopic}>
          Study something else
        </button>
      </div>
    </div>
  );
}
