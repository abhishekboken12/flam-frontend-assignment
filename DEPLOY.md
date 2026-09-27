# Deploying Recall

`frontend/` and `server/` are independent projects — deploy them as **two
separate services**. This is the natural fit for the split repo structure:
a static host for the React build, a persistent Node process for the API.

## 1. Deploy the server (Express API)

Works on Render, Railway, Fly.io, or any VPS — anywhere that runs a
persistent Node process. Steps below use Render as the example; Railway is
nearly identical.

1. Push this repo to GitHub.
2. On https://render.com → **New → Web Service** → connect the repo.
3. Settings:
   - **Root directory:** `server`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Node version:** 18.11+ (already set via `engines` in `server/package.json`)
4. Add environment variables:
   - `GROQ_API_KEY` = your key (https://console.groq.com/keys)
   - `CORS_ORIGIN` = your frontend's URL once you have it from step 2 below
     (you can come back and set this after deploying the frontend)
5. Deploy. Render gives you a `https://<name>.onrender.com` URL — that's your
   API base URL, needed in step 2.

Free tier note: the service sleeps after inactivity and takes ~30-60s to wake
on the next request — expected, not a bug, if the first request after a
while seems to hang.

### Any VPS / your own server

```bash
git clone <your-repo>
cd server
npm install
GROQ_API_KEY=your_key CORS_ORIGIN=https://your-frontend-domain npm start
```

Put a reverse proxy (nginx, Caddy) in front for HTTPS and a real domain if
you want one; the app itself just needs the port it's listening on (`PORT`
env var, default 8787) reachable.

## 2. Deploy the frontend (static React build)

Works on Vercel, Netlify, Cloudflare Pages, or any static host. Steps below
use Vercel as the example.

1. On https://vercel.com → **Add New → Project** → import the repo.
2. Settings:
   - **Root directory:** `frontend`
   - **Framework preset:** Vite (auto-detected)
   - **Build command:** `npm run build` (default)
   - **Output directory:** `dist` (default)
3. Add an environment variable: `VITE_API_BASE_URL` = your server's URL from
   step 1 (e.g. `https://recall-api.onrender.com`, no trailing slash).
4. Deploy. Vercel gives you a `https://<project>.vercel.app` URL.
5. Go back to the server's environment variables (step 1) and set
   `CORS_ORIGIN` to this URL, then redeploy the server so it accepts requests
   from it.

## Option: single combined deploy instead

If you'd rather ship one service instead of two, `server/index.js` can serve
the built frontend itself:

```bash
cd frontend && npm install && npm run build   # produces frontend/dist
cd ../server && npm install
GROQ_API_KEY=your_key npm start
```

`server/index.js` detects `frontend/dist` and serves it directly (with a SPA
fallback so refreshing on any route still works), so you only need to deploy
`server/` — point your Render/Railway/VPS build command at both installs and
the frontend build, e.g. on Render:
- **Build command:** `npm install --prefix ../frontend && npm run build --prefix ../frontend && npm install`
- **Start command:** `npm start`

This skips `VITE_API_BASE_URL` and `CORS_ORIGIN` entirely, since everything
is same-origin.

## Sanity-checking a deploy

Once it's up:
- Open the frontend URL — you should see the Recall UI, not a blank page.
- Generate a deck — confirms `GROQ_API_KEY` is set and the model call works.
- Open the browser console while generating — a CORS error here means
  `CORS_ORIGIN` on the server doesn't match the frontend's actual URL.
- Refresh mid-quiz — on the combined-deploy option, this confirms the SPA
  fallback route in `server/index.js` is serving `index.html` correctly
  instead of 404ing.

## What NOT to do

- **Don't point `VITE_API_BASE_URL` at a URL with a trailing slash** —
  `src/lib/api.js` concatenates it directly with paths like `/api/generate`;
  a trailing slash produces `...com//api/generate`.
- **Don't deploy the frontend without setting `VITE_API_BASE_URL`** unless
  you're using the combined single-service option above — without it, the
  deployed frontend will try to call relative `/api/...` paths on its own
  static-hosting origin, which has no server behind it, and generation will
  fail with a network error.
- **Don't forget to update `CORS_ORIGIN`** after the frontend's URL changes
  (a new Vercel preview URL, a custom domain, etc.) — the server rejects
  requests from origins not in that list.
