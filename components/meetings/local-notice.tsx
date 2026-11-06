export function LocalAccessNotice() {
  return (
    <aside className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
      Your account can access only its own meetings. Use synthetic data in this
      lab. Transcript and review text are encrypted in the database and
      decrypted by this server. Titles, codes, ownership, and timestamps remain
      plaintext. This is encryption at rest, not end-to-end encryption.
    </aside>
  );
}
export function DatabaseUnavailable() {
  return (
    <p
      role="alert"
      className="my-6 rounded-xl border border-red-200 p-5 text-red-800"
    >
      The meeting database is unavailable. Check the local configuration and
      reload to retry.
    </p>
  );
}
