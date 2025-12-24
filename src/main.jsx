import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";

import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

// Filtrer les erreurs Socket.IO de Puter.js et WaveSurfer AbortError dans la console
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    const message = args[0];
    const firstArg = args[1];
    
    // Vérifier le message principal
    const messageStr = typeof message === 'string' ? message : String(message);
    
    // Vérifier le premier argument (souvent l'erreur elle-même)
    const firstArgStr = firstArg && typeof firstArg === 'string' ? firstArg : 
                        (firstArg && firstArg.message ? firstArg.message : '');
    const firstArgName = firstArg && firstArg.name ? firstArg.name : '';
    
    if (
      // Erreurs Puter.js Socket.IO
      messageStr.includes('socket.io') ||
      messageStr.includes('api.puter.com') ||
      messageStr.includes('WebSocket connection') ||
      messageStr.includes('EIO=4') ||
      firstArgStr.includes('socket.io') ||
      firstArgStr.includes('api.puter.com') ||
      firstArgStr.includes('WebSocket') ||
      // Erreurs WaveSurfer AbortError
      messageStr.includes('AbortError') ||
      messageStr.includes('signal is aborted') ||
      firstArgName === 'AbortError' ||
      (firstArg && firstArg.name === 'AbortError') ||
      // Timeouts Puter.js
      messageStr.includes('Timeout: Puter.js') ||
      messageStr.includes('Puter.js ne répond pas')
    ) {
      // Ignorer silencieusement ces erreurs
      return;
    }
    originalError.apply(console, args);
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
