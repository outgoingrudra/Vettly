import React, { useEffect, useState } from 'react';
import { request } from '../../api';
import DraftEditor from './DraftEditor';
import InterviewOverview from './InterviewOverview';
import './workspace.css';

import { problem, hostPath } from './host';
import Dashboard from './Dashboard';

export default function Workspace({ user, id, editing, creating }) {
  const [record,setRecord] = useState(null);
  const [failure,setFailure] = useState('');
  useEffect(()=>{
    if (!id) return;
    let active=true;
    request('/interviews/'+encodeURIComponent(id)).then(r=>{if(active)setRecord(r.data.interview)})
      .catch(e=>{if(active)setFailure(problem(e))});
    return ()=>{active=false};
  },[id]);
  if (!id && !creating) return <Dashboard user={user}/>;
  let content;
  if(failure) content=<p role="alert">{failure} <a href="">Retry</a></p>;
  else if(id && !record) content=<p role="status" className="wait">Opening interview…</p>;
  else if(creating && !user.emailVerifiedAt) content=<section><h1>Verify your email.</h1><p>Verify your account to create an interview. <a href="/account">Open account details</a></p></section>;
  else if(creating || (editing && record?.status==='DRAFT')) content=<DraftEditor interview={record}/>;
  else if(record) content=<InterviewOverview interview={record} update={setRecord}/>;

  return <main className="workspace" id="content"><nav className="workspace-nav" aria-label="Workspace">
    <a href={editing && id ? hostPath(id) : '/host'}>← {editing ? 'Back to interview' : 'Back to interviews'}</a>
    <a href="/account">Account details</a></nav>{content}</main>;
}
