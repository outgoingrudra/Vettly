import React, { useState } from 'react';
import { request } from '../../api';
import { problem } from './host';
import useReviewRequest from './useReviewRequest';
import AttemptReview from './AttemptReview';

const outcomes = {
  IN_PROGRESS: 'In progress', DID_NOT_SUBMIT: 'Did not submit', SUBMITTED: 'Ready for review',
  COMPLETED: 'Published', ABANDONED: 'Attempt closed',
};

function StreamRetry({ interviewId, person, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function retry() {
    setBusy(true);
    setError('');
    try {
      await request('/interviews/' + interviewId + '/participants/' + person.id + '/retry-stream-sync', {});
      onDone();
    } catch (failure) {
      setError(problem(failure));
    } finally {
      setBusy(false);
    }
  }
  return <span><button disabled={busy} onClick={retry}>{busy ? 'Retrying…' : 'Retry video access'}</button>
    {error && <small role="alert">{error}</small>}</span>;
}

export function PageControls({ pagination, setPage }) {
  const { page, totalPages } = pagination;
  if (totalPages <= 1) return null;
  return <div className="pagination">
    <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
    <span>Page {page} of {totalPages}</span>
    <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
  </div>;
}

export default function CandidateRoster({ interview }) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const params = new URLSearchParams({ page, limit: 10, search });
  const { response, error, reload } = useReviewRequest('/interviews/' + interview.id + '/participants?' + params, interview.status === 'PUBLISHED' ? 10000 : 0);
  const data = response?.data;
  const maximum = interview.questions?.reduce((sum, question) => sum + question.marks, 0) ?? 0;
  if (selected) return <AttemptReview key={selected.id} interview={interview} participant={selected}
    onBack={() => { setSelected(null); reload(); }}/>;
  return <section className="review-panel">
    <div className="row"><div><h2>Candidates</h2>{interview.status === 'PUBLISHED' && <small>Updates every 10 seconds</small>}</div><button onClick={reload}>Refresh</button></div>
    <form className="roster-search" onSubmit={event => { event.preventDefault(); setPage(1); setSearch(query.trim()); }}>
      <label>Find a candidate<input type="search" maxLength={254} placeholder="Name or email" value={query} onChange={event => setQuery(event.target.value)}/></label>
      <button>Search</button>
    </form>
    {error ? <p role="alert">{error}</p> : !data ? <p role="status">Loading candidates…</p> :
      <>
        {data.participants.length === 0 && <p>{search ? 'No matching candidates.' : 'Candidates will appear here when they join.'}</p>}
        <ul className="review-list">{data.participants.map(person =>
          <li key={person.id}><div><strong>{person.user?.name || person.email}</strong>
            {person.user?.name && <small>{person.email}</small>}
            <small>{outcomes[person.outcome] || person.outcome.toLowerCase().replaceAll('_', ' ')}</small>
            {person.attempts[0]?.submittedAt && <small>Submitted {new Date(person.attempts[0].submittedAt).toLocaleString()}</small>}</div>
            {person.attempts[0]?.score != null && <div className="roster-score">
              <strong>{person.attempts[0].score}{maximum > 0 && ' / ' + maximum}</strong>
              <small>{maximum === 1 ? 'mark' : 'marks'}{person.attempts[0].warningCount > 0 && ' · ' + person.attempts[0].warningCount + ' warnings'}</small>
            </div>}
            <div className="roster-actions">
              {interview.format === 'LIVE' && person.userId && ['ACCEPTED', 'IN_PROGRESS'].includes(person.status) && person.streamSyncError && <StreamRetry interviewId={interview.id} person={person} onDone={reload}/>}
              {person.attempts.length > 0 && <button onClick={() => setSelected(person)}>Review attempt</button>}
            </div>
          </li>)}</ul>
        <PageControls pagination={data.pagination} setPage={setPage}/>
      </>}
  </section>;
}
