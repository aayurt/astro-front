import {
  Route,
  BrowserRouter as Router,
  Routes,
  Navigate,
} from 'react-router-dom';
import { Toaster } from './components/modern-ui/sonner';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import AIPage from './pages/AI';
import BirthChartPage from './pages/BirthChart';
import DashboardPage from './pages/Dashboard';
import InvalidateCache from './pages/InvalidateCache';
import LoginPage from './pages/Login';
import OnboardingPage from './pages/Onboarding';
import ProfilePage from './pages/Profile';
import SignupPage from './pages/Signup';
import TransitPage from './pages/Transit';
import PanchangPage from './pages/Panchang';
import RemediesPage from './pages/Remedies';

function App() {
  const basename = import.meta.env.VITE_BASE_PATH || '/';
  return (
    <>
      <Router basename={basename}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path='/login' element={<LoginPage />} />
            <Route path='/signup' element={<SignupPage />} />
          </Route>

          <Route path='/invalidate-cache' element={<InvalidateCache />} />
          <Route path='/reset' element={<InvalidateCache />} />

          <Route element={<ProtectedRoute />}>
            <Route path='/onboarding' element={<OnboardingPage />} />
            <Route element={<MainLayout />}>
              <Route path='/dashboard' element={<DashboardPage />} />
              <Route path='/ai' element={<AIPage />} />
              <Route path='/ai/:id' element={<AIPage />} />
              <Route path='/birth-chart' element={<BirthChartPage />} />
              <Route path='/transit' element={<TransitPage />} />
              <Route path='/panchang' element={<PanchangPage />} />
              <Route path='/remedies' element={<RemediesPage />} />
              <Route path='/profile' element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path='*' element={<Navigate to='/login' />} />
        </Routes>
      </Router>
      <Toaster />
    </>
  );
}

export default App;
