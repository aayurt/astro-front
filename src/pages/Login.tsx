import React from 'react';
import { Page, List, ListInput, Button, Block } from 'konsta/react';
import { authClient } from '../lib/auth-client';
import { useNavigate, Link } from 'react-router-dom';
import { LoadingPlanet } from '../components/LoadingPlanet';
import { Sparkles, Mail, Lock, ArrowRight, Star } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });
      if (!error) {
        navigate('/dashboard');
      } else {
        setErrorMessage(
          error.message ||
            'The cosmic connection failed. Please check your credentials.',
        );
      }
    } catch (err: any) {
      setErrorMessage(
        'I am sorry, I am currently unable to access my celestial insights. Please try again later.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page className='bg-slate-50 dark:bg-slate-950'>
      {loading && <LoadingPlanet />}

      <div className='min-h-screen flex flex-col justify-center px-6 py-12 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-md text-center'>
          <div className='inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-600 mb-6 shadow-lg shadow-indigo-500/30'>
            <Star className='w-10 h-10 text-white fill-white animate-pulse' />
          </div>
          <h2 className='text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl'>
            Welcome Back
          </h2>
          <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
            Align with your stars and continue your journey
          </p>
        </div>

        <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='bg-white dark:bg-slate-900 px-6 py-10 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800'>
            {errorMessage && (
              <div className='mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-3 italic'>
                <Sparkles className='w-4 h-4 flex-shrink-0' />
                {errorMessage}
              </div>
            )}

            <div className='space-y-6'>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10'>
                  <Mail className='h-5 w-5 text-slate-400' />
                </div>
                <List strongIos insetIos className='m-0! p-0!'>
                  <ListInput
                    type='email'
                    placeholder='Email address'
                    value={email}
                    onInput={(e) => setEmail(e.target.value)}
                    className='pl-10!'
                  />
                </List>
              </div>

              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10'>
                  <Lock className='h-5 w-5 text-slate-400' />
                </div>
                <List strongIos insetIos className='m-0! p-0!'>
                  <ListInput
                    type='password'
                    placeholder='Password'
                    value={password}
                    onInput={(e) => setPassword(e.target.value)}
                    className='pl-10!'
                  />
                </List>
              </div>

              <div className='pt-2'>
                <Button
                  large
                  rounded
                  onClick={handleLogin}
                  disabled={loading}
                  className='bg-indigo-600 hover:bg-indigo-700 h-12 shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]'
                >
                  <span className='flex items-center justify-center gap-2'>
                    {loading ? 'Consulting the stars...' : 'Login to Dashboard'}
                    {!loading && <ArrowRight className='w-4 h-4' />}
                  </span>
                </Button>
              </div>
            </div>

            <div className='mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center'>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                New to the cosmos?{' '}
                <Link
                  to='/signup'
                  className='font-semibold text-indigo-600 hover:text-indigo-500 underline decoration-indigo-200 underline-offset-4'
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>

          <p className='mt-8 text-center text-xs text-slate-400 dark:text-slate-600 uppercase tracking-widest'>
            ✨ Trusted by Astrologers Everywhere ✨
          </p>
        </div>
      </div>
    </Page>
  );
}
