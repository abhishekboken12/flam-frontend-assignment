const REQUEST_TIMEOUT_MS = 25000;

// In dev, this stays empty and Vite's proxy (vite.config.js) forwards
// '/api/...' to the local server — same-origin, no CORS involved. If
// the frontend is deployed separately from the server (different
// origin), set VITE_API_BASE_URL to the server's full URL, e.g.
// https://recall-api.onrender.com — see frontend/.env.example.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8787';

/**
 * Typed error so callers can branch on `err.reason` instead of
 * parsing message strings.
 * reason is one of: 'timeout' | 'network' | 'server'
 */
export class ApiError extends Error {
  constructor(reason, message) {
    super(message);
    this.name = 'ApiError';
    this.reason = reason;
  }
}

async function postJson(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('timeout', 'The request took too long and was cancelled.');
    }
    throw new ApiError('network', 'Could not reach the server. Check your connection and that the backend is running.');
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let detail = '';
    try {
      const errBody = await res.json();
      detail = errBody?.error || '';
    } catch {
      /* body wasn't JSON — ignore, we'll use the status text */
    }
    throw new ApiError('server', detail || `Server responded with ${res.status}.`);
  }

  const data = await res.json();
  return data.raw ?? '';
}

/**
 * Calls our own backend (never the LLM provider directly — the API
 * key lives only in server/index.js) and returns the model's raw
 * text response, unparsed. Parsing and validation is deliberately
 * left to validateResult.js so that step stays easy to point to and
 * test on its own.
 *
 * @param {string} topic
 * @returns {Promise<string>} raw model output
 */
export function generateFlashcards(topic) {
  return postJson('/api/generate', { topic });
}

/**
 * Asks the model for MORE cards on an existing deck, based on a
 * free-form follow-up instruction (e.g. "add 5 more on the Calvin
 * cycle", "make these harder"). Existing questions are sent along
 * so the model doesn't repeat itself. Returns raw text — same
 * validation path as generateFlashcards.
 *
 * @param {string} topic
 * @param {string[]} existingQuestions
 * @param {string} instruction
 * @returns {Promise<string>} raw model output
 */
export function refineFlashcards(topic, existingQuestions, instruction) {
  return postJson('/api/refine', { topic, existingQuestions, instruction });
}
