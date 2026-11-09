import { hasCountedWarnings } from '../../components/ProctoringSettings';
import React,{lazy,Suspense,useEffect,useState} from 'react';
import {request} from '../../api';
import {monitorCamera} from './camera';
import {requireLogin} from '../../loginRedirect';
const VideoRoom=lazy(()=>import('./VideoRoom'));
const names={COPY_ATTEMPT:'Copy attempt',CUT_ATTEMPT:'Cut attempt',PASTE_ATTEMPT:'Paste attempt',TAB_SWITCH:'Tab switch',FULLSCREEN_EXIT:'Fullscreen exit',FACE_MISSING:'Face out of frame',MULTIPLE_FACES:'Multiple faces',LOOKING_AWAY:'Looking away',SUSPICIOUS_GESTURE:'Hand movement',CAMERA_DISCONNECTED:'Camera disconnected'};

export default function Assessment({interview,session,camera,onFinish}){
  const {attempt,questions}=session;
  const key='vettly-draft-'+attempt.id;
  const [answers,setAnswers]=useState(()=>{try{return JSON.parse(sessionStorage.getItem(key))||{}}catch{return {}}});
  const [now,setNow]=useState(Date.now()),[review,setReview]=useState(false),[busy,setBusy]=useState(false);
  const [notice,setNotice]=useState(''),[count,setCount]=useState(session.warningCount||0),[needsFull,setNeedsFull]=useState(false),[uncertain,setUncertain]=useState(false);
  const deadline=Date.parse(attempt.deadline)-session.offset;
  const seconds=Math.max(0,Math.ceil((deadline-now)/1000));
  useEffect(()=>{try{sessionStorage.setItem(key,JSON.stringify(answers))}catch{}},[key,answers]);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),500);return ()=>clearInterval(timer)},[]);
  useEffect(()=>{if(seconds===0 && !busy && !uncertain)onFinish('Time expired. Did not submit.',key)},[seconds,busy,uncertain,key,onFinish]);
  useEffect(()=>{
    let active=true,queue=Promise.resolve();
    const previous=new Map();
    function report(type){
      if(!active || Date.now()>deadline || Date.now()-(previous.get(type)||0)<3000)return;
      previous.set(type,Date.now());
      queue=queue.then(async()=>{
        if(!active)return;
        const r=await request('/interviews/attempts/'+attempt.id+'/proctoring-events',{type});
        if(!active)return;
        setCount(r.warningCount);
        if(r.terminated)onFinish('Attempt closed: '+names[type]+'. The warning limit was reached.',key);
        else setNotice(names[type]+(r.countedAsWarning?' — warning recorded.':' — recorded for review.'));
      }).catch(e=>{if(!active)return;if(e.status===401)requireLogin();else if(e.status===409)onFinish(e.message,key);else setNotice('Could not report a monitoring event. Check your connection.');});
    }
    const clipboard=e=>{e.preventDefault();report(e.type.toUpperCase()+'_ATTEMPT')};
    const visibility=()=>{if(document.hidden)report('TAB_SWITCH')};
    const fullscreen=()=>{setNeedsFull(!document.fullscreenElement);if(!document.fullscreenElement)report('FULLSCREEN_EXIT')};
    if(interview.preventCopyPasteEnabled)for(const type of ['copy','cut','paste'])document.addEventListener(type,clipboard);
    if(interview.tabSwitchDetectionEnabled)document.addEventListener('visibilitychange',visibility);
    if(interview.fullscreenRequired){setNeedsFull(!document.fullscreenElement);document.addEventListener('fullscreenchange',fullscreen);}
    const stop=monitorCamera(camera,interview,report,setNotice);
    return ()=>{active=false;stop();for(const t of ['copy','cut','paste'])document.removeEventListener(t,clipboard);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('fullscreenchange',fullscreen);};
  },[attempt.id,deadline,interview,camera,key,onFinish]);
  async function checkSubmission(){
    try {
      const latest=await request('/interviews/'+interview.id+'/join',undefined,'GET',{fresh:true});
      const status=latest.attempt?.status;
      if(status==='SUBMITTED' || status==='COMPLETED'){
        onFinish('Answers submitted. Your host will review your scorecard.',key);
        return;
      }
      if(status==='ABANDONED' || (status==='IN_PROGRESS' && Date.parse(latest.attempt.deadline)<Date.parse(latest.serverTime))){
        onFinish(latest.attempt.terminationReason || 'Time expired. Did not submit.',key);
        return;
      }
      setUncertain(false);
      setNotice('Your answers are still saved here. You can retry submission.');
    } catch {
      setUncertain(true);
      setNotice('Could not confirm submission. Your answers are saved in this tab. Check status when the connection returns.');
    }
  }
  async function submit(){
    setBusy(true);setNotice('');
    try{await request('/interviews/attempts/'+attempt.id+'/submit',{answers:questions.filter(q=>Number.isInteger(answers[q.id])).map(q=>({questionId:q.id,selectedOption:answers[q.id]}))});onFinish('Answers submitted. Your host will review your scorecard.',key);}
    catch(e){if(e.status===401)requireLogin();else if(e.status===409 || e.status>=500 || e instanceof TypeError)await checkSubmission();else setNotice('Submission failed. Your selections are still here. Try again.');}
    finally{setBusy(false);}
  }
  const filled=questions.filter(q=>Number.isInteger(answers[q.id])).length;
  return <section><a className="page-back" href="/host?view=candidate">← Back to my interviews</a><h1>{interview.title}</h1><p className="attempt-leave-note">Leaving this page keeps your timer running. Return through My interviews to finish.</p><div className="attempt-summary"><strong>Time left {Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</strong><span>{filled} / {questions.length} answered</span>{hasCountedWarnings(interview) && <span>Warnings {count} / {interview.warningLimit}</span>}</div>
    {interview.format==='LIVE' && <Suspense fallback={<p>Opening video…</p>}><VideoRoom id={interview.id}/></Suspense>}
    {notice && <p role="status" className="attempt-note">{notice}</p>}
    {uncertain && <button disabled={busy} onClick={checkSubmission}>Check submission status</button>}
    {needsFull && <button onClick={()=>document.documentElement.requestFullscreen().catch(()=>setNotice('Fullscreen permission is required.'))}>Return to fullscreen</button>}
    <fieldset disabled={busy||needsFull||!seconds} className="answer-sheet"><legend>{review?'Review your final answers':'Assessment'}</legend>
    {questions.map((q,i)=><fieldset key={q.id} className="candidate-question"><legend>{i+1}. {q.prompt}</legend><small>{q.marks} marks</small>{review?<p>{q.options[answers[q.id]]??'Unanswered'}</p>:q.options.map((option,j)=><label key={j}><input type="radio" name={q.id} checked={answers[q.id]===j} onChange={()=>setAnswers(a=>({...a,[q.id]:j}))}/>{option}</label>)}</fieldset>)}
    {review?<><p>{questions.length-filled} unanswered. Submitting closes this attempt.</p><button onClick={()=>setReview(false)}>Edit answers</button> <button className="action" disabled={busy} onClick={submit}>{busy?'Submitting…':'Submit final answers'}</button></>:<button className="action" onClick={()=>setReview(true)}>Review answers</button>}
    </fieldset></section>;
}
