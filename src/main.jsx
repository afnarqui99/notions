import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>Error al cargar la aplicación</h1>
      <p>${error.message}</p>
      <pre>${error.stack}</pre>
    </div>
  `;
}





