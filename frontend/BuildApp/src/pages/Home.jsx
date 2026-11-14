import React from 'react';
import InterviewFile from '../components/InterviewFile';
import InvitationArt from './InvitationArt';
import './home.css';

const questions = [
  ['When does the timer start?', 'You can read the invitation first. Your timer starts when you choose Join, and the same deadline applies if you reconnect.'],
  ['Can I change an answer?', 'Yes. Review and revise your choices before sending your final submission.'],
  ['Where will I find my result?', 'Once the host publishes your scorecard, you receive an email link. Sign in to see your answers, marks, and feedback.'],
];

export default function Home() {
  return <main id="content" className="home-page">
    <section className="home-hero">
      <div className="home-intro">
        <h1>An interview,<br/><em>from both sides.</em></h1>
        <p>Give candidates a clear brief, time to think, and feedback they can return to. Run the whole interview in Vettly.</p>
        <div className="home-links"><a className="home-cta" href="/signup">Create an account <span aria-hidden="true">↗</span></a><a href="#preview">Try the preview <span aria-hidden="true">↓</span></a></div>
      </div>
      <InvitationArt interactive/>
    </section>
    <section className="home-demo" aria-labelledby="demo-title">
      <div><h2 id="demo-title">Take a question<br/> for a <em>test run.</em></h2><p>Open the sample invitation, choose an answer, and see how it appears on a scorecard.</p></div>
      <InterviewFile/>
    </section>
    <section className="home-faq" id="questions"><h2>Before you join.</h2><div>{questions.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>
  </main>;
}

