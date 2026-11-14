import React from 'react';
import useReviewRequest from './host/useReviewRequest';
import './scorecard.css';

export function Answers({ result }) {
  const { evaluation, score, aiStatus } = result;
  if (!evaluation?.items?.length) return <p>No assessment questions in this interview.</p>;
  const mcqs = evaluation.items.filter(item => item.kind !== 'WRITTEN');
  const written = evaluation.items.filter(item => item.kind === 'WRITTEN');
  const scoreReady = aiStatus === 'COMPLETED' || aiStatus === 'NOT_REQUIRED';

  return <div className="assessment-results">
    <div className="result-overview">
      <div><span className="result-eyebrow">Assessment result</span>
        <h3>{scoreReady ? 'Review complete' : 'Written review in progress'}</h3>
        <p>{mcqs.length} multiple choice · {written.length} written {written.length === 1 ? 'answer' : 'answers'}</p>
      </div>
      {scoreReady && evaluation.maximum > 0 && <div className="result-total" aria-label={`Total score ${score} out of ${evaluation.maximum}`}>
        <strong>{score}</strong><span>/ {evaluation.maximum}</span><small>total marks</small>
      </div>}
    </div>
    {['PENDING','PROCESSING','RETRYING'].includes(aiStatus) && <p className="ai-progress" role="status">AI review of written answers is in progress. Marks will update here.</p>}
    {aiStatus === 'FAILED' && <p className="ai-progress" role="status">AI review could not finish. The host can retry it.</p>}

    {mcqs.length > 0 && <section className="result-group"><h3>Multiple choice <span>{mcqs.length}</span></h3>
      <ol className="result-list">{mcqs.map(item => <li key={item.questionId} className="result-question">
        <div className="result-question-head"><strong>{item.prompt}</strong><span className="result-marks">{item.earned} / {item.marks}</span></div>
        <dl className="result-choices"><div><dt>Candidate selected</dt><dd>{item.options[item.selectedOption] ?? 'Unanswered'}</dd></div>
          <div><dt>Correct answer</dt><dd>{item.options[item.correctOption]}</dd></div></dl>
      </li>)}</ol>
    </section>}

    {written.length > 0 && <section className="result-group"><h3>Written responses <span>{written.length}</span></h3>
      <ol className="result-list">{written.map(item => <li key={item.questionId} className="result-question">
        <div className="result-question-head"><strong>{item.prompt}</strong>
          <span className="result-marks written-marks" data-pending={item.earned == null}>
            <small>AI marks</small>{item.earned == null ? 'Reviewing' : `${item.earned} / ${item.marks}`}
          </span></div>
        <div className="written-response"><span className="result-eyebrow">Candidate answer</span><p>{item.answer || 'Unanswered'}</p></div>
        {item.aiReason && <div className="ai-reason"><span className="result-eyebrow">AI evaluation</span><p>{item.aiReason}</p></div>}
      </li>)}</ol>
    </section>}

    {evaluation.aiSummary && <section className="ai-summary">
      <div className="ai-summary-heading"><span className="result-eyebrow">Written assessment</span><h3>AI assessment</h3></div>
      <p className="ai-summary-lead">{evaluation.aiSummary.summary}</p>
      <div className="ai-summary-grid"><div><h4>Strengths</h4><p>{evaluation.aiSummary.strengths}</p></div>
        <div><h4>Areas to improve</h4><p>{evaluation.aiSummary.improvements}</p></div></div>
    </section>}
  </div>;
}

export default function Scorecard({ id }) {
  const { response, error, reload } = useReviewRequest('/interviews/attempts/' + id + '/result');
  const result = response?.data;
  return <section className="scorecard">
    <a href="/host?view=candidate">← Back to my interviews</a>
    <h1>{result?.interview?.title ?? 'Interview scorecard'}</h1>
    {error ? <p role="alert">{error} <button onClick={reload}>Retry</button></p> :
      !result ? <p role="status">Loading scorecard…</p> : <>
        <p className="metadata">{result.participant.email} · {result.status === 'COMPLETED' ? 'Published' : 'Awaiting publication'}</p>
        <Answers result={result}/>
        {result.feedback && <section><h2>Host feedback</h2><p className="instructions">{result.feedback}</p></section>}
      </>}
  </section>;
}
