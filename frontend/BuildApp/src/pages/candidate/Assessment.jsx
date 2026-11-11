import { hasCountedWarnings } from '../../components/ProctoringSettings';
import React,{lazy,Suspense,useEffect,useState} from 'react';
import {request} from '../../api';
import {monitorCamera} from './camera';
import {requireLogin} from '../../loginRedirect';
const VideoRoom=lazy(()=>import('./VideoRoom'));
import RoomChatDrawer from './RoomChatDrawer';
const names={COPY_ATTEMPT:'Copy attempt',CUT_ATTEMPT:'Cut attempt',PASTE_ATTEMPT:'Paste attempt',TAB_SWITCH:'Tab switch',FULLSCREEN_EXIT:'Fullscreen exit',FACE_MISSING:'Face out of frame',MULTIPLE_FACES:'Multiple faces',LOOKING_AWAY:'Looking away',SUSPICIOUS_GESTURE:'Hand movement',CAMERA_DISCONNECTED:'Camera disconnected'};

function formatRemainingTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const parts = minutes >= 60 ? [Math.floor(minutes / 60), minutes % 60] : [minutes];
  parts.push(seconds % 60);
  return parts.map((part, index) => index ? String(part).padStart(2, '0') : String(part)).join(':');
}

export default function Assessment({view,interview,session,camera,onFinish}){
  const {attempt,questions}=session;
  const videoPage = interview.format === 'LIVE' && view === 'video';
  const [visitedRoom, setVisitedRoom] = useState(videoPage);
  const [questionIndex, setQuestionIndex] = useState(0);
  useEffect(() => { if (videoPage) setVisitedRoom(true); }, [videoPage]);
  const key='vettly-draft-'+attempt.id;
  const [answers,setAnswers]=useState(()=>{try{return JSON.parse(sessionStorage.getItem(key))||{}}catch{return {}}});
  const [now,setNow]=useState(Date.now()),[review,setReview]=useState(false),[busy,setBusy]=useState(false);
  const [notice,setNotice]=useState(''),[count,setCount]=useState(session.warningCount||0),[needsFull,setNeedsFull]=useState(false),[uncertain,setUncertain]=useState(false);
  const [securityAlert,setSecurityAlert]=useState(null);
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
        if(!r.event && !r.terminated)return;
        if(r.terminated)onFinish('Attempt closed: '+names[type]+'. The warning limit was reached.',key);
        else setSecurityAlert({
          event: names[type],
          count: r.warningCount,
          limit: r.warningLimit,
          counted: r.countedAsWarning,
        });
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
  return <section><a className="page-back" href="/host?view=candidate">← Back to my interviews</a>
    <header className="room-heading">
      <div><p className="room-role">Candidate room</p><h1>{interview.title}</h1></div>
      {interview.format==='LIVE' && <RoomChatDrawer interviewId={interview.id}/>}
    </header>
    {interview.format==='LIVE' && <nav className="interview-views" aria-label="Interview pages">
      <a aria-current={videoPage?'page':undefined} href={'/interviews/'+interview.id+'/video'}>Video room</a>
      <a aria-current={!videoPage?'page':undefined} href={'/interviews/'+interview.id+'/assessment'}>Assessment</a>
    </nav>}
    <p className="attempt-leave-note">Leaving this page keeps your timer running. Return through My interviews to finish.</p>
    <div className="attempt-summary">
      <strong className="room-clock" data-urgent={seconds <= 300} role="timer">
        {seconds <= 300 ? 'Ending soon' : 'Time left'} · {formatRemainingTime(seconds)}
      </strong>
      <span>{filled} / {questions.length} answered</span>
      {hasCountedWarnings(interview) && <strong className="warning-count" data-active={count>0}
        aria-label={`${count} of ${interview.warningLimit} allowed warnings`}>Warnings {count} / {interview.warningLimit}</strong>}
    </div>
    {securityAlert && <div className="security-alert" data-counted={securityAlert.counted} role="alert">
      <div>
        <strong>{securityAlert.counted ? 'Security warning recorded' : 'Activity recorded for review'}</strong>
        <p>{securityAlert.event}. {securityAlert.counted ? `${securityAlert.count} of ${securityAlert.limit} allowed warnings used.` : 'This event does not count toward the warning limit.'}</p>
        {securityAlert.counted && securityAlert.limit-securityAlert.count===1 && <p>One more warning will close your attempt.</p>}
      </div>
      <button type="button" onClick={()=>setSecurityAlert(null)} aria-label="Dismiss security notice">Dismiss</button>
    </div>}
    {(visitedRoom || videoPage) && <div hidden={!videoPage}><Suspense fallback={<p>Opening video…</p>}><VideoRoom id={interview.id}/></Suspense></div>}
    {notice && <p role="status" className="attempt-note">{notice}</p>}
    {uncertain && <button disabled={busy} onClick={checkSubmission}>Check submission status</button>}
    {needsFull && <button onClick={()=>document.documentElement.requestFullscreen().catch(()=>setNotice('Fullscreen permission is required.'))}>Return to fullscreen</button>}
    {!videoPage && <div className="assessment-layout">
      <aside className="question-map" aria-label="Question navigator">
        <h2>Your progress</h2>
        <progress value={filled} max={questions.length || 1} aria-label="Questions answered"/>
        <p>{filled} of {questions.length} answered</p>
        <div className="question-numbers">{questions.map((question, index) => (
          <button type="button" key={question.id} disabled={busy} aria-label={`Question ${index+1}, ${Number.isInteger(answers[question.id])?'answered':'unanswered'}`}
            data-answered={Number.isInteger(answers[question.id])}
            aria-current={!review && questionIndex===index?'step':undefined}
            onClick={()=>{setQuestionIndex(index);setReview(false)}}>{index+1}</button>
        ))}</div>
        {!review && questions.length > 1 && questionIndex < questions.length - 1 &&
          <button type="button" className="review-shortcut" disabled={busy || uncertain}
            onClick={() => setReview(true)}>Review answers</button>}
      </aside>
      <fieldset disabled={busy || needsFull || !seconds || uncertain} className="answer-sheet">
        <legend>{review?'Review your answers':questions.length?`Question ${questionIndex+1} of ${questions.length}`:'Live interview'}</legend>
        {!questions.length && <p>This interview has no written questions. Submit when your conversation is finished.</p>}
        {questions.map((question,index)=>(review || index===questionIndex) && (
          <fieldset key={question.id} className="candidate-question">
            <legend>{review && `${index+1}. `}{question.prompt}</legend>
            <small>{question.marks} {question.marks===1?'mark':'marks'}</small>
            {review ? <div className="review-selection">
              <p>{question.options[answers[question.id]] ?? 'Unanswered'}</p>
              <button type="button" aria-label={`Edit answer to question ${index+1}`}
                onClick={() => { setQuestionIndex(index); setReview(false); }}>Edit</button>
            </div> : question.options.map((option,choice)=>(
              <label key={choice} className="answer-option">
                <input type="radio" name={question.id} checked={answers[question.id]===choice}
                  onChange={()=>setAnswers(previous=>({...previous,[question.id]:choice}))}/>
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
        ))}
        {review && <p>{questions.length-filled} unanswered. Submitting closes this attempt.</p>}
        <div className="question-steps">
          {review ? <><button onClick={()=>setReview(false)}>Edit answers</button>
            <button className="action" onClick={submit}>{busy?'Submitting…':'Submit final answers'}</button></> :
            <>{questionIndex>0 && <button onClick={()=>setQuestionIndex(questionIndex-1)}>Previous</button>}
              {questionIndex<questions.length-1 ? <button className="action" onClick={()=>setQuestionIndex(questionIndex+1)}>Next question →</button>
                : <button className="action" onClick={()=>setReview(true)}>Review answers →</button>}</>}
        </div>
      </fieldset>

    </div>}
  </section>;
}
