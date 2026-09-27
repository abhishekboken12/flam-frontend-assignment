const COPY = {
  malformed: {
    title: "That didn't come back as valid JSON",
    body: 'The model returned something our parser could not read. This happens occasionally, especially with smaller local models — try again.',
  },
  shape: {
    title: "That didn't come back in the shape we asked for",
    body: 'The response was valid JSON but was missing the fields we need. Try again, or try a narrower topic.',
  },
  empty: {
    title: 'No usable flashcards came back',
    body: "The model returned an empty result. That's treated as a failure, not a valid (if boring) answer.",
  },
  timeout: {
    title: 'That took too long',
    body: "The request didn't come back within 25 seconds, so we stopped waiting rather than hang indefinitely.",
  },
  network: {
    title: "Couldn't reach the server",
    body: 'Check your connection, and make sure the backend (npm run dev:server) is running.',
  },
  server: {
    title: 'The request failed',
    body: 'The backend reported a problem generating your flashcards.',
  },
};

export default function ErrorState({ reason = 'server', message, onRetry }) {
  const copy = COPY[reason] || COPY.server;
  return (
    <div className="error-state" role="alert">
      <div className="title">{copy.title}</div>
      <p>
        {copy.body}
        {message ? ` (${message})` : ''}
      </p>
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
