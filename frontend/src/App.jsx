import { useEffect, useRef, useState } from 'react';
import PromptInput from './components/PromptInput.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorState from './components/ErrorState.jsx';
import ResultView from './components/ResultView.jsx';
import ExampleChips from './components/ExampleChips.jsx';
import HistoryList from './components/HistoryList.jsx';
import { PencilMark, EmptyDeckArt } from './components/Illustrations.jsx';
import { generateFlashcards, refineFlashcards, ApiError } from './lib/api.js';
import { parseAndValidate } from './lib/validateResult.js';
import { loadHistory, saveHistoryEntry, removeHistoryEntry, newId } from './lib/session.js';

export default function App() {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [studySet, setStudySet] = useState(null);
  const [error, setError] = useState(null); // { reason, message }
  const [lastTopic, setLastTopic] = useState('');
  const [sessionId, setSessionId] = useState(null);
  // { [cardId]: timesGottenRight } — survives across quiz rounds and
  // page refreshes, so a deck you keep coming back to visibly gets
  // "more mastered" instead of resetting.
  const [mastery, setMastery] = useState({});
  const [history, setHistory] = useState([]); // up to 4 most recent decks

  // Follow-up ("add more cards") request state, kept separate from
  // the main status so an error there doesn't blow away the deck
  // that's already on screen.
  const [refineStatus, setRefineStatus] = useState('idle'); // idle | loading | error
  const [refineError, setRefineError] = useState(null);

  const requestIdRef = useRef(0);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  function persist(id, set, masteryMap) {
    const entry = { id, topic: set.topic, studySet: set, mastery: masteryMap };
    setHistory(saveHistoryEntry(entry));
  }

  async function runGeneration(topic) {
    const id = ++requestIdRef.current;
    setLastTopic(topic);
    setStatus('loading');
    setError(null);

    try {
      const raw = await generateFlashcards(topic);
      if (id !== requestIdRef.current) return; // a newer request has since started

      const parsed = parseAndValidate(raw);
      if (!parsed.ok) {
        setError({ reason: parsed.reason });
        setStatus('error');
        return;
      }

      const sid = newId();
      setStudySet(parsed.data);
      setMastery({});
      setSessionId(sid);
      setStatus('success');
      persist(sid, parsed.data, {});
    } catch (err) {
      if (id !== requestIdRef.current) return;
      const reason = err instanceof ApiError ? err.reason : 'server';
      setError({ reason, message: err.message });
      setStatus('error');
    }
  }

  function openHistoryEntry(entry) {
    setStudySet(entry.studySet);
    setMastery(entry.mastery || {});
    setSessionId(entry.id);
    setStatus('success');
  }

  function deleteHistoryEntry(id) {
    setHistory(removeHistoryEntry(id));
  }

  function handleNewTopic() {
    setStatus('idle');
    setStudySet(null);
    setSessionId(null);
    setError(null);
    setRefineStatus('idle');
    setRefineError(null);
  }

  // Called by QuizMode every time a card is graded, right or wrong.
  function handleGrade(cardId, wasCorrect) {
    setMastery((prev) => {
      const next = { ...prev, [cardId]: wasCorrect ? (prev[cardId] || 0) + 1 : prev[cardId] || 0 };
      if (studySet && sessionId) persist(sessionId, studySet, next);
      return next;
    });
  }

  // Follow-up: ask the model for MORE cards on the open deck without
  // starting over. New cards are appended and deduped by question
  // text, through the same validation path as a fresh generation.
  async function handleRefine(instruction) {
    if (!studySet) return;
    setRefineStatus('loading');
    setRefineError(null);

    try {
      const existingQuestions = studySet.cards.map((c) => c.question);
      const raw = await refineFlashcards(studySet.topic || lastTopic, existingQuestions, instruction);
      const parsed = parseAndValidate(raw);
      if (!parsed.ok) {
        setRefineError({ reason: parsed.reason });
        setRefineStatus('error');
        return;
      }

      const existingKeys = new Set(studySet.cards.map((c) => c.question.trim().toLowerCase()));
      const newCards = parsed.data.cards.filter((c) => !existingKeys.has(c.question.trim().toLowerCase()));

      if (newCards.length === 0) {
        setRefineError({ reason: 'empty', message: 'The model only returned cards already in your deck.' });
        setRefineStatus('error');
        return;
      }

      const merged = { ...studySet, cards: [...studySet.cards, ...newCards] };
      setStudySet(merged);
      setRefineStatus('idle');
      if (sessionId) persist(sessionId, merged, mastery);
    } catch (err) {
      const reason = err instanceof ApiError ? err.reason : 'server';
      setRefineError({ reason, message: err.message });
      setRefineStatus('error');
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="wordmark">
          <PencilMark />
          <h1>Recall</h1>
          <span className="tag">study assistant</span>
        </div>
        <p>
          Paste your notes or name a topic. Recall turns it into flashcards you can flip through and
          quiz yourself on — no chat window, just the cards.
        </p>
      </header>

      <section className="panel">
        <div className="panel-inner">
          {status !== 'success' && (
            <>
              <PromptInput onSubmit={runGeneration} disabled={status === 'loading'} initialValue={lastTopic} />

              {status === 'idle' && history.length > 0 && (
                <HistoryList entries={history} onOpen={openHistoryEntry} onDelete={deleteHistoryEntry} />
              )}

              {status === 'idle' && <ExampleChips onPick={runGeneration} disabled={status === 'loading'} />}
              {status === 'loading' && <LoadingState />}
              {status === 'error' && (
                <ErrorState reason={error?.reason} message={error?.message} onRetry={() => runGeneration(lastTopic)} />
              )}
            </>
          )}

          {status === 'success' && studySet && (
            <ResultView
              studySet={studySet}
              onNewTopic={handleNewTopic}
              mastery={mastery}
              onGrade={handleGrade}
              onRefine={handleRefine}
              refineStatus={refineStatus}
              refineError={refineError}
            />
          )}
        </div>
      </section>

      {status === 'idle' && history.length === 0 && (
        <div className="empty-note">
          <EmptyDeckArt />
          <p>Nothing generated yet — describe what you want to study above, or pick an example.</p>
        </div>
      )}

      <footer className="app-footer">Built for the Flam frontend internship assignment.</footer>
    </div>
  );
}
