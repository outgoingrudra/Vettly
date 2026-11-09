import React, { useEffect, useState } from 'react';
import { auth, uploadProfileFile } from '../api';
import ProfileSessions from './ProfileSessions';
import { navigate } from '../navigation';
import './account.css';

export default function Account({ user, profile, onProfileChange, onUserChange, sessions, onSessionsChange, onPictureChange }) {
  const [busy, setBusy] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user.name);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (profile) return;
    let active = true;
    auth('profiles/' + encodeURIComponent(user.id)).then(response => {
      if (active) { onProfileChange(response.data); onPictureChange(response.data.profilePicture); setError(''); }
    }).catch(failure => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [user.id, revision, profile]);

  async function run(action, callback) {
    if (busy) return;
    setBusy(action);
    setMessage('');
    setError('');
    try { await callback(); }
    catch (failure) { setError(failure instanceof TypeError ? 'Connection interrupted. Try again.' : failure.message); }
    finally { setBusy(''); }
  }

  async function upload(event, kind) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const image = kind === 'profile-picture';
    const valid = image ? ['image/png', 'image/jpeg', 'image/webp'].includes(file.type) : file.type === 'application/pdf';
    const limit = image ? 2 : 5;
    if (!valid || file.size > limit * 1024 * 1024) {
      setError(image ? 'Choose a PNG, JPEG, or WebP image up to 2 MB.' : 'Choose a PDF up to 5 MB.');
      return;
    }
    await run(kind, async () => {
      await uploadProfileFile(kind, image ? 'profilePicture' : 'resume', file);
      setMessage(image ? 'Profile picture updated.' : 'Résumé updated. Hosts will see the current version.');
      onProfileChange(null);
      setRevision(value => value + 1);
    });
  }

  async function remove(kind) {
    await run(kind, async () => {
      await auth(kind, undefined, 'DELETE');
      setMessage(kind === 'resume' ? 'Résumé removed.' : 'Profile picture removed.');
      onProfileChange(null);
      setRevision(value => value + 1);
    });
  }

  function saveName(event) {
    event.preventDefault();
    run('name', async () => {
      const response = await auth('me', { name: name.trim() }, 'PATCH');
      onUserChange(response.data.user);
      onProfileChange(current => current ? { ...current, name: response.data.user.name } : current);
      setName(response.data.user.name);
      setEditingName(false);
      setMessage('Name updated.');
    });
  }

  return <div className="profile-shell">
    <header className="profile-heading"><div><p>Account / Profile</p><h1>My profile</h1>
      <span>Manage how you appear across interviews.</span></div><a href="/host">Back to interviews ↗</a></header>
    <div className="profile-grid"><section className="profile-card profile-identity">
      {profile?.profilePicture ?
        <img className="profile-portrait" src={profile.profilePicture} alt="Your profile picture"/> :
        <span className="profile-portrait profile-initial" aria-label="Profile initial">{user.name?.slice(0, 1)}</span>}
      {editingName ? <form className="profile-name-form" onSubmit={saveName}>
        <label>Full name<input value={name} minLength={2} maxLength={100} required autoComplete="name" onChange={event => setName(event.target.value)}/></label>
        <div><button disabled={!!busy}>Save name</button><button type="button" disabled={!!busy} onClick={() => { setName(user.name); setEditingName(false); }}>Cancel</button></div>
      </form> : <div className="profile-name"><h2>{user.name}</h2><button onClick={() => setEditingName(true)}>Edit name</button></div>}
      <p>{user.email}</p>
      <span className="profile-verification">{user.emailVerifiedAt ? '✓ Verified email' : 'Email verification pending'}</span>
      <div className="profile-photo-actions">
        <label className="account-file-picker">Change photo<input type="file" accept="image/png,image/jpeg,image/webp" disabled={!!busy} onChange={event => upload(event, 'profile-picture')}/></label>
        {profile?.profilePicture && <button className="text-button" disabled={!!busy} onClick={() => remove('profile-picture')}>Remove</button>}
      </div><small>PNG, JPEG, or WebP · 2 MB maximum</small>
    </section>
    <div className="profile-details">
      <section className="profile-card"><div className="profile-card-heading"><div><p>PERSONAL FILE</p><h2>Résumé</h2></div><span className="profile-file-symbol" aria-hidden="true">↗</span></div>
        <p className="profile-description">Hosts can view your current résumé after you submit their interview.</p>
        <div className="profile-file-state"><span aria-hidden="true">PDF</span><div><strong>{profile?.hasResume ? 'Résumé attached' : 'No résumé attached'}</strong><small>{profile?.hasResume ? 'Your current file is available to hosts.' : 'Add a PDF whenever you are ready.'}</small></div></div>
        <div className="profile-actions"><label className="account-file-picker">{profile?.hasResume ? 'Replace PDF' : 'Upload PDF'}<input type="file" accept="application/pdf,.pdf" disabled={!!busy} onChange={event => upload(event, 'resume')}/></label>
          {profile?.hasResume && <><a href={profile.resumeUrl} target="_blank" rel="noreferrer">View PDF ↗</a>
            <button className="text-button" disabled={!!busy} onClick={() => remove('resume')}>Remove</button></>}</div>
        <small>PDF · 5 MB maximum</small>
      </section>
      <section className="profile-card"><div className="profile-card-heading"><div><p>ACCOUNT</p><h2>Security & access</h2></div></div>
        <dl><dt>Email address</dt><dd>{user.email}</dd><dt>Verification</dt><dd>{user.emailVerifiedAt ? 'Verified' : 'Awaiting verification'}</dd></dl>
        {!user.emailVerifiedAt && <button className="action" disabled={!!busy} onClick={() => run('verify', async () => {
      const response = await auth('resend-verification', { email: user.email });
      setMessage(response.message);
    })}>Resend verification email</button>}
    <a className="profile-password-link" href="/forgot-password">Reset password ↗</a>
    <button className="text-button" disabled={!!busy} onClick={() => run('logout', async () => {
      await auth('logout', {});
      window.dispatchEvent(new Event('vettly:logout'));
      navigate('/login', { replace: true });
    })}>Sign out ↗</button>
      </section>
      <ProfileSessions sessions={sessions} onSessionsChange={onSessionsChange}/>
    </div></div>
    {busy && <p role="status">{busy === 'resume' || busy === 'profile-picture' ? 'Updating your file…' : 'Working…'}</p>}
    {message && <p role="status">{message}</p>}
    {error && <p className="error" role="alert">{error}</p>}
  </div>;
}
