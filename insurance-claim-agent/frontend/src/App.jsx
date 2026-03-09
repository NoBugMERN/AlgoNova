import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';

// Import all your components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ClaimDetails from './components/ClaimDetails';
import NewClaim from './components/NewClaim';
import AppealCenter from './components/AppealCenter';
import History from './components/History';

function App() {
  // Hackathon Trick: Fake Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // This component acts as a bouncer. No ticket? Go to login.
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return (
      <div className="flex min-h-screen bg-slate-50">
        {/* Simple Global Sidebar for Navigation */}
        <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
          <h2 className="text-xl font-bold mb-8 text-blue-400">Claim Agent Pro</h2>
          <nav className="space-y-4">
            <Link to="/" className="block hover:text-blue-300">Dashboard</Link>
            <Link to="/new-claim" className="block hover:text-blue-300">+ New Claim</Link>
            <Link to="/appeals" className="block hover:text-blue-300">Appeal Center</Link>
            <Link to="/history" className="block hover:text-blue-300">History</Link>
            <button onClick={() => setIsAuthenticated(false)} className="block text-red-400 hover:text-red-300 mt-12 w-full text-left">Logout</button>
          </nav>
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/claim/:id" element={<ProtectedRoute><ClaimDetails /></ProtectedRoute>} />
        <Route path="/new-claim" element={<ProtectedRoute><NewClaim /></ProtectedRoute>} />
        <Route path="/appeals" element={<ProtectedRoute><AppealCenter /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;