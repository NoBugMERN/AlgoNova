import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';

import Login      from './components/Login';
import Signup     from './components/Signup';
import Dashboard  from './components/Dashboard';
import ClaimDetails from './components/ClaimDetails';
import NewClaim   from './components/NewClaim';
import AppealCenter from './components/AppealCenter';
import History    from './components/History';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simple protected-route guard
  const Guard = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login"  element={<Login  onLogin={()  => setIsAuthenticated(true)} />} />
          <Route path="/signup" element={<Signup onSignup={() => setIsAuthenticated(true)} />} />

          {/* Protected */}
          <Route path="/"         element={<Guard><Dashboard  onLogout={() => setIsAuthenticated(false)} /></Guard>} />
          <Route path="/claim/:id" element={<Guard><ClaimDetails /></Guard>} />
          <Route path="/new-claim" element={<Guard><NewClaim /></Guard>} />
          <Route path="/appeals"   element={<Guard><AppealCenter /></Guard>} />
          <Route path="/history"   element={<Guard><History /></Guard>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;