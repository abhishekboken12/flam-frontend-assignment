# Recall — a study-assistant flashcard app

Built for the Flam frontend internship assignment. You paste notes or name a topic,
Recall turns it into a deck of flashcards, and you can flip through them or take a
self-graded quiz that retests whatever you missed. No chat window — the model's
output is parsed into structured data and rendered as real interactive components.

### 🚀 Live Demo
https://flam-frontend-assignment-indol.vercel.app/

## How it works

1. You type a topic or paste notes into the free-form input.
2. The browser calls **our own backend** (`server/index.js`), never the LLM provider directly.
3. The backend holds the API key and forwards your text to Groq's `chat/completions`
   endpoint (OpenAI-compatible, free tier), asking for JSON-only output.
4. The backend returns the model's **raw text**, unparsed, to the frontend.
5. `src/lib/validateResult.js` parses and structurally validates that text. Anything
   that isn't valid JSON in the right shape is routed to an error state — never to
   a blank render or a crash.
6. Once validated, `App.jsx` holds the clean `{ topic, cards }` data in state and
   `ResultView` renders it as either a flip-card deck (**Study**) or a self-graded
   quiz with a retest-missed-cards loop (**Quiz**).


## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

1. How To Use 

From your command line, clone and run developerFolio:

```bash
1. #Clone this repository
git clone https://github.com/abhishekboken12/flam-frontend-assignment.git

2. #Go into the repository
cd flam-frontend-assignment


3. #Copy env.example to .env
cp server/.env.example server/.env
cp frontend/.env.example frontend/.env

4. #Inside the .env file of server, add Grop api key from 'https://console.groq.com', Groq model, port no and cors origin which is frontend url

```env
// .env
GROQ_API_KEY=YOUR_GROQ_API_KEY
GROQ_MODEL=openai/gpt-oss-120b
PORT=8787
CORS_ORIGIN=YOUR_RUNNING_FRONTEND_URL (eg: http://localhost:5173)
```

5. #Inside the .env file of Client, add VITE_API_BASE_UR

```env
//.env
VITE_API_BASE_URL=YOUR_DEPLOYED_OR_RUNNING_FRONTEND_URL (eg : http://localhost:5173)
```

6. # Install dependencies
npm install

7. # Install all dependencies
npm run install:all 

8. # Start a local dev server
npm run dev
```




## Features beyond the core requirement

- **Four card types** — the model mixes plain Q&A, fill-in-the-blank (cloze), and
  true/false statements in one deck (`type` field).
- **Difficulty tags** — each card carries `"easy" | "medium" | "hard"`, shown as a
  colored badge, with the same safe-fallback validation as `type`.
- **Mastery tracking** — every quiz answer is recorded per-card
  (`{ [cardId]: timesGottenRight }`), shown as a small dot indicator in Study
  mode, and persisted so it survives a refresh.
- **Resume last 4 decks** — every deck you generate is saved to `localStorage`
  (`src/lib/session.js`), capped at the 4 most recent. The idle screen lists
  them with card count, mastered-count, and "time ago"; opening one restores
  its cards and mastery exactly where you left off, and each can be removed
  individually.
- **Follow-up / "add more" box** — once a deck is open, a small input lets you
  ask for more cards without starting over ("add 5 more on X", "make it
  harder"). This hits a second backend route, `POST /api/refine`, which sends
  the existing questions back to the model as context (so it doesn't repeat
  itself) and returns only new cards; those are deduped by question text and
  merged into the open deck through the exact same `validateResult.js` path as
  a fresh generation.
- **Original SVG illustrations** — the header mark and empty-state art are
  hand-drawn inline SVG, not external image requests — nothing to fail to load,
  nothing borrowed.

## Quiz interaction per question type

Each of the 4 card types is answered differently — this isn't cosmetic, it's what
"Handling bad AI output" and "AI integration & data handling" are actually testing:

| Type | How you answer | Grading |
|---|---|---|
| **Q&A** (`card`) | Click "Show answer", then self-report I knew it / Missed it | Self-graded — no reliable way to auto-check free text |
| **True / False** (`truefalse`) | Click True or False | Auto-graded against the parsed answer, with the model's one-sentence reason shown after |
| **Multiple choice** (`multiple`) | Click one of 4 shuffled options | Auto-graded; correct + your choice are both highlighted after |
| **Fill in the blank** (`cloze`) | Type the missing word, click Check | Auto-graded with normalized (case/punctuation-insensitive) matching, plus a "mark correct anyway" override for fair synonyms |

**Safety net:** a `"multiple"` card is only trusted if the model actually supplied
≥2 usable options AND the answer exactly matches one of them (`normalizeCard` in
`validateResult.js`). If either check fails, the card is silently demoted to a
plain Q&A card rather than rendering broken options — same "degrade safely"
philosophy as the rest of the validation layer.

## Data shape

Designed before any prompting, in `src/types/result.js`:

```json
{
  "topic": "The Krebs cycle",
  "cards": [
    {
      "type": "card",
      "difficulty": "medium",
      "question": "Where does the Krebs cycle take place?",
      "answer": "The mitochondrial matrix."
    },
    {
      "type": "cloze",
      "difficulty": "easy",
      "question": "The Krebs cycle is also known as the _____ acid cycle.",
      "answer": "citric"
    },
    {
      "type": "truefalse",
      "difficulty": "hard",
      "question": "The Krebs cycle directly requires oxygen as a reactant.",
      "answer": "False: it's the electron transport chain that directly requires oxygen; the Krebs cycle depends on it indirectly."
    }
  ]
}
```

**Swapping providers:** all provider-specific code lives in one place —
`server/index.js`. To use OpenAI, Anthropic, OpenRouter, or a local Ollama model
instead of Groq, replace the single `fetch(...)` call in that file with the
equivalent request for your provider; nothing else in the app needs to change,
since the frontend only ever sees `{ raw: "<model text>" }`.

## Project structure

```
src/
  components/
    PromptInput.jsx     free-form text input
    ResultView.jsx      routes parsed data to Study/Quiz, tab switcher
    FlashcardDeck.jsx   Study mode — flip through cards
    QuizMode.jsx         Quiz mode — self-graded, retest-missed loop
    ErrorState.jsx       shared error/retry UI for every failure mode
    LoadingState.jsx
  lib/
    api.js               calls the backend proxy, never the LLM directly; 25s client timeout
    validateResult.js     parses + structurally validates raw model text
  types/
    result.js             JSDoc shapes for raw vs. validated data
  App.jsx                  state machine (idle/loading/success/error) + stale-response guard
server/
  index.js                 holds the API key, calls Groq (/api/generate + /api/refine), 20s upstream timeout
```

## Failure modes handled

| Case | Where | Behavior |
|---|---|---|
| Malformed JSON | `validateResult.js` | caught by `try/catch` around `JSON.parse`, routed to error state with retry |
| Wrong shape (valid JSON, missing/bad fields) | `validateResult.js` | structural check on `cards` array and each card's fields, not assumed |
| Empty response | `validateResult.js` | zero usable cards after filtering is treated as failure, not a valid empty result |
| Slow response | `lib/api.js` (25s) + `server/index.js` (20s) | `AbortController` timeouts at both layers; loading state shown until then |
| Failed request (network/5xx) | `lib/api.js`, `App.jsx` | typed `ApiError`, mapped to a specific message, never a crash |
| Stale response | `App.jsx` | a `requestId` ref means a slow earlier request can never overwrite a newer one |

## AI-usage note

I used Claude to help scaffold this project — generating the initial component
boilerplate, the CSS design system, and the README structure — and iterated on
the failure-handling logic, the quiz retest state machine, and the visual design
myself. All code was reviewed and understood before submission; I can walk
through and modify any part of it live.

## Known limitations

- Only Groq is wired up out of the box; other providers need the one-file swap
  described above.
- Groq periodically deprecates/decommissions model IDs (e.g. `llama-3.3-70b-versatile`
  was retired on 2026-09-21). If `/api/generate` starts returning a `model_not_found`
  404, set `GROQ_MODEL` in `.env` to whatever Groq currently recommends at
  https://console.groq.com/docs/deprecations — no code change needed.
- The quiz's "correct/missed" judging is self-reported (the user marks their own
  answer), not model-graded — a deliberate choice, since grading free-text answers
  reliably would need its own structured-output round trip and was out of scope
  for the ~8 hour budget.
- No persistence: refreshing the page loses the current deck (see Stretch Goals
  in the assignment — "save and reload sessions" was left for later).
- Not deployed; run locally per the setup steps above.

## Time spent

~ 8 hours.
