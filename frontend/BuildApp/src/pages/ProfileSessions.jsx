import React, { useEffect, useState } from 'react';
import { auth } from '../api';
import { navigate } from '../navigation';

function date(value) {
  return value ? new Date(value).toLocaleString() : 'Unknown';
}

export default function ProfileSessions({ sessions, onSessionsChange }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (sessions) return;
    let active = true;
    auth('sessions').then(response => {
      if (active) { onSessionsChange(response.data.sessions); setError(''); }
    }).catch(failure => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [revision, sessions]);

  async function revoke(id, current = false) {
    const all = id === null;
    if (!window.confirm(all ? 'Sign out on every device, including this one?' :
      current ? 'Sign out on this device?' : 'Sign out this device?')) return;
    setBusy(id || 'all');
    setError('');
    try {
      await auth(all ? 'sessions' : 'sessions/' + encodeURIComponent(id), undefined, 'DELETE');
      if (all || current) {
        window.dispatchEvent(new Event('vettly:logout'));
        navigate('/login', { replace: true });
      }
      else onSessionsChange(current => current.filter(session => session.id !== id));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy('');
    }
  }

  return <section className="profile-card profile-sessions">
    <div className="profile-card-heading"><div><p>SECURITY</p><h2>Active sessions</h2></div>
      <button onClick={() => { onSessionsChange(null); setRevision(value => value + 1); }} disabled={!!busy}>Refresh</button></div>
    <p className="profile-description">Review devices signed in to your account and end sessions you do not recognize.</p>
    {error && <p className="error" role="alert">{error}</p>}
    {!sessions && !error && <p role="status">Loading sessions…</p>}
    {sessions?.length === 0 && <p>No active sessions.</p>}
    {sessions && <ul className="profile-session-list">{sessions.map(session =>
      <li key={session.id}><div>
        <strong>{session.userAgent || 'Unknown browser'} {session.isCurrent && <span className="profile-current">This device</span>}</strong>
        <small>Last active {date(session.lastActiveAt)} · Signed in {date(session.createdAt)}</small>
        {session.ipAddress && <small>IP address {session.ipAddress}</small>}
      </div><button disabled={!!busy} onClick={() => revoke(session.id, session.isCurrent)}>
        {busy === session.id ? 'Signing out…' : 'Sign out'}</button></li>)}</ul>}
    {sessions?.length > 0 && <button className="profile-signout-all" disabled={!!busy} onClick={() => revoke(null)}>
      {busy === 'all' ? 'Signing out…' : 'Sign out on all devices'}</button>}
  </section>;
}
