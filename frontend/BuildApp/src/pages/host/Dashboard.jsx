import React, { useEffect, useState } from 'react';
import { auth, request } from '../../api';
import { navigate } from '../../navigation';
import { formatName, hostPath, problem } from './host';
import './dashboard.css';
import CandidateDashboard from './CandidateDashboard';

const statuses = [
  {id:'DRAFT', label:'Drafts', singular:'Draft', icon:'file'},
  {id:'PUBLISHED', label:'Open', singular:'Open', icon:'broadcast'},
  {id:'ARCHIVED', label:'Closed', singular:'Closed', icon:'archive'},
];
const paths = {
  grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  file:'M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6',
  broadcast:'M8 8a6 6 0 0 0 0 8 M16 8a6 6 0 0 1 0 8 M5 5a10 10 0 0 0 0 14 M19 5a10 10 0 0 1 0 14 M12 11v2',
  archive:'M3 4h18v5H3z M5 9v11h14V9 M9 13h6',
  account:'M15 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M4 21a8 8 0 0 1 16 0',
  logout:'M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5 M14 8l4 4-4 4 M8 12h10',
  arrow:'M5 12h14 M13 6l6 6-6 6', plus:'M12 4v16 M4 12h16',
  clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 6v6l4 2',
};
function Icon({name}) {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6"><path d={paths[name]}/></svg>;
}
const date = new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',year:'numeric'});

export default function Dashboard({user}) {
  const [mode,setMode]=useState(()=>{
    if (new URLSearchParams(location.search).get('view') === 'candidate') return 'candidate';
    try { return sessionStorage.getItem('vettly-workspace')==='candidate'?'candidate':'host'; }
    catch { return 'host'; }
  });
  function switchMode(next){
    setMode(next);
    try { sessionStorage.setItem('vettly-workspace',next); } catch {}
    const url = new URL(location.href);
    if (next === 'candidate') url.searchParams.set('view', 'candidate');
    else url.searchParams.delete('view');
    history.replaceState(null, '', url);
  }
  const [filter,setFilter]=useState(''), [page,setPage]=useState(1);
  const [groups,setGroups]=useState(null), [list,setList]=useState(null);
  const [error,setError]=useState(''), [refresh,setRefresh]=useState(0);
  const [signingOut,setSigningOut]=useState(false);
  const [signOutError,setSignOutError]=useState('');
  async function signOut() {
    setSigningOut(true);
    setSignOutError('');
    try {
      await auth('logout', {});
      window.dispatchEvent(new Event('vettly:logout'));
      navigate('/login', { replace: true });
    } catch (failure) {
      setSignOutError(problem(failure));
      setSigningOut(false);
    }
  }
  useEffect(()=>{
    if(mode!=='host')return;
    let current=true;
    Promise.all(statuses.map(s=>request('/interviews?limit=1&status='+s.id,undefined,'GET',{fresh:refresh>0})))
      .then(results=>{if(current)setGroups(results.map(r=>r.data));})
      .catch(e=>{if(current)setError(problem(e));});
    return ()=>{current=false};
  },[mode,refresh]);
  useEffect(()=>{
    if(mode!=='host')return;
    let current=true;setList(null);
    request('/interviews?limit=8&page='+page+(filter?'&status='+filter:''),undefined,'GET',{fresh:refresh>0})
      .then(r=>{if(current)setList(r.data)}).catch(e=>{if(current)setError(problem(e))});
    return ()=>{current=false};
  },[mode,page,filter,refresh]);
  function select(id){setPage(1);setFilter(id)}
  const counts=groups?.map(g=>g.pagination.total);
  const total=counts?.reduce((a,b)=>a+b,0);
  const featured=groups?.map(g=>g.interviews[0]).find(Boolean);
  const create=user.emailVerifiedAt?'/host/new':'/account';
  const createLabel=user.emailVerifiedAt?'Create interview':'Verify email';
  const focusAction=featured?.status==='DRAFT'?'Continue editing':featured?.status==='PUBLISHED'?'Manage invitation':'View interview';
  return <main id="content" className="dashboard">
    <aside className="dash-rail"><div className="mode-switch" role="group" aria-label="Workspace view">{['host','candidate'].map(option=><button key={option} type="button" aria-pressed={mode===option} onClick={()=>switchMode(option)}>{option==='host'?'Host':'Candidate'}</button>)}</div>
      {mode==='host' && <nav aria-label="Interview views">{[{id:'',label:'Overview',icon:'grid'},...statuses].map(s=><button key={s.label} aria-pressed={filter===s.id} onClick={()=>select(s.id)}><Icon name={s.icon}/>{s.label}</button>)}</nav>}
      <div className="rail-account-actions">
        <a className="rail-account" href="/account"><Icon name="account"/>Account settings</a>
        <button type="button" className="rail-logout" disabled={signingOut} onClick={signOut}>
          <Icon name="logout"/>{signingOut ? 'Signing out…' : 'Sign out'}
        </button>
        {signOutError && <p role="alert" className="rail-error">{signOutError}</p>}
      </div>
    </aside>
    {mode==='candidate'?<CandidateDashboard/>:<div className="dash-body" role="region" aria-label="Interview overview" tabIndex={0}><div className="dash-heading"><div><time>{date.format(new Date())}</time><h1>Interview overview</h1></div><a className="dash-create" href={create}><Icon name="plus"/>{createLabel}</a></div>
      {error && <p role="alert" className="dash-alert">{error} <button onClick={()=>{setError('');setRefresh(x=>x+1)}}>Retry</button></p>}
      <div className="dash-summary"><section className="pipeline"><h2>Interview pipeline</h2><div className="pipeline-total">{total??'—'} <small>total</small></div>
      <div className="pipeline-bar" aria-hidden="true">{counts?.map((n,i)=>n>0 && <i key={i} className={'tone-'+i} style={{flex:n}}/>)}</div>
      <div className="pipeline-keys">{statuses.map((s,i)=><button key={s.id} onClick={()=>select(s.id)}><i className={'tone-'+i}/>{s.label}<b>{counts?.[i]??'—'}</b></button>)}</div></section>
      <section className="dash-focus"><span className="focus-design" aria-hidden="true"/><div><p>{featured?'Next action':'Getting started'}</p><h2>{featured?.title ?? (groups?'Your first interview':'Opening workspace…')}</h2>
      {featured?<a href={hostPath(featured.id)+(featured.status==='DRAFT'?'/edit':'')}>{focusAction} <Icon name="arrow"/></a>:groups && <a href={create}>{user.emailVerifiedAt?'Set up a draft':'Verify your email'} <Icon name="arrow"/></a>}</div></section></div>
      <section className="dash-register"><div className="register-head"><h2>{filter?statuses.find(s=>s.id===filter).label+' interviews':'All interviews'}</h2><label>View <select value={filter} onChange={e=>select(e.target.value)} aria-label="Filter interviews"><option value="">All statuses</option>{statuses.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label></div>
      {!list?<p className="dash-message" role="status">{error?'Interviews unavailable.':'Loading interviews…'}</p>:list.interviews.length===0?<div className="dash-empty"><Icon name="file"/><h3>{filter?'No interviews in this view':'No interviews yet'}</h3><p>{filter?'Choose another status to see more interviews.':'Create a draft to start adding questions and inviting candidates.'}</p></div>:
      <div className="roster"><div className="table-labels" aria-hidden="true"><span>Interview</span><span>Status</span><span>Created</span><span/></div>
      {list.interviews.map(i=><a key={i.id} href={hostPath(i.id)}><div className="row-name"><span className="row-icon"><Icon name={i.format==='LIVE'?'broadcast':'file'}/></span><div><strong>{i.title}</strong><small>{formatName[i.format]} · {i.durationMinutes} min</small></div></div><span className={'status status-'+i.status}>{statuses.find(s=>s.id===i.status)?.singular}</span><time>{i.createdAt?date.format(new Date(i.createdAt)):'—'}</time><Icon name="arrow"/></a>)}</div>}
      {list && list.pagination.totalPages>1 && <div className="page-controls"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>{page} / {list.pagination.totalPages}</span><button disabled={page>=list.pagination.totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div>}</section>
    </div>}</main>;
}
