import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { callGroq, GENERATE_SYSTEM_PROMPT, REFINE_SYSTEM_PROMPT } from './lib/groq.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// The frontend is now a sibling project, not a subfolder of this one —
// server/../frontend/dist, built independently via `npm run build`
// inside frontend/.
const DIST_DIR = path.join(__dirname, '..', 'frontend', 'dist');
const HAS_BUILD = fs.existsSync(path.join(DIST_DIR, 'index.html'));

const app = express();

// In dev, the frontend runs on its own origin (Vite, :5173) and calls
// this server directly, so CORS has to be explicit rather than
// same-origin. CORS_ORIGIN defaults to the Vite dev server; set it to
// your deployed frontend's URL in production. Comma-separate multiple
// origins if you need more than one.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));

app.use(express.json({ limit: '256kb' }));

const PORT = process.env.PORT || 8787;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post('/api/generate', async (req, res) => {
  const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : '';

  if (!topic) {
    return res.status(400).json({ error: 'A non-empty "topic" string is required.' });
  }
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Server is missing GROQ_API_KEY. Add it to server/.env (see server/.env.example).' });
  }

  const result = await callGroq(
    [
      { role: 'system', content: GENERATE_SYSTEM_PROMPT },
      { role: 'user', content: `Make flashcards for:\n\n${topic}` },
    ],
    GROQ_API_KEY
  );

  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.json({ raw: result.raw });
});

app.post('/api/refine', async (req, res) => {
  const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : '';
  const instruction = typeof req.body?.instruction === 'string' ? req.body.instruction.trim() : '';
  const existingQuestions = Array.isArray(req.body?.existingQuestions)
    ? req.body.existingQuestions.filter((q) => typeof q === 'string').slice(0, 60)
    : [];

  if (!topic || !instruction) {
    return res.status(400).json({ error: 'Both "topic" and "instruction" are required.' });
  }
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Server is missing GROQ_API_KEY. Add it to server/.env (see server/.env.example).' });
  }

  const userMessage = [
    `Existing deck topic: ${topic}`,
    existingQuestions.length ? `Existing questions (do not repeat):\n- ${existingQuestions.join('\n- ')}` : 'No existing questions yet.',
    `Follow-up instruction: ${instruction}`,
  ].join('\n\n');

  const result = await callGroq(
    [
      { role: 'system', content: REFINE_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    GROQ_API_KEY
  );

  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.json({ raw: result.raw });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Optional convenience: if the frontend has been built (frontend/dist
// exists), serve it from this same process so a single deploy can host
// both. This is entirely optional — the two projects run independently
// either way, and in local dev (`npm run dev` at the repo root) Vite
// serves the frontend on :5173 and this block is simply skipped.
if (HAS_BUILD) {
  app.use(express.static(DIST_DIR));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Recall backend listening on http://localhost:${PORT}`);
  console.log(`Allowing requests from: ${allowedOrigins.join(', ')}`);
  if (!HAS_BUILD) {
    console.log('No frontend/dist build found — serving API only (expected during local dev).');
  }
  if (!GROQ_API_KEY) {
    console.warn('⚠️  GROQ_API_KEY is not set — requests will fail until you add it to server/.env');
  }
});
