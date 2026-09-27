// Shared between server/index.js (Express — for Render/Railway/a VPS) and
// api/*.js (Vercel serverless functions). One source of truth for the
// prompts and the upstream call, so the two deployment targets can't drift
// out of sync with each other.

export const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
export const UPSTREAM_TIMEOUT_MS = 20000;

const SHAPE_RULES = `{
  "topic": string,
  "cards": [
    {
      "type": "card" | "cloze" | "truefalse" | "multiple",
      "difficulty": "easy" | "medium" | "hard",
      "question": string,
      "answer": string,
      "options": string[]   // ONLY include this key when type is "multiple"
    }
  ]
}

Card-type rules:
- "card": question is a normal question, answer is 1-2 concrete sentences.
- "cloze": question is a sentence with ONE blank written as "_____", answer is just the missing word or short phrase.
- "truefalse": question is a statement that is either true or false, answer is exactly "True" or "False" followed by a colon and a one-sentence reason, e.g. "False: mitochondria are not part of the nucleus."
- "multiple": question is a normal question, "options" is an array of exactly 4 short, mutually-exclusive answer choices (one correct, three plausible wrong ones), and "answer" must be copied character-for-character from one of the "options" strings. Do not include "options" for any other type.
- Each question tests ONE discrete fact or concept.
- Do not include any key other than "type", "difficulty", "topic", "question", "answer", "options".
- Do not wrap the JSON in a code fence. Output raw JSON only.`;

export const GENERATE_SYSTEM_PROMPT = `You are a study-flashcard generator.
Return ONLY valid JSON, no prose, no markdown code fences, matching exactly this shape:
${SHAPE_RULES}

- Produce between 8 and 14 cards, with a mix of all four types (not just "card").
- Vary difficulty realistically across the set — don't mark everything "medium".
- Base the cards only on the user's input.`;

export const REFINE_SYSTEM_PROMPT = `You are extending an existing study-flashcard deck based on a follow-up
instruction from the user. Return ONLY valid JSON, no prose, no markdown code
fences, matching exactly this shape:
${SHAPE_RULES}

- Return ONLY brand-new cards that satisfy the follow-up instruction — do not
  repeat any question that already exists in the deck (the existing questions
  are listed for you below; treat them as off-limits duplicates).
- Produce between 3 and 8 new cards unless the instruction clearly asks for a
  different amount.
- Stay on the same topic as the existing deck unless the instruction says otherwise.`;

/**
 * Shared Groq call. Returns { raw } on success or { error, status } on
 * failure — callers (Express route handlers or Vercel function handlers)
 * just forward whichever shape they get, so the HTTP-framework-specific
 * code around this stays trivial in both places.
 */
export async function callGroq(messages, apiKey) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages,
      }),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return { error: `LLM provider error (${upstream.status}): ${text.slice(0, 200)}`, status: 502 };
    }

    const data = await upstream.json();
    // We deliberately do NOT parse/validate the model's JSON here.
    // Parsing and validation happen client-side (src/lib/validateResult.js)
    // so that step stays visible and testable on its own, and so a
    // provider that ignores json_object mode still gets the same
    // defensive handling as one that doesn't.
    return { raw: data?.choices?.[0]?.message?.content ?? '' };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { error: 'Upstream LLM request timed out.', status: 504 };
    }
    return { error: err.message || 'Unexpected server error.', status: 500 };
  } finally {
    clearTimeout(timer);
  }
}
