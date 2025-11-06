import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import ChatLayout from './components/ChatLayout';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <ChatLayout />
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
