import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { request } from '../../api';
import { Answers } from '../Scorecard';
import { problem } from './host';
import useReviewRequest from './useReviewRequest';
import { openResume } from '../../openResume';

const eventNames = {
  COPY_ATTEMPT: 'Copy attempt', CUT_ATTEMPT: 'Cut attempt', PASTE_ATTEMPT: 'Paste attempt',
  TAB_SWITCH: 'Tab switch', FULLSCREEN_EXIT: 'Fullscreen exit', FACE_MISSING: 'Face out of frame',
  MULTIPLE_FACES: 'Multiple faces', LOOKING_AWAY: 'Looking away',
  SUSPICIOUS_GESTURE: 'Hand movement', CAMERA_DISCONNECTED: 'Camera disconnected',
};

function EventTimeline({ interviewId, attemptId }) {
  const [page, setPage] = useState(1);
  const path = '/interviews/' + interviewId + '/proctoring-events';
  const { response, error, reload } = useReviewRequest(path + '?attemptId=' + attemptId + '&page=' + page + '&limit=10');
  return <section><div className="row"><h3>Proctoring activity</h3><button onClick={reload}>Refresh activity</button></div>
    {error && <p role="alert">{error}</p>}
    {!response && !error && <p role="status">Loading activity…</p>}
    {response && <>
      {!response.events.length && <p>No events recorded.</p>}
      <ul className="review-list">{response.events.map(event =>
        <li key={event.id}><div><strong>{eventNames[event.type] || event.type.toLowerCase().replaceAll('_', ' ')}</strong>
          <small>{new Date(event.occurredAt).toLocaleString()}{event.durationMs > 0 && ' · ' + Math.round(event.durationMs / 1000) + ' seconds'}</small>
          <small>{event.type === 'SUSPICIOUS_GESTURE' && !event.details?.countedAsWarning ? 'Recorded for review · no warning counted' : 'Counted as a warning'}</small>
          {event.details && Object.keys(event.details).length > 0 && <details className="event-details"><summary>Detection details</summary><pre>{JSON.stringify(event.details, null, 2)}</pre></details>}
        </div></li>)}</ul>
      {response.pagination.totalPages > 1 && <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous events</button>
        <span>{page} / {response.pagination.totalPages}</span>
        <button disabled={page >= response.pagination.totalPages} onClick={() => setPage(page + 1)}>Next events</button>
      </div>}
    </>}
  </section>;
}

export default function AttemptReview({ interview, participant, onBack }) {
  const panel = useRef(null);
  useLayoutEffect(() => {
    panel.current?.scrollIntoView({ block: 'start' });
    panel.current?.focus({ preventScroll: true });
  }, []);
  const attempt = participant.attempts[0];
  const submitted = ['SUBMITTED', 'COMPLETED'].includes(attempt.status);
  const path = '/interviews/attempts/' + attempt.id;
  const { response, error, reload } = useReviewRequest(submitted ? path + '/result' : null);
  const result = response?.data;
  const [feedback, setFeedback] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const profile = useReviewRequest(showProfile ? '/auth/profiles/' + participant.userId : null);
  const [profileError, setProfileError] = useState('');
  const [openingResume, setOpeningResume] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const published = result?.status === 'COMPLETED';
  const aiReady = !result || ['NOT_REQUIRED','COMPLETED'].includes(result.aiStatus);
  useEffect(() => {
    if (!['PENDING','PROCESSING','RETRYING'].includes(result?.aiStatus)) return;
    const timer = setInterval(reload, 10000);
    return () => clearInterval(timer);
  }, [result?.aiStatus]);
  useEffect(() => {
    if (result) setFeedback(result.feedback || '');
  }, [result?.id, result?.feedback]);

  async function saveFeedback() {
    setBusy(true);
    setNotice('');
    try {
      await request(path + '/feedback', { feedback }, 'PATCH');
      setNotice('Candidate feedback saved.');
      reload();
    } catch (failure) {
      setNotice(problem(failure));
    } finally {
      setBusy(false);
    }
  }

  async function notifyCandidate() {
    setBusy(true);
    setNotice('');
    try {
      await request(path + (published ? '/resend-result' : '/publish-result'), published ? {} : {});
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
  async function retryAiReview() {
    setBusy(true);
    setNotice('');
    try {
      await request(path + '/retry-assessment', {});
      setNotice('AI review queued again.');
      reload();
    } catch (failure) {
      setNotice(problem(failure));
    } finally {
      setBusy(false);
    }
  }
  async function viewResume() {
    setOpeningResume(true);setProfileError('');
    try { await openResume(participant.userId); }
    catch (failure) { setProfileError(problem(failure)); }
    finally { setOpeningResume(false); }
  }
  return <section ref={panel} tabIndex={-1} aria-label="Candidate review" className="review-panel">
    <button onClick={onBack}>Back to candidates</button>
    <h2>{participant.user?.name || participant.email}</h2>
    {participant.user?.name && <p>{participant.email}</p>}
    {attempt.terminationReason && <p>Attempt closed · {attempt.terminationReason}</p>}
    {error && <p role="alert">{error} <button onClick={reload}>Retry</button></p>}
    {submitted && !result && !error && <p role="status">Loading answers…</p>}
    {result && <section><Answers result={result}/>
      {result.aiStatus === 'FAILED' && <button disabled={busy} onClick={retryAiReview}>Retry AI review</button>}
      {participant.userId && <button aria-expanded={showProfile} onClick={() => setShowProfile(!showProfile)}>{showProfile ? 'Hide profile' : 'View candidate profile'}</button>}
      {showProfile && <div>{profile.error ? <p role="alert">{profile.error} <button onClick={profile.reload}>Retry</button></p> :
        profile.response ? <><p>{profile.response.data.name} · {profile.response.data.hasResume ?
          <button disabled={openingResume} onClick={viewResume}>{openingResume?'Opening…':'Open current résumé'}</button> : 'No résumé uploaded'}</p>
          {profileError && <p role="alert">{profileError}</p>}</> : 'Loading profile…'}</div>}
    </section>}
    <EventTimeline interviewId={interview.id} attemptId={attempt.id}/>
    {result && <section>
      {published ? <><h3>Published scorecard</h3>{result.feedback && <p className="instructions">{result.feedback}</p>}</> :
        <div><label>Candidate feedback (optional)<textarea rows={4} maxLength={5000} value={feedback} onChange={e => setFeedback(e.target.value)}/></label>
          <button type="button" disabled={busy || feedback.trim() === (result.feedback || '')} onClick={saveFeedback}>
            Save feedback
          </button></div>}
      {!published && <p>Publish after entry closes and all active attempts finish or expire.</p>}
      <button className="action" disabled={busy || (!published && (!aiReady || interview.status !== 'ARCHIVED' || feedback.trim() !== (result.feedback || '')))} onClick={notifyCandidate}>
        {busy ? 'Processing…' : published ? 'Resend result email' : 'Publish and notify candidate'}</button>
    </section>}
    {notice && <p role="status">{notice}</p>}
  </section>;
}
