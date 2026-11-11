import React, { lazy, Suspense, useEffect, useState } from 'react';
import { request } from '../../api';
import { hostPath, problem } from './host';
import RoomChatDrawer from '../candidate/RoomChatDrawer';
import '../candidate/candidate.css';
import CandidateRoster from './CandidateRoster';

const VideoRoom = lazy(() => import('../candidate/VideoRoom'));

export default function HostVideoRoom({ id }) {
  const [interview, setInterview] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [showCandidates, setShowCandidates] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');

    request('/interviews/' + encodeURIComponent(id), undefined, 'GET', { fresh: true })
      .then(response => {
        if (active) setInterview(response.data.interview);
      })
      .catch(failure => {
        if (active) setError(failure.message || 'Could not open the interview.');
      });

    return () => { active = false; };
  }, [id, retry]);

  async function closeEntry() {
    if (!window.confirm('Close entry? Candidates already in progress can still submit before their deadline.')) return;

    setClosing(true);
    setCloseError('');
    try {
      const response = await request('/interviews/' + encodeURIComponent(id) + '/archive', {}, 'PATCH');
      setInterview(current => ({ ...current, ...response.data.interview }));
    } catch (failure) {
      // Check the current status in case the archive succeeded before the connection failed.
      try {
        const latest = await request('/interviews/' + encodeURIComponent(id), undefined, 'GET', { fresh: true });
        setInterview(latest.data.interview);
        if (latest.data.interview.status !== 'ARCHIVED') setCloseError(problem(failure));
      } catch {
        setCloseError('Could not confirm whether entry closed. Check the interview overview before retrying.');
      }
    } finally {
      setClosing(false);
    }
  }

  return <main id="content" className="workspace live-stage">
    <a className="page-back" href={hostPath(id)}>← Interview overview</a>
    {error ? <p role="alert">{error} <button onClick={() => setRetry(value => value + 1)}>Retry</button></p> :
      !interview ? <p role="status">Opening interview room…</p> :
      interview.format !== 'LIVE' || !interview.streamCallId ?
        <p role="status">This interview has no video room. <a href={hostPath(id)}>Return to the interview</a></p> : <>
        <div className="room-heading">
          <div>
            <p className="room-role">Host video room</p>
            <h1>{interview.title}</h1>
            <p className="metadata">{interview.durationMinutes} minutes · {interview.questions?.length || 0} {interview.questions?.length === 1 ? 'question' : 'questions'}</p>
          </div>
          <div className="live-stage-entry">
            <RoomChatDrawer interviewId={id}/>
            <span className="live-stage-status">{interview.status === 'PUBLISHED' ? 'Open for candidates' : 'Entry closed'}</span>
            {interview.status === 'PUBLISHED' && <button type="button" disabled={closing} onClick={closeEntry}>
              {closing ? 'Closing entry…' : 'Close entry'}
            </button>}
          </div>
        </div>
        {closeError && <p role="alert">{closeError}</p>}
        <Suspense fallback={<p role="status">Opening video…</p>}>
          <VideoRoom id={id}/>
        </Suspense>
        {interview.instructions && <details className="live-stage-instructions">
          <summary>Candidate instructions</summary>
          <p>{interview.instructions}</p>
        </details>}
        <section className="live-stage-candidates">
          <button type="button" aria-expanded={showCandidates}
            onClick={() => setShowCandidates(value => !value)}>
            {showCandidates ? 'Hide candidates' : 'Show candidates'}
          </button>
          {showCandidates && <CandidateRoster interview={interview}/>}
        </section>
      </>}
  </main>;
}
