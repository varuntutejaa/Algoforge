import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ui/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Problems from './pages/Problems';
import Editor from './pages/Editor';
import Calendar from './pages/Calendar';
import Contests from './pages/Contests';
import ContestEditor from './pages/ContestEditor';
import ContestResults from './pages/ContestResults';
import Dashboard from './pages/Dashboard';
import Submissions from './pages/Submissions';
import Settings from './pages/Settings';

const FULLSCREEN_ROUTES = ['/editor/', '/contest-editor'];

function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r));
  // Footer only on the marketing surface — app views (problems, editor,
  // calendar, ...) manage their own full-height layouts.
  const showFooter = pathname === '/';
  return (
    <>
      {!isFullscreen && <Navbar />}
      {children}
      {showFooter && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Browsing is open. The actions that record something against an
              account — running or submitting code, joining or creating a
              contest, opening or saving a calendar entry — prompt for sign-in
              at the point of use instead of gating the page. */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/editor/:problemId" element={<Editor />} />
          <Route path="/contests" element={<Contests />} />

          {/* Inherently per-account: there is nothing to show without one. */}
          <Route element={<ProtectedRoute />}>
            <Route path="/contest-editor/:code" element={<ContestEditor />} />
            <Route path="/contest-results/:code" element={<ContestResults />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/submissions" element={<Submissions />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
