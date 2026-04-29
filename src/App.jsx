import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingVolume from './pages/LandingVolume';
import LandingAgency from './pages/LandingAgency';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import MerchantPanel from './pages/MerchantPanel';
import Login from './pages/Login';
import LoginAgency from './pages/LoginAgency';
import OAuthCallback from './pages/OAuthCallback';

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<LandingVolume />} />
          <Route path="/premium" element={<LandingAgency />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-premium" element={<LoginAgency />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/mi-panel" element={<MerchantPanel />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    </Router>
  );
}

export default App;
