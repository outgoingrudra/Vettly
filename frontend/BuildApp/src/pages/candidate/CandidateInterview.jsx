import { ProctoringSummary } from '../../components/ProctoringSettings';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {request} from '../../api';
import {requireLogin} from '../../loginRedirect';
import {navigate} from '../../navigation';
import Assessment from './Assessment';
import {needsCamera,prepareCamera} from './camera';
import './candidate.css';

export default function CandidateInterview({id,view}){
  const [preview,setPreview]=useState(null),[session,setSession]=useState(null),[receipt,setReceipt]=useState('');
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false);
  const [checking,setChecking]=useState(false);
  const [now,setNow]=useState(Date.now());
  const resource=useRef(null),mounted=useRef(true),video=useRef(null);
  const endpoint='/interviews/'+id+'/join';
  useEffect(()=>{
    mounted.current=true;let active=true;
    request(endpoint,undefined,"GET",{fresh:true}).then(data=>{if(active)setPreview({...data,offset:Date.parse(data.serverTime)-Date.now()})}).catch(e=>{if(active){if(e.status===401)requireLogin();else setError(e.message)}});
    return ()=>{active=false;mounted.current=false;resource.current?.close();resource.current=null};
  },[endpoint]);
  useEffect(()=>{
    const timer=setInterval(()=>setNow(Date.now()),1000);
    return ()=>clearInterval(timer);
  },[]);
  const finish=useCallback((message,key)=>{
    resource.current?.close();resource.current=null;
    try{sessionStorage.removeItem(key)}catch{}
    setReceipt(message);setSession(null);
    if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
  },[]);
  useEffect(()=>{if(video.current && ready)video.current.srcObject=resource.current?.stream},[ready]);
  async function checkCamera(){
    setBusy(true);setError('');
    try{
      const camera=await prepareCamera(preview.interview);
      if(!mounted.current){camera?.close();return}
      resource.current=camera;setReady(true);
    }catch(failure){setError(failure.message || 'Camera check failed. Try again.');}
    finally{if(mounted.current)setBusy(false)}
  }
  async function join(){
    setBusy(true);setError('');
    try{
      if(preview.interview.fullscreenRequired && !document.fullscreenElement) {
        if(!document.documentElement.requestFullscreen)throw Error('Use a browser that supports fullscreen for this interview.');
        await document.documentElement.requestFullscreen();
      }
      const data=await request(endpoint,{});
      if(!mounted.current)return;
      try{sessionStorage.setItem('vettly-workspace','candidate')}catch{}
      if(view === "join") navigate("/interviews/"+id+(preview.interview.format === "LIVE" ? "/video" : "/assessment"), {replace:true});
      setSession({...data,offset:Date.parse(data.serverTime)-Date.now()});
    }catch(e){
      if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
      if(e.status===401)requireLogin();
      else {
        setError(e.message);
        // The server may have started the attempt before video setup or the response failed.
        request(endpoint,undefined,"GET",{fresh:true}).then(data=>{if(mounted.current)setPreview({...data,offset:Date.parse(data.serverTime)-Date.now()})}).catch(()=>{});
      }
    }
    finally{if(mounted.current)setBusy(false)}
  }
  async function refreshStatus(){
    setChecking(true);setError('');
    try {
      const data=await request(endpoint,undefined,'GET',{fresh:true});
      if(mounted.current)setPreview({...data,offset:Date.parse(data.serverTime)-Date.now()});
    } catch(failure) {
      if(!mounted.current)return;
      if(failure.status===401)requireLogin();
      else setError(failure.message || 'Could not check the interview status.');
    } finally {
      if(mounted.current)setChecking(false);
    }
  }
  if(receipt)return <section className="attempt-finished"><h1>{receipt.startsWith('Attempt closed:') ? 'Interview closed' : 'Attempt finished'}</h1><p role="status">{receipt}</p><a href="/host?view=candidate">My interviews →</a></section>;
  if(!preview)return error?<section><a className="page-back" href="/host?view=candidate">← Back to my interviews</a><p role="alert">{error} <button disabled={checking} onClick={refreshStatus}>{checking?'Checking…':'Retry'}</button></p></section>:<p role="status">Loading invitation…</p>;
  const {interview,attempt}=preview;
  if(session)return <Assessment view={view} interview={interview} session={session} camera={resource.current} onFinish={finish}/>;
  const remaining=attempt?.deadline ? Math.max(0,Math.ceil((Date.parse(attempt.deadline)-now-preview.offset)/1000)) : 0;
  const resumed=attempt?.status==='IN_PROGRESS' && remaining>0;
  const closed=attempt && attempt.status!=='NOT_STARTED' && !resumed;
  const needs=needsCamera(interview);
  const available=resumed || (interview.status==='PUBLISHED' && (!interview.scheduledAt || Date.parse(interview.scheduledAt)<=now+preview.offset));
  return <section><a className="page-back" href="/host?view=candidate">← Back to my interviews</a><p>Interview invitation</p><h1>{interview.title}</h1><p>{interview.format==='LIVE'?'Live video':'Multiple choice'} · {interview.durationMinutes} minutes</p>
    {interview.scheduledAt && <p>Starts {new Date(interview.scheduledAt).toLocaleString()}</p>}
    {interview.instructions && <p className="instructions">{interview.instructions}</p>}
    {closed?<div role="status" className="attempt-note">
      <p>{attempt.status==='SUBMITTED'?'Submitted · awaiting publication':attempt.status==='COMPLETED'?'Result published':attempt.terminationReason||'Attempt closed. Did not submit.'}</p>
      {attempt.status==='COMPLETED' && <a href={'/results/'+encodeURIComponent(attempt.id)}>View scorecard</a>}
      {attempt.status==='SUBMITTED' && <button disabled={checking} onClick={refreshStatus}>{checking?'Checking…':'Check result status'}</button>}
      <a href="/host?view=candidate">My interviews</a>
      {error && <p role="alert" className="error">{error}</p>}
    </div>:
    !available?<p>Entry is currently closed. <button disabled={checking} onClick={refreshStatus}>{checking?'Checking…':'Check again'}</button>{error && <span role="alert"> {error}</span>}</p>:
    <div className="check-in"><h2>Before you join</h2><p>{resumed?'Your original timer is running. Resume to continue.':'Your timer starts when you join. You have one attempt.'}</p>
    {resumed && <p role="timer">Time remaining {Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</p>}
    <ProctoringSummary settings={interview}/>
    {needs && <p>Camera checks process frames locally and send event types to the host. {interview.format==='LIVE'?'Live video is shared separately in the room.':''}</p>}
    {ready && <video ref={video} autoPlay muted playsInline aria-label="Camera preview"/>}
    {needs && !ready?<button className="action" disabled={busy} onClick={checkCamera}>{busy?'Checking camera…':'Check camera'}</button>:<button className="action" disabled={busy} onClick={join}>{busy?'Joining…':resumed?'Resume interview':'Join interview'}</button>}
    {error && <p role="alert" className="error">{error}</p>}</div>}</section>;
}
