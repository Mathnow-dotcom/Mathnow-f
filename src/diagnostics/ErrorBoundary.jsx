import React from 'react';
import { reportError } from './errorLogging.js';
export default class ErrorBoundary extends React.Component {
  state = { failed:false };
  static getDerivedStateFromError() { return { failed:true }; }
  componentDidCatch(error) { reportError('react', error); }
  render() {
    if (this.state.failed) return <main style={{padding:'2rem',textAlign:'center',background:'#fff',color:'#173f70',minHeight:'100vh'}}>
      <h1>Something went wrong</h1><p>Please reload MathNow to continue.</p><button onClick={() => location.reload()}>Reload MathNow</button>
    </main>;
    return this.props.children;
  }
}
