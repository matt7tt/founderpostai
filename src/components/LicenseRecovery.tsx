import { useState, type FormEvent } from 'react';

export default function LicenseRecovery() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage(''); setError('');
    try {
      const response = await fetch('/api/purchase/recover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }), signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Please try again shortly.');
      setMessage(data.message);
    } catch (error) { setError(error instanceof Error ? error.message : 'Please try again shortly.'); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="my-6 space-y-3 rounded-xl border border-black/15 bg-white p-5 text-left">
      <h2 className="text-xl font-semibold">Recover your license</h2>
      <label className="block text-sm">Email used at checkout
        <input type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} className="mt-2 block w-full rounded border border-black/25 px-3 py-2 text-black" />
      </label>
      <button type="submit" disabled={busy} className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Requesting…' : 'Email my purchase links'}</button>
      {message && <p role="status" className="text-sm">{message}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
