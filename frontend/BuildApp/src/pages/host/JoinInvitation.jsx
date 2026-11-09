import React, { useState } from 'react';
import { navigate } from '../../navigation';

export function invitationPath(value, origin) {
  const input = value.trim();
  if (!input) return null;
  if (/^[a-zA-Z0-9_-]{8,100}$/.test(input)) return '/interviews/' + encodeURIComponent(input) + '/join';
  try {
    const url = new URL(input);
    if (url.origin !== origin || !/^\/interviews\/[^/]+\/join\/?$/.test(url.pathname)) return null;
    return url.pathname;
  } catch {
    return null;
  }
}

export default function JoinInvitation() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  function join(event) {
    event.preventDefault();
    const path = invitationPath(input, location.origin);
    if (!path) {
      setError('Paste a Vettly invitation link or enter an interview ID.');
      return;
    }
    navigate(path);
  }
  return <section className="candidate-join">
    <div><p>HAVE AN INVITATION?</p><h2>Join an interview</h2>
      <span>Paste the link shared by your host to see the interview before you begin.</span></div>
    <form onSubmit={join}><label htmlFor="candidate-invitation">Invitation link or interview ID</label>
      <div><input id="candidate-invitation" value={input} onChange={event => { setInput(event.target.value); setError(''); }}
        placeholder="https://…/interviews/…/join" autoComplete="off" required/>
        <button type="submit">Open invitation ↗</button></div>
      {error && <p role="alert">{error}</p>}
    </form>
  </section>;
}
