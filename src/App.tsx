import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import OnboardingPage from './pages/Onboarding';
import DashboardPage from './pages/Dashboard';
import AIPage from './pages/AI';
import BirthChartPage from './pages/BirthChart';
import TransitPage from './pages/Transit';
import ProfilePage from './pages/Profile';
import InvalidateCache from './pages/InvalidateCache';
import MainLayout from './components/MainLayout';
import { Page, Navbar, Block, Button } from 'konsta/react';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

function LandingPage() {
  return (
    <Page>
      <Navbar title='Astro App' />
      <Block strong className='text-center'>
        <h1 className='text-4xl font-bold'>Your Vedic Astrology Companion</h1>
        <p className='mt-4'>Explore your Natal, D9 charts and Yogini Dasha.</p>
        <Block className='flex space-x-4 justify-center mt-8'>
          <Button href='/login' large>
            Login
          </Button>
          <Button href='/signup' large outline>
            Sign Up
          </Button>
        </Block>
      </Block>
    </Page>
  );
}

function App() {
  const basename = import.meta.env.VITE_BASE_PATH || '/';
  return (
    <Router basename={basename}>
      <Routes>
        {/* Public Routes - Only accessible when NOT logged in */}
        <Route element={<PublicRoute />}>
          <Route path='/' element={<LandingPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/signup' element={<SignupPage />} />
        </Route>

        <Route path='/invalidate-cache' element={<InvalidateCache />} />

        {/* Protected Routes - Only accessible when logged in */}
        <Route element={<ProtectedRoute />}>
          <Route path='/onboarding' element={<OnboardingPage />} />
          <Route element={<MainLayout />}>
            <Route path='/dashboard' element={<DashboardPage />} />
            <Route path='/ai' element={<AIPage />} />
            <Route path='/ai/:id' element={<AIPage />} />
            <Route path='/birth-chart' element={<BirthChartPage />} />
            <Route path='/transit' element={<TransitPage />} />
            <Route path='/profile' element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path='*' element={<Navigate to='/' />} />
      </Routes>
    </Router>
  );
}

export default App;
