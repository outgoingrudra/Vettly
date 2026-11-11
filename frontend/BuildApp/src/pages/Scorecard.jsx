import React from 'react';
import useReviewRequest from './host/useReviewRequest';

export function Answers({ result }) {
  const { evaluation, score } = result;
  if (!evaluation?.items?.length) return <p>No scored questions in this interview.</p>;
  return <>
    <h3>{score} / {evaluation.maximum} {evaluation.maximum === 1 ? 'mark' : 'marks'}</h3>
    <ol className="answer-key">{evaluation.items.map(item =>
      <li key={item.questionId}>
        <strong>{item.prompt}</strong>
        <p>Selected answer · {item.options[item.selectedOption] ?? 'Unanswered'}</p>
        <p>Correct answer · {item.options[item.correctOption]}</p>
        <small>{item.earned} / {item.marks} {item.marks === 1 ? 'mark' : 'marks'}</small>
      </li>
    )}</ol>
  </>;
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
