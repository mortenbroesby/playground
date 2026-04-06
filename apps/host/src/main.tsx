import React from 'react';
import ReactDOM from 'react-dom/client';
import { HostApp } from './host-app';
import './globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HostApp />
  </React.StrictMode>,
);
