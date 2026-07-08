import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/ui/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

// Protected pages
import Problems from './pages/Problems';
import Editor from './pages/Editor';
import Calendar from './pages/Calendar';
import Contests from './pages/Contests';
import ContestEditor from './pages/ContestEditor';
import ContestResults from './pages/ContestResults';
import Dashboard from './pages/Dashboard';
import Submissions from './pages/Submissions';

// Pages that show the Navbar vs full-screen pages (editor, contest-editor)
const FULLSCREEN_ROUTES = ['/editor/', '/contest-editor'];

function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r));
  return (
    <>
      {!isFullscreen && <Navbar />}
      {children}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/problems" element={<Problems />} />
            <Route path="/editor/:problemId" element={<Editor />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/contests" element={<Contests />} />
            <Route path="/contest-editor/:code" element={<ContestEditor />} />
            <Route path="/contest-results/:code" element={<ContestResults />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/submissions" element={<Submissions />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
