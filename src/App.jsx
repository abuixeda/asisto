import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingVolume from './pages/LandingVolume';
import LandingAgency from './pages/LandingAgency';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<LandingVolume />} />
          <Route path="/premium" element={<LandingAgency />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    </Router>
  );
}

export default App;
