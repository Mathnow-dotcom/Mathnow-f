import AdminBrand from './admin/AdminBrand.jsx';
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';
import { getWordProblemNextRoute } from '../utils/wordProblemProgress.js';
export default function WordProblemCompletion() {
 const navigate=useNavigate();const [error,setError]=useState('');const [retry,setRetry]=useState(0);
 const {childPin,selectedOperation,refreshOperationAndProgress}=useMathGamePick(ctx=>({childPin:ctx.childPin,selectedOperation:ctx.selectedOperation,refreshOperationAndProgress:ctx.refreshOperationAndProgress}));
 useEffect(()=>{if(!childPin||selectedOperation!=='add')return;let cancelled=false;setError('');
  getWordProblemNextRoute(childPin, refreshOperationAndProgress).then(route=>{
   if(!cancelled)navigate(route,{replace:true});
  }).catch(()=>{if(!cancelled)setError('Could not load your next activity. Please retry.');});return()=>{cancelled=true;};
 },[childPin,selectedOperation,retry,navigate]);
 if(!childPin)return <Navigate to="/name" replace/>;if(selectedOperation!=='add')return <Navigate to="/operations" replace/>;
 return <main className="classroom-transition-page word-belt-page"><AdminBrand className="classroom-screen-brand"/><section className="word-problem-card"><h1>Word Problems Complete!</h1><p role={error?'alert':'status'}>{error||'Loading your next activity…'}</p>{error&&<button onClick={()=>setRetry(v=>v+1)}>Retry</button>}</section></main>;
}
