import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Callback from './pages/auth/Callback';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Feedback from './pages/user/Feedback';
import ComplaintForm from './pages/user/ComplaintForm';
import Home from './pages/user/Home';
import Mycomplaint from './pages/user/MyComplaint';
import DiscussionForum from './pages/user/DiscussionForum';
import WardAdminDashboard from "./pages/subAdmin/WardAdminDashboard";
// Admin components
import AdminDashboard from './pages/admin/Dashboard';

const RootRedirect = () => {
  const hasOAuthHash = window.location.hash.includes('access_token');
  return <Navigate to={hasOAuthHash ? '/auth/callback' : '/login'} replace />;
};

function App() {
  return (
    <Router>
      {/* Toast notifications */}
      <Toaster position="top-right" />
      
      {/* Main routes */}
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<Callback />} />

        {/* User routes */}
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/complaint" element={<ComplaintForm />} />
        <Route path="/home" element={<Home />} />
        <Route path="/mycomplaints" element={<Mycomplaint />} />
        <Route path="/forum" element={<DiscussionForum />} />

        {/* Admin routes - nested under AdminLayout */}
        <Route path="/dashboard" element={<AdminDashboard />} />
        
          <Route path="/ward-dashboard" element={<WardAdminDashboard />} />

        {/* Redirects */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;