import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './diagnostics/ErrorBoundary.jsx';
import { installErrorLogging } from './diagnostics/errorLogging.js';
installErrorLogging();
import './styles/index.css';
import './styles/App.css';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary><App /></ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
);