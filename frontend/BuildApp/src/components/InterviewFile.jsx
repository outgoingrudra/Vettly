import React,{useState} from 'react';
const steps=['Invitation','Assessment','Scorecard'];
export default function InterviewFile(){
  const [stage,setStage]=useState(0),[answer,setAnswer]=useState('');
  return <div id="preview" className="desk">
    <div className="folder"><div className="folder-tab">Vettly / Interview file</div>
    <div className="paper"><div className="paper-meta"><span>Product design</span><span>Sample {steps[stage].toLowerCase()}</span></div>
    <h2>{stage===0?'Design systems interview':stage===1?'Choose a control':'Your scorecard'}</h2>
    {stage===0?<><div className="detail"><span>Format</span><strong>Multiple choice</strong></div><div className="detail"><span>Duration</span><strong>30 minutes</strong></div><p>Your timer starts when you join.</p><button onClick={()=>setStage(1)}>Try a question →</button></>:stage===1?<><fieldset><legend>Which allows a single selection?</legend>{['Radio button','Checkbox'].map(x=><label key={x}><input type="radio" name="answer" checked={answer===x} onChange={()=>setAnswer(x)}/>{x}</label>)}</fieldset><button disabled={!answer} onClick={()=>setStage(2)}>See sample score →</button></>:<><div className="score">{answer==='Checkbox'?'0':'1'} <small>/ 1 mark</small></div><div className="detail"><span>Correct answer</span><strong>Radio button</strong></div><button onClick={()=>{setStage(0);setAnswer('')}}>Restart preview ↺</button></>}
    </div></div><div className="stage-nav" role="group" aria-label="Sample interview stages">{steps.map((s,i)=><button key={s} aria-pressed={stage===i} onClick={()=>setStage(i)}>{s}</button>)}</div>
  </div>
}
