import React, { useState } from 'react';
import { request } from '../../api';
import { Answers } from '../Scorecard';
import { problem } from './host';
import useReviewRequest from './useReviewRequest';

function EventTimeline({ interviewId, attemptId }) {
  const [page, setPage] = useState(1);
  const path = '/interviews/' + interviewId + '/proctoring-events';
  const { response, error, reload } = useReviewRequest(path + '?attemptId=' + attemptId + '&page=' + page + '&limit=10');
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState('');
  const [notes, setNotes] = useState({});

  async function review(event, status) {
    setSaving(true);
    setFailure('');
    try {
      await request(path + '/' + event.id, { status, reviewNotes: notes[event.id] ?? event.reviewNotes ?? '' }, 'PATCH');
      reload();
    } catch (error) {
      setFailure(problem(error));
    } finally {
      setSaving(false);
    }
  }
  return <section><div className="row"><h3>Proctoring activity</h3><button onClick={reload}>Refresh activity</button></div>
    {(error || failure) && <p role="alert">{error || failure}</p>}
    {!response && !error && <p role="status">Loading activity…</p>}
    {response && <>
      {!response.events.length && <p>No events recorded.</p>}
      <ul className="review-list">{response.events.map(event =>
        <li key={event.id}><div><strong>{event.type.toLowerCase().replaceAll('_', ' ')}</strong>
          <small>{new Date(event.occurredAt).toLocaleString()}{event.durationMs > 0 && ' · ' + Math.round(event.durationMs / 1000) + ' seconds'}</small>
          {event.details && Object.keys(event.details).length > 0 && <pre className="event-details">{JSON.stringify(event.details, null, 2)}</pre>}
          <label>Review notes<textarea rows={2} maxLength={2000} value={notes[event.id] ?? event.reviewNotes ?? ''} onChange={e => setNotes(current => ({ ...current, [event.id]: e.target.value }))}/></label>
          <button disabled={saving} onClick={() => review(event, ['REVIEWED','CONFIRMED','DISMISSED'].includes(event.status) ? event.status : 'REVIEWED')}>Save notes</button>
        </div>
          <label>Review status<select disabled={saving} value={event.status} onChange={e => review(event, e.target.value)}>
            {!['REVIEWED','CONFIRMED','DISMISSED'].includes(event.status) && <option value={event.status}>Awaiting review</option>}
            <option value="REVIEWED">Reviewed</option><option value="CONFIRMED">Confirmed</option><option value="DISMISSED">Dismissed</option>
          </select></label></li>)}</ul>
      {response.pagination.totalPages > 1 && <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous events</button>
        <span>{page} / {response.pagination.totalPages}</span>
        <button disabled={page >= response.pagination.totalPages} onClick={() => setPage(page + 1)}>Next events</button>
      </div>}
    </>}
  </section>;
}

export default function AttemptReview({ interview, participant, onBack }) {
  const attempt = participant.attempts[0];
  const submitted = ['SUBMITTED', 'COMPLETED'].includes(attempt.status);
  const path = '/interviews/attempts/' + attempt.id;
  const { response, error, reload } = useReviewRequest(submitted ? path + '/result' : null);
  const result = response?.data;
  const [feedback, setFeedback] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const profile = useReviewRequest(showProfile ? '/auth/profiles/' + participant.userId : null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const published = result?.status === 'COMPLETED';

  async function notifyCandidate() {
    setBusy(true);
    setNotice('');
    try {
      await request(path + (published ? '/resend-result' : '/publish-result'), published ? {} : { feedback });
      setNotice(published ? 'Notification email queued again.' : 'Scorecard published and notification email queued.');
      reload();
    } catch (error) {
      setNotice(problem(error));
      // Publication can succeed even if the email queue is unavailable.
      reload();
    } finally {
      setBusy(false);
    }
  }
  return <section className="review-panel">
    <button onClick={onBack}>Back to candidates</button>
    <h2>{participant.user?.name || participant.email}</h2>
    {participant.user?.name && <p>{participant.email}</p>}
    {attempt.terminationReason && <p>Attempt closed · {attempt.terminationReason}</p>}
    {error && <p role="alert">{error} <button onClick={reload}>Retry</button></p>}
    {submitted && !result && !error && <p role="status">Loading answers…</p>}
    {result && <section><Answers result={result}/>
      {participant.userId && <button aria-expanded={showProfile} onClick={() => setShowProfile(!showProfile)}>{showProfile ? 'Hide profile' : 'View candidate profile'}</button>}
      {showProfile && <div>{profile.error ? <p role="alert">{profile.error} <button onClick={profile.reload}>Retry</button></p> :
        profile.response ? <p>{profile.response.data.name} · {profile.response.data.resumeUrl ?
          <a href={profile.response.data.resumeUrl} target="_blank" rel="noreferrer">Open current résumé</a> : 'No résumé uploaded'}</p> : 'Loading profile…'}</div>}
    </section>}
    <EventTimeline interviewId={interview.id} attemptId={attempt.id}/>
    {result && <section>
      {published ? <><h3>Published scorecard</h3>{result.feedback && <p className="instructions">{result.feedback}</p>}</> :
        <label>Candidate feedback (optional)<textarea rows={4} maxLength={5000} value={feedback} onChange={e => setFeedback(e.target.value)}/></label>}
      {!published && <p>Publish after entry closes and all active attempts finish or expire.</p>}
      <button className="action" disabled={busy || (!published && interview.status !== 'ARCHIVED')} onClick={notifyCandidate}>
        {busy ? 'Processing…' : published ? 'Resend result email' : 'Publish and notify candidate'}</button>
    </section>}
    {notice && <p role="status">{notice}</p>}
  </section>;
}
