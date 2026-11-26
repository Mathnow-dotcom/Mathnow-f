import React, { useEffect, useRef, useState } from 'react';
import AdminBrand from './admin/AdminBrand.jsx';
import '../styles/ActiveRun.css';
import '../styles/WordProblems.css';
export default function WordProblemQuestion({question,index,progress,paused,disabled,onAnswer,remainingMs,onTimeout}) {
 const [step,setStep]=useState(0);const [input,setInput]=useState('');const expired=useRef(false);
 useEffect(()=>{setStep(0);setInput('');},[question?.id]);
 useEffect(()=>{if(remainingMs<=0&&!expired.current){expired.current=true;onTimeout();}},[remainingMs,onTimeout]);
 const statements=question?.statements||[];const final=step===statements.length-1;
 const locked=paused||disabled;
 const backButton = step > 0 && (
  <button type="button" className="word-secondary" disabled={locked} onClick={() => setStep(step - 1)}>← Back</button>
 );
 return <main className="classroom-active-page word-belt-page"><AdminBrand className="classroom-screen-brand"/>
  <section className="word-problem-card" aria-label="Word problem">
   
   <progress max="100" value={progress} aria-label="Quiz progress"/>
   <h1 className="word-problem-statement" aria-live="polite">{statements[step]||'Loading question…'}</h1>
   {!final ? <div className="word-problem-actions">
    {backButton}
    <button type="button" disabled={locked || !statements.length} onClick={() => setStep(step + 1)}>Next →</button>
   </div> : <form onSubmit={e=>{e.preventDefault();if(input!==''&&!locked)onAnswer(Number(input));}}>
    
    <input id="word-answer" autoComplete="off" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={input} disabled={locked} onChange={e=>setInput(e.target.value.replace(/[^0-9]/g,''))}/>
    <div className="word-keypad">{[1,2,3,4,5,6,7,8,9,'Clear',0,'⌫'].map(key=><button type="button" key={key} disabled={locked} onClick={()=>setInput(value=>key==='Clear'?'':key==='⌫'?value.slice(0,-1):value.length<4?value+key:value)}>{key}</button>)}</div>
    <div className="word-problem-actions">
     {backButton}
     <button type="submit" disabled={locked || input === ''}>Submit</button>
    </div>
   </form>}
  </section>
 </main>;
}
