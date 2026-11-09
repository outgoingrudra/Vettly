import React, { useState } from 'react';
import { request } from '../../api';
import { hostPath, problem } from './host';
import { navigate } from '../../navigation';

import ProctoringSettings, { checkKeys } from '../../components/ProctoringSettings';

function blankQuestion() {
  return { key: crypto.randomUUID(), prompt:'', options:['',''], correctOption:-1, marks:1 };
}
export default function DraftEditor({interview}) {
  const [id,setId]=useState(interview?.id);
  const [questions,setQuestions]=useState(()=> interview?.questions.map(q=>({...q,key:q.id})) ?? []);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  function change(key,patch) { setQuestions(list=>list.map(q=>q.key===key?{...q,...patch}:q)); }
  function removeOption(q,index) {
    const correctOption=q.correctOption===index ? -1 : q.correctOption-Number(q.correctOption>index);
    change(q.key,{options:q.options.filter((_,i)=>i!==index),correctOption});
  }
  async function save(e) {
    e.preventDefault(); if(busy)return;
    const form=new FormData(e.currentTarget);
    const details={title:form.get('title').trim(),description:form.get('description').trim(),instructions:form.get('instructions').trim(),format:form.get('format'),durationMinutes:Number(form.get('duration')),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone};
    const scheduledAt=form.get('scheduledAt');
    if(scheduledAt) details.scheduledAt=new Date(scheduledAt).toISOString();
    else if(interview?.scheduledAt) details.scheduledAt=null;
    const maxParticipants=form.get('maxParticipants');
    if(maxParticipants) details.maxParticipants=Number(maxParticipants);
    else if(interview?.maxParticipants) details.maxParticipants=null;
    for(const key of checkKeys) details[key]=form.has(key);
    details.warningLimit=Number(form.get("warningLimit") ?? interview?.warningLimit ?? 3);
    if(details.title.length<3){setError('Use at least three characters for the title.');return;}
    const clean=questions.map(q=>({prompt:q.prompt.trim(),options:q.options.map(o=>o.trim()),marks:Number(q.marks),correctOption:q.correctOption}));
    for(const [i,q] of clean.entries()) {
      if(!q.prompt || q.options.some(o=>!o) || new Set(q.options.map(o=>o.toLowerCase())).size!==q.options.length || q.correctOption<0){
        setError('Question '+(i+1)+' needs a prompt, distinct options, and one correct answer.');return;
      }
    }
    setBusy(true);setError('');
    let savedId=id, detailsSaved=false;
    try {
      const response=await request(id?'/interviews/'+id:'/interviews',details,id?'PATCH':'POST');
      savedId=response.data.interview.id;detailsSaved=true;
      // Retain the new ID if saving the question list fails. Retry updates this draft.
      if(!id){setId(savedId);history.replaceState(null,'',hostPath(savedId)+'/edit');}
      await request('/interviews/'+savedId+'/questions',{questions:clean},'PUT');
      navigate(hostPath(savedId));
    } catch(e){setError((detailsSaved?'Interview details saved. Questions could not be saved. ':'')+problem(e));}
    finally{setBusy(false);}
  }
  return <section><h1>{id?'Edit draft':'New interview'}</h1>
    <form className="editor" onSubmit={save}><fieldset disabled={busy}><legend>Interview details</legend>
      <label>Title<input name="title" required minLength={3} maxLength={150} defaultValue={interview?.title} placeholder="Design systems interview"/></label>
      <div className="form-pair"><label>Format<select name="format" defaultValue={interview?.format??'ASYNC'}><option value="ASYNC">Assessment only</option><option value="LIVE">Live video</option></select></label>
      <label>Duration in minutes<input name="duration" type="number" required min="1" max="525600" defaultValue={interview?.durationMinutes??30}/></label></div>
      <label>Candidate instructions <small>(optional)</small><textarea name="instructions" rows="3" maxLength="10000" defaultValue={interview?.instructions??''}/></label>
      <label>Description <small>(optional)</small><textarea name="description" rows="2" maxLength="5000" defaultValue={interview?.description??''}/></label>
      <div className="form-pair"><label>Scheduled start <small>(optional)</small><input name="scheduledAt" type="datetime-local" defaultValue={interview?.scheduledAt ? new Date(new Date(interview.scheduledAt).getTime()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16) : ''}/></label>
      <label>Participant limit <small>(optional)</small><input name="maxParticipants" type="number" min="1" max="1000" defaultValue={interview?.maxParticipants??''}/></label></div>
    </fieldset><ProctoringSettings interview={interview} disabled={busy}/>
    <fieldset disabled={busy}><legend>Questions ({questions.length})</legend>
      <p>Choose one correct answer for each question. You can finish writing questions before starting the interview.</p>
      {questions.map((q,i)=><section key={q.key} className="question-editor"><div className="row"><h3>Question {i+1}</h3><button type="button" onClick={()=>setQuestions(list=>list.filter(item=>item.key!==q.key))}>Remove question</button></div>
        <label>Prompt<textarea required rows="2" maxLength="2000" value={q.prompt} onChange={e=>change(q.key,{prompt:e.target.value})}/></label>
        <fieldset className="options"><legend>Answer options · select the correct one</legend>{q.options.map((option,j)=><div className="option-row" key={j}>
          <input type="radio" name={'correct-'+q.key} required checked={q.correctOption===j} aria-label={'Option '+(j+1)+' is correct'} onChange={()=>change(q.key,{correctOption:j})}/>
          <input required maxLength="500" aria-label={'Question '+(i+1)+' option '+(j+1)} placeholder={'Option '+(j+1)} value={option} onChange={e=>change(q.key,{options:q.options.map((v,k)=>j===k?e.target.value:v)})}/>
          {q.options.length>2 && <button type="button" aria-label={'Remove option '+(j+1)} onClick={()=>removeOption(q,j)}>×</button>}</div>)}</fieldset>
        <div className="row"><button type="button" disabled={q.options.length>=6} onClick={()=>change(q.key,{options:[...q.options,'']})}>Add option</button>
        <label className="marks">Marks<input required type="number" min="1" max="1000" value={q.marks} onChange={e=>change(q.key,{marks:e.target.value})}/></label></div>
      </section>)}
      <button type="button" disabled={questions.length>=100} onClick={()=>setQuestions(list=>[...list,blankQuestion()])}>+ Add question</button>
    </fieldset>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="row"><a href={id?hostPath(id):'/host'}>Cancel</a><button className="action" disabled={busy}>{busy?'Saving…':'Save draft'}</button></div></form>
  </section>;
}
