import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AdminBrand from './admin/AdminBrand.jsx';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';
import '../styles/ClassroomTransitions.css';
import '../styles/WordProblems.css';
export default function WordProblemBelt() {
 const navigate=useNavigate();
 const [starting,setStarting]=useState(false);
 const start=async()=>{if(starting)return;setStarting(true);try{await startQuizWithDifficulty('word-problems',selectedTable);}finally{setStarting(false);}};
 const {selectedOperation,selectedTable,tableProgress,startQuizWithDifficulty,isQuizStarting}=useMathGamePick(ctx=>({selectedOperation:ctx.selectedOperation,selectedTable:ctx.selectedTable,tableProgress:ctx.tableProgress||{},startQuizWithDifficulty:ctx.startQuizWithDifficulty,isQuizStarting:ctx.isQuizStarting}));
 if(selectedOperation!=='add'||!selectedTable)return <Navigate to="/levels" replace/>;
 const level=tableProgress[`L${selectedTable}`];
 const unlocked=level?.black?.completedDegrees?.some(d=>Number(d)===7);
 return <main className="classroom-transition-page word-belt-page"><AdminBrand className="classroom-screen-brand"/>
  <section className="word-problem-card"><span className="word-problem-eyebrow">Addition · Level {selectedTable}</span><h1>Word Problems</h1>
   <p>Read one statement at a time. Tap Next, then type your answer.</p>
   
   {!unlocked&&<p>Complete Black Belt Degree 7 to unlock this belt.</p>}
   <button disabled={!unlocked||isQuizStarting||starting} onClick={start}>{isQuizStarting||starting?'Loading…':'Start Word Problems'}</button>
   <button className="word-secondary" onClick={()=>navigate('/black')}>Back to Black Belts</button>
  </section>
 </main>;
}
