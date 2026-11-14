import React,{useEffect,useState} from 'react';
import {request} from '../../api';
import {formatName,problem} from './host';
import JoinInvitation from './JoinInvitation';

function statusLabel(attempt){
  if(attempt.status==='IN_PROGRESS'){
    return attempt.deadline && Date.now()>Date.parse(attempt.deadline)?'Did not submit':'In progress';
  }
  return {NOT_STARTED:'Not started',SUBMITTED:'Awaiting publication',COMPLETED:'Result published',ABANDONED:'Attempt closed'}[attempt.status] || attempt.status;
}

export default function CandidateDashboard(){
  const [page,setPage]=useState(1),[data,setData]=useState(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  useEffect(()=>{
    let active=true;setData(null);setError('');
    request('/interviews/attempts/mine?page='+page,undefined,'GET',{fresh:retry>0}).then(r=>{if(active)setData(r.data)})
      .catch(e=>{if(active)setError(problem(e))});
    return ()=>{active=false};
  },[page,retry]);
  return <section className="dash-body candidate-body" aria-label="Candidate workspace" tabIndex={0}>
    <div className="dash-heading"><div><p>Candidate workspace</p><h1>My interviews</h1></div>
      <button className="candidate-refresh" onClick={()=>setRetry(value=>value+1)}>Refresh results</button></div>
    <JoinInvitation/>
    {data?.summary && <div className="candidate-summary" aria-label="Interview status summary">
      {[['total','All attempts'],['active','In progress'],['awaiting','Awaiting result'],['published','Published']].map(([key,label]) =>
        <section key={key}><strong>{data.summary[key]}</strong><span>{label}</span></section>)}
    </div>}
    <section className="dash-register"><div className="register-head"><h2>My attempts</h2></div>
      {error?<p role="alert" className="dash-alert">{error} <button onClick={()=>setRetry(v=>v+1)}>Retry</button></p>:
      !data?<p role="status" className="dash-message">Loading your interviews…</p>:
      !data.attempts.length?<div className="dash-empty"><h3>No attempts yet</h3><p>Interviews appear here after you join using a host’s invitation link.</p></div>:
      <ul className="candidate-attempts">{data.attempts.map(a=><li key={a.id}><div className="candidate-title"><strong>{a.interview.title}</strong><span>{statusLabel(a)}</span></div>
        <small>{formatName[a.interview.format]}{a.submittedAt?' · Submitted '+new Date(a.submittedAt).toLocaleString():a.startedAt?' · Started '+new Date(a.startedAt).toLocaleString():''}</small>
        {statusLabel(a)==='In progress' && <a href={'/interviews/'+encodeURIComponent(a.interview.id)+'/join'}>Resume interview</a>}
        {a.status==='SUBMITTED' && <p>Your answers were received. You’ll get an email when the host publishes your scorecard.</p>}
        {a.status==='COMPLETED' && <a href={'/results/'+encodeURIComponent(a.id)}>View scorecard</a>}
      </li>)}</ul>}
      {data?.totalPages>1 && <div className="page-controls"><button disabled={page===1} onClick={()=>setPage(page-1)}>Previous</button><span>{page} / {data.totalPages}</span><button disabled={page>=data.totalPages} onClick={()=>setPage(page+1)}>Next</button></div>}
    </section></section>;
}
