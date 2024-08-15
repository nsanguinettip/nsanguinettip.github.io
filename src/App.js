import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useParams, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import TeamSelection from './components/TeamSelection';

function App() {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    username: '',
    teams: []
  });
  const [intendedPath, setIntendedPath] = useState(null);
  const [currentTeam, setCurrentTeam] = useState(null);

  useEffect(() => {
    const path = localStorage.getItem('intendedPath');
    if (path) {
      setIntendedPath(path);
      localStorage.removeItem('intendedPath');
    }
  }, []);

  const ProtectedRoute = ({ children }) => {
    const { team } = useParams();
    const location = useLocation();
    
    useEffect(() => {
      if (team !== currentTeam) {
        setCurrentTeam(team);
      }
    }, [team]);

    if (!auth.isAuthenticated) {
      localStorage.setItem('intendedPath', location.pathname);
      return <Navigate to="/login" />;
    }
    if (!auth.teams.includes(team)) {
      return <Navigate to="/unauthorized" />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setAuth={setAuth} intendedPath={intendedPath} />} />
        <Route 
          path="/select-team" 
          element={
            auth.isAuthenticated ? 
            <TeamSelection teams={auth.teams} /> : 
            <Navigate to="/login" />
          } 
        />
        <Route 
          path="/dashboard/:team" 
          element={
            <ProtectedRoute>
              <Dashboard auth={auth} setAuth={setAuth} currentTeam={currentTeam} />
            </ProtectedRoute>
          } 
        />
        <Route path="/unauthorized" element={<div>You don't have permission to access this team's dashboard.</div>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;