import React, { useState } from 'react';
import { auth } from '../api';

const pages = {
  login: ['Welcome back.', 'Sign in to your interview workspace.', 'Sign in'],
  signup: ['Create an account.', 'Use your email to join or host interviews.', 'Create account'],
  'forgot-password': ['Reset your password.', 'Enter your email to request a password reset link.', 'Send reset link'],
  'reset-password': ['Choose a password.', 'Use at least 8 characters for your new password.', 'Save new password'],
  'verify-email': ['Verify your email.', 'Confirm this email address to activate your account.', 'Verify email'],
  'resend-verification': ['Verify your email.', 'Enter your email to request a fresh verification link.', 'Send verification email'],
};

export default function AuthForm({ route, token, onLogin }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [visible, setVisible] = useState(false);
  const [title, intro, action] = pages[route];
  const signin = route === 'login', signup = route === 'signup';
  const password = signin || signup || route === 'reset-password';
  const email = signin || signup || route === 'forgot-password' || route === 'resend-verification';
  const missing = !token && ['verify-email','reset-password'].includes(route);
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError(''); setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (data.email) data.email = data.email.trim();
    if (route === 'reset-password' || route === 'verify-email') data.token = token;
    try {
      const result = await auth(route, data);
      if (signin) return onLogin(result.data.user);
      const heading = signup ? 'Account created.' : route === 'reset-password' ? 'Password updated.' : route === 'verify-email' ? 'Email verified.' : 'Check your inbox.';
      setDone({ heading, message: result.message });
    } catch (err) { setError(err instanceof TypeError ? "Connection interrupted. Check your connection and try again." : err.message); }
    finally { setBusy(false); }
  }
  return <section className="account-panel">
    {(signin || signup) && !done && <nav aria-label="Account access" className="tabs"><a href="/login" aria-current={signin ? 'page' : undefined}>Sign in</a><a href="/signup" aria-current={signup ? 'page' : undefined}>Create account</a></nav>}
    {!signin && !signup && <a className="back" href="/login">← Back to sign in</a>}
    {done ? <div role="status"><div className="success-icon">✓</div><h1>{done.heading}</h1><p className="intro">{done.message}</p><a className="action" href="/login">Continue to sign in <span>→</span></a>{signup && <a className="minor" href="/resend-verification">Resend verification email</a>}</div> :
    <><h1>{title}</h1><p className="intro">{missing ? 'Open the link in your email, or request a new one below.' : intro}</p>
    {missing ? <a className="action" href={route === 'verify-email' ? '/resend-verification' : '/forgot-password'}>Request a new link <span>→</span></a> :
    <form onSubmit={submit} aria-busy={busy}>
      {signup && <label>Full name<input name="name" autoComplete="name" placeholder="Your name" required minLength={2} maxLength={100}/></label>}
      {email && <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254}/></label>}
      {password && <div className="field"><div className="label-line"><label htmlFor="password">{route === 'reset-password' ? 'New password' : 'Password'}</label>{signin && <a href="/forgot-password">Forgot password?</a>}</div>
      <div className="password"><input id="password" name="password" type={visible ? 'text' : 'password'} minLength={signin ? 1 : 8} maxLength={128} required autoComplete={signin ? 'current-password' : 'new-password'} placeholder={signin ? 'Enter your password' : 'At least 8 characters'}/>
      <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={()=>setVisible(!visible)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{visible && <path d="m3 3 18 18"/>}</svg></button></div></div>}
      {error && <div role="alert" className="error">{error}{route === 'verify-email' && <> <a href="/resend-verification">Request a fresh link</a></>}{route === 'reset-password' && <> <a href="/forgot-password">Request a fresh link</a></>}</div>}
      <button type="submit" className="action" disabled={busy}>{busy ? 'Working…' : action}<span aria-hidden="true">→</span></button>
    </form>}
    </>}
  </section>;
}
