import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import { LoadingPlanet } from '../components/LoadingPlanet';
import { Input } from '../components/modern-ui/input';
import { Button } from '../components/modern-ui/button';
import { Sparkles, Mail, Lock, User as UserIcon, ArrowRight, Star } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa6';
import { toast } from 'sonner';

export default function SignupPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setErrorMessage('Please fill in all celestial details.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
      });
      if (!error) {
        toast.success('Welcome to the cosmos!');
        navigate('/onboarding');
      } else {
        setErrorMessage(error.message || 'The cosmic connection failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage('I am sorry, I am currently unable to access my celestial insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: import.meta.env.VITE_FRONTEND_URL + "/onboarding"
      });
      if (error) {
        setErrorMessage(error.message || 'Google sign-up failed. Please try again.');
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMessage('I am sorry, I am currently unable to access my celestial insights. Please try again later.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-12">
      {(loading || googleLoading) && <LoadingPlanet />}

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-600 mb-6 shadow-lg shadow-primary-500/30">
          <Star className="w-10 h-10 text-white fill-white animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Begin Your Journey
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Create your account and unlock your cosmic destiny
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-6 py-10 shadow-xl rounded-2xl border border-gray-200">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3 italic">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              {errorMessage}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSignup();
            }}
            className="space-y-5"
          >
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <Input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? 'Creating account...' : 'Start Your Journey'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              disabled={googleLoading}
              onClick={handleGoogleSignup}
              className="w-full"
            >
              <span className="flex items-center justify-center gap-2 text-gray-700">
                {googleLoading ? 'Connecting to Google...' : <><FaGoogle className="w-5 h-5" /> Continue with Google</>}
              </span>
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 underline decoration-primary-200 underline-offset-4">
                Login instead
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400 uppercase tracking-widest">
          ✨ Your Cosmic Journey Awaits ✨
        </p>
      </div>
    </div>
  );
}
