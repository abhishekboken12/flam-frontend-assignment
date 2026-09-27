import { useMemo, useState } from 'react';
import { colorForId } from '../lib/cardColors.js';
import { TYPE_LABEL } from '../lib/cardTypes.js';
import { RibbonBadge } from './Illustrations.jsx';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, '')
    .replace(/\s+/g, ' ');
}

function parseTrueFalse(answerText) {
  const correct = /^true/i.test(answerText.trim());
  const reason = answerText.replace(/^(true|false)\s*:?\s*/i, '').trim();
  return { correct, reason };
}

/**
 * The answer widget for ONE card, keyed by card.id in the parent so
 * its internal state (selection, typed text, revealed/result)
 * resets automatically whenever the quiz moves to a new card.
 * Auto-graded types (truefalse, multiple, cloze) determine
 * correctness themselves; the open-ended "card" type falls back to
 * self-grading, since there's no reliable way to auto-check free text.
 */
function QuizAnswer({ card, onFinalize }) {
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState(null); // { correct: boolean, choice? }
  const [text, setText] = useState('');
  // Shuffled once per card (not on every re-render), and safe to call
  // even for card types that have no options — hooks must run
  // unconditionally on every render of this component.
  const shuffledOptions = useMemo(
    () => (Array.isArray(card.options) ? shuffle(card.options) : []),
    [card.id] // eslint-disable-line react-hooks/exhaustive-deps
  );

  function finish() {
    onFinalize(result.correct);
  }

  if (card.type === 'truefalse') {
    const { correct: correctBool, reason } = parseTrueFalse(card.answer);
    if (!result) {
      return (
        <div className="quiz-actions">
          <button className="btn btn-primary" onClick={() => setResult({ correct: true === correctBool, choice: true })}>
            True
          </button>
          <button className="btn btn-primary" onClick={() => setResult({ correct: false === correctBool, choice: false })}>
            False
          </button>
        </div>
      );
    }
    return (
      <div>
        <p className={`feedback ${result.correct ? 'feedback-correct' : 'feedback-wrong'}`}>
          {result.correct ? 'Correct — ' : `Not quite — it's ${correctBool ? 'True' : 'False'}. `}
          {reason}
        </p>
        <button className="btn btn-primary" onClick={finish}>
          Next card
        </button>
      </div>
    );
  }

  if (card.type === 'multiple' && Array.isArray(card.options)) {
    const options = shuffledOptions;
    if (!result) {
      return (
        <div className="options-grid">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className="option-btn"
              onClick={() => setResult({ correct: normalize(opt) === normalize(card.answer), choice: opt })}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }
    return (
      <div>
        <div className="options-grid">
          {options.map((opt) => {
            const isCorrectOpt = normalize(opt) === normalize(card.answer);
            const isChoice = opt === result.choice;
            const cls = isCorrectOpt ? 'option-btn option-correct' : isChoice ? 'option-btn option-wrong' : 'option-btn';
            return (
              <button key={opt} type="button" className={cls} disabled>
                {opt}
              </button>
            );
          })}
        </div>
        <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={finish}>
          Next card
        </button>
      </div>
    );
  }

  if (card.type === 'cloze') {
    if (!result) {
      return (
        <form
          className="cloze-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            setResult({ correct: normalize(text) === normalize(card.answer), auto: true });
          }}
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type the missing word…"
            autoFocus
          />
          <button type="submit" className="btn btn-primary" disabled={!text.trim()}>
            Check
          </button>
        </form>
      );
    }
    return (
      <div>
        <p className={`feedback ${result.correct ? 'feedback-correct' : 'feedback-wrong'}`}>
          {result.correct ? 'Correct!' : `Not quite — correct answer: "${card.answer}"`}
        </p>
        {!result.correct && (
          <p className="hint" style={{ marginBottom: 10 }}>
            Close enough / it's a fair synonym?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => setResult({ correct: true, override: true })}
            >
              Mark correct anyway
            </button>
          </p>
        )}
        <button className="btn btn-primary" onClick={finish}>
          Next card
        </button>
      </div>
    );
  }

  // Fallback: plain Q&A, self-graded — no reliable auto way to check free text.
  if (!revealed) {
    return (
      <button className="btn btn-primary" onClick={() => setRevealed(true)}>
        Show answer
      </button>
    );
  }
  if (!result) {
    return (
      <div className="quiz-actions">
        <button className="btn btn-correct" onClick={() => setResult({ correct: true })}>
          I knew it
        </button>
        <button className="btn btn-missed" onClick={() => setResult({ correct: false })}>
          Missed it
        </button>
      </div>
    );
  }
  return (
    <button className="btn btn-primary" onClick={finish}>
      Next card
    </button>
  );
}

/**
 * Quiz mode: one card at a time, answered according to its type
 * (see QuizAnswer above). At the end, offer to retest just the
 * missed cards — repeatable until none are missed.
 */
export default function QuizMode({ cards, onGrade }) {
  const [round, setRound] = useState(1);
  const [queue, setQueue] = useState(() => shuffle(cards));
  const [index, setIndex] = useState(0);
  const [missed, setMissed] = useState([]);
  const [gotCount, setGotCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = queue[index];
  const total = queue.length;
  const accent = current ? colorForId(current.id) : '#c98a2b';

  function grade(wasCorrect) {
    if (wasCorrect) setGotCount((n) => n + 1);
    else setMissed((m) => [...m, current]);
    onGrade?.(current.id, wasCorrect);

    if (index + 1 < total) {
      setIndex(index + 1);
    } else {
      setFinished(true);
    }
  }

  function retestMissed() {
    setQueue(shuffle(missed));
    setMissed([]);
    setGotCount(0);
    setIndex(0);
    setFinished(false);
    setRound((r) => r + 1);
  }

  function restartAll() {
    setQueue(shuffle(cards));
    setMissed([]);
    setGotCount(0);
    setIndex(0);
    setFinished(false);
    setRound(1);
  }

  const roundLabel = useMemo(() => (round === 1 ? 'Quiz' : `Retest · round ${round}`), [round]);

  if (finished) {
    return (
      <div className="quiz">
        <div className="quiz-summary">
          {missed.length === 0 && <RibbonBadge />}
          <p className="score">
            {gotCount} / {total}
          </p>
          <p>
            {missed.length === 0
              ? 'Clean sweep — nothing missed this round.'
              : `${missed.length} card${missed.length === 1 ? '' : 's'} to revisit.`}
          </p>

          {missed.length > 0 && (
            <ul className="missed-list">
              {missed.map((c) => (
                <li key={c.id}>{c.question}</li>
              ))}
            </ul>
          )}

          <div className="actions">
            {missed.length > 0 && (
              <button className="btn btn-primary" onClick={retestMissed}>
                Retest missed cards
              </button>
            )}
            <button className="btn btn-ghost" onClick={restartAll}>
              Restart full quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="quiz-progress">
        {roundLabel} · card {index + 1} of {total}
      </div>
      <div className="quiz-card" style={{ borderLeftColor: accent }}>
        <div className="badge-row">
          <span className="badge badge-type">{TYPE_LABEL[current.type] || 'Q&A'}</span>
          <span className={`badge badge-difficulty diff-${current.difficulty}`}>{current.difficulty}</span>
        </div>
        <p className="q">{current.question}</p>
      </div>

      <QuizAnswer key={current.id} card={current} onFinalize={grade} />
    </div>
  );
}
