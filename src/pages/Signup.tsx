import React from 'react';
import { Page, List, ListInput, Button } from 'konsta/react';
import { authClient } from '../lib/auth-client';
import { useNavigate, Link } from 'react-router-dom';
import { LoadingPlanet } from '../components/LoadingPlanet';
import { Sparkles, Mail, Lock, User as UserIcon, ArrowRight, Star } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
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

  return (
    <Page className="bg-slate-50 dark:bg-slate-950">
      {loading && <LoadingPlanet />}
      
      <div className="min-h-screen flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-600 mb-6 shadow-lg shadow-indigo-500/30">
            <Star className="w-10 h-10 text-white fill-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Begin Your Journey
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Create your account and unlock your cosmic destiny
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-slate-900 px-6 py-10 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800">
            {errorMessage && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-3 italic">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSignup();
              }}
              className="space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <UserIcon className="h-5 w-5 text-slate-400" />
                </div>
                <List strongIos insetIos className="m-0! p-0!">
                  <ListInput
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={name}
                    onInput={(e) => setName(e.target.value)}
                    className="pl-10!"
                  />
                </List>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <List strongIos insetIos className="m-0! p-0!">
                  <ListInput
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={email}
                    onInput={(e) => setEmail(e.target.value)}
                    className="pl-10!"
                  />
                </List>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <List strongIos insetIos className="m-0! p-0!">
                  <ListInput
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={password}
                    onInput={(e) => setPassword(e.target.value)}
                    className="pl-10!"
                  />
                </List>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  large
                  rounded
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 h-12 shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? 'Creating account...' : 'Start Your Journey'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </span>
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 underline decoration-indigo-200 underline-offset-4">
                  Login instead
                </Link>
              </p>
            </div>
          </div>
          
          <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            ✨ Your Cosmic Journey Awaits ✨
          </p>
        </div>
      </div>
    </Page>
  );
}
