import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

window.onerror = function (msg, url, lineNo, columnNo, error) {
  const errDiv = document.createElement('div');
  errDiv.style = 'position:fixed;top:0;left:0;right:0;bottom:0;background:red;color:white;z-index:999999;padding:40px;overflow:auto;font-family:monospace;';
  errDiv.innerHTML = `<h1>Global Error</h1><p>${msg}</p><pre>${error?.stack}</pre>`;
  document.body.appendChild(errDiv);
  return false;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
