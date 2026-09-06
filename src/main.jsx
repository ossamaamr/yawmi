// ══════════════════════════════════════════════════════════
// main.jsx — نقطة الدخول
// ══════════════════════════════════════════════════════════
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { TaskProvider } from './context/TaskContext';
import { SettingsProvider } from './context/SettingsContext';
import './index.css';

// HashRouter مناسب لتطبيقات Capacitor (لا حاجة لخادم)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SettingsProvider>
      <TaskProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </TaskProvider>
    </SettingsProvider>
  </React.StrictMode>
);