const VALID_TYPES = new Set(['card', 'cloze', 'truefalse', 'multiple']);
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

/**
 * A "multiple" card is only trustworthy if it has at least 2 usable
 * options AND the answer text exactly matches one of them (so the
 * quiz can grade it deterministically). If either condition fails —
 * the model forgot options, gave duplicates, or the answer doesn't
 * match any option verbatim — we don't discard the card, we demote
 * it to a plain "card" (Q&A) and drop the options. This is the same
 * philosophy as the rest of this file: bad structure degrades to a
 * safer shape rather than reaching the UI broken.
 */
function normalizeCard(raw, index) {
  const question = raw.question.trim();
  const answer = raw.answer.trim();
  const requestedType = VALID_TYPES.has(raw.type) ? raw.type : 'card';
  const difficulty = VALID_DIFFICULTIES.has(raw.difficulty) ? raw.difficulty : 'medium';
  const id = `card-${index}-${question.slice(0, 12).replace(/\s+/g, '-')}`;

  if (requestedType === 'multiple') {
    const options = Array.isArray(raw.options)
      ? [...new Set(raw.options.filter((o) => typeof o === 'string' && o.trim()).map((o) => o.trim()))]
      : [];
    const answerIsAmongOptions = options.some((o) => o.toLowerCase() === answer.toLowerCase());

    if (options.length >= 2 && answerIsAmongOptions) {
      return { id, question, answer, type: 'multiple', difficulty, options };
    }
    // Fall through to plain Q&A — options were missing/invalid.
    return { id, question, answer, type: 'card', difficulty };
  }

  return { id, question, answer, type: requestedType, difficulty };
}

/**
 * Turns raw model text into either a clean StudySet or a typed
 * failure reason. Nothing downstream of this function ever touches
 * raw model output directly — see result.js for the shapes involved.
 *
 * Deliberately strict: a null/empty question or answer is dropped
 * rather than rendered, and if that leaves zero usable cards the
 * whole response is treated as an "empty" failure, not a valid
 * empty result. "type", "difficulty" and "options" are optional or
 * conditionally required on the model's side — see normalizeCard
 * for how an invalid value degrades safely instead of failing the
 * whole card.
 *
 * @param {string} raw
 * @returns {{ ok: true, data: import('../types/result.js').StudySet }
 *         | { ok: false, reason: 'empty' | 'malformed' | 'shape' }}
 */
export function parseAndValidate(raw) {
  if (raw === null || raw === undefined || typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, reason: 'empty' };
  }

  // Models asked for "JSON only" sometimes still wrap it in a code
  // fence. Strip that before parsing rather than failing on it.
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

  let data;
  try {
    data = JSON.parse(cleaned);
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  if (!data || typeof data !== 'object' || Array.isArray(data) || !Array.isArray(data.cards)) {
    return { ok: false, reason: 'shape' };
  }

  const cards = data.cards
    .filter(
      (c) =>
        c &&
        typeof c === 'object' &&
        typeof c.question === 'string' &&
        c.question.trim() &&
        typeof c.answer === 'string' &&
        c.answer.trim()
    )
    .map((c, i) => normalizeCard(c, i));

  if (cards.length === 0) {
    return { ok: false, reason: 'empty' };
  }

  return {
    ok: true,
    data: {
      topic: typeof data.topic === 'string' && data.topic.trim() ? data.topic.trim() : '',
      cards,
    },
  };
}
